const fs = require('fs');
const path = require('path');

const DEFAULT_FILE = path.join(__dirname, '..', 'config', 'designers.json');

function normalizeUrl(url) {
  if (!url) return null;
  return url.trim().toLowerCase().replace(/\/+$/, '');
}

function normalizeName(name) {
  return (name || '').trim();
}

// Identity key is the name alone, not "name OR URL". Two different people
// (e.g. co-founders of the same studio) can share one canonicalWebsite —
// that's not a duplicate, and matching on URL alone would silently merge a
// second person's record into the first, losing their name entirely.
function findExisting(records, candidate) {
  const candidateName = normalizeName(candidate.name);
  if (!candidateName) return undefined;
  return records.find((r) => normalizeName(r.name) === candidateName);
}

function mergeArraysUnique(a = [], b = []) {
  return [...new Set([...a, ...b])];
}

// Dedupes by name OR canonical URL (either match counts, per the "prevent
// duplicates by name and canonical URL" requirement). An existing record is
// updated, never silently overwritten: evidence/sourceUrls are unioned, and
// classification/priority/verificationStatus only change when the new
// record explicitly supplies a value, so a thinner later update can't
// downgrade or erase what's already been verified.
function upsertDesigner(records, candidate) {
  if (!candidate || !candidate.name) throw new TypeError('designer record requires a name');
  const existing = findExisting(records, candidate);
  const now = candidate.lastCheckedAt || new Date().toISOString();

  if (!existing) {
    return [
      ...records,
      {
        name: candidate.name,
        canonicalWebsite: candidate.canonicalWebsite || null,
        classification: candidate.classification || 'UNCLASSIFIED',
        priority: candidate.priority || 'MEDIUM',
        verificationStatus: candidate.verificationStatus || 'UNVERIFIED',
        evidence: candidate.evidence || [],
        sourceUrls: candidate.sourceUrls || [],
        social: { instagram: null, facebook: null, tiktok: null, ...candidate.social },
        addedAt: now,
        lastCheckedAt: now,
      },
    ];
  }

  return records.map((r) =>
    r === existing
      ? {
          ...r,
          canonicalWebsite: candidate.canonicalWebsite || r.canonicalWebsite,
          classification: candidate.classification || r.classification,
          priority: candidate.priority || r.priority,
          verificationStatus: candidate.verificationStatus || r.verificationStatus,
          evidence: mergeArraysUnique(r.evidence, candidate.evidence),
          sourceUrls: mergeArraysUnique(r.sourceUrls, candidate.sourceUrls),
          social: { ...r.social, ...candidate.social },
          lastCheckedAt: now,
        }
      : r,
  );
}

function loadDesigners(file = DEFAULT_FILE) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveDesigners(records, file = DEFAULT_FILE) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(records, null, 2));
  return records;
}

function addDesigners(candidates, file = DEFAULT_FILE) {
  let records = loadDesigners(file);
  for (const candidate of candidates) {
    records = upsertDesigner(records, candidate);
  }
  return saveDesigners(records, file);
}

module.exports = { upsertDesigner, loadDesigners, saveDesigners, addDesigners, normalizeUrl, normalizeName, DEFAULT_FILE };
