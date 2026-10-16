const { canonicalizeUrl } = require('./urlCanonical');

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'failed'];
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Prefers an explicit id, then the site's bare hostname (www-stripped), then
// the normalized name — mirrors the scaffold, adapted to this repo's actual
// field name (`canonicalWebsite`, with `website` kept as a fallback alias).
function designerKey(designer) {
  if (designer.id && String(designer.id).trim()) return String(designer.id).trim();

  const site = designer.canonicalWebsite || designer.website;
  if (site && String(site).trim()) {
    try {
      const url = new URL(site.startsWith('http') ? site : `https://${site}`);
      return url.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      // Fall through to the normalized name.
    }
  }

  if (designer.name && String(designer.name).trim()) {
    return designer.name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  throw new Error('Designer has no stable identifier.');
}

function isValidState(state) {
  return Boolean(
    state &&
      typeof state.campaignId === 'string' &&
      state.records &&
      typeof state.records === 'object' &&
      !Array.isArray(state.records),
  );
}

function createState(campaignId = new Date().toISOString()) {
  return { campaignId, records: {} };
}

// Dedupes designers by stable key, keeping the first occurrence as the scan
// representative — two people sharing one studio site collapse to ONE scan
// key (no point fetching the same page twice), which is why
// buildScanTargetAssociations below exists: it recovers every name behind
// a shared key for reporting, without re-scanning the page per person.
// Entries with no usable identifier are skipped, not thrown — one bad row
// shouldn't abort the run.
function indexDesigners(designers, { onSkipped } = {}) {
  const unique = new Map();
  for (const designer of designers) {
    if (!designer || typeof designer !== 'object') continue;
    try {
      const key = designerKey(designer);
      if (!unique.has(key)) unique.set(key, designer);
    } catch (err) {
      if (onSkipped) onSkipped(designer, err);
    }
  }
  return unique;
}

function ensureRecords(state, keys) {
  for (const key of keys) {
    state.records[key] ??= { status: 'pending', attempts: 0 };
  }
  return state;
}

// Recovers jobs left "in_progress" by a crashed prior run; stops retrying a
// "failed" job once it has exhausted maxAttempts; and reselects a
// "completed" job once it has gone stale past cacheTtlMs, so competitor
// pages actually get rechecked over time instead of being scanned once ever.
// `options` can be a plain number for backward compatibility (legacy
// maxAttempts-only call), which also disables staleness-based reselection.
function selectEligible(state, keys, options = {}) {
  const isLegacyNumber = typeof options === 'number';
  const maxAttempts = isLegacyNumber ? options : options.maxAttempts ?? 3;
  const cacheTtlMs = isLegacyNumber ? Infinity : options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const now = (!isLegacyNumber && options.now) || (() => Date.now());

  return keys.filter((key) => {
    const record = state.records[key];
    if (record.status === 'pending' || record.status === 'in_progress') return true;
    if (record.status === 'failed') return record.attempts < maxAttempts;
    if (record.status === 'completed' && record.lastScanAt) {
      return now() - new Date(record.lastScanAt).getTime() >= cacheTtlMs;
    }
    return false;
  });
}

// Associates every scan key with the designer name(s) that map to it (for
// shared-studio reporting) and the distinct canonicalized URLs seen under
// that key. This is purely additive/read-only: it does NOT change what key
// scan state is stored under (that stays designerKey's hostname, unchanged,
// so re-keying can never orphan already-completed scan history).
function buildScanTargetAssociations(designers) {
  const byKey = new Map();
  for (const designer of designers) {
    if (!designer || typeof designer !== 'object') continue;
    let key;
    try {
      key = designerKey(designer);
    } catch {
      continue;
    }
    if (!byKey.has(key)) byKey.set(key, { key, canonicalUrls: new Set(), designerNames: [] });
    const entry = byKey.get(key);
    entry.designerNames.push(designer.name);

    const site = designer.canonicalWebsite || designer.website;
    if (site) {
      try {
        entry.canonicalUrls.add(canonicalizeUrl(site));
      } catch {
        // Unparseable site URL - association by name still stands.
      }
    }
  }
  return byKey;
}

// Starts a fresh campaign: new campaignId, every known scan key reset to
// pending/0-attempts. Snapshot history (a separate store) is never touched,
// so historical evidence survives a reset untouched. Opt-in only - never
// called automatically.
function startNewCampaign(state) {
  const fresh = createState();
  for (const key of Object.keys(state.records)) {
    fresh.records[key] = { status: 'pending', attempts: 0 };
  }
  return fresh;
}

module.exports = {
  VALID_STATUSES,
  DEFAULT_CACHE_TTL_MS,
  designerKey,
  isValidState,
  createState,
  indexDesigners,
  ensureRecords,
  selectEligible,
  buildScanTargetAssociations,
  startNewCampaign,
};
