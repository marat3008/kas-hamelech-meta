const fs = require('fs');
const path = require('path');
const {
  indexDesigners,
  ensureRecords,
  selectEligible,
  createState,
  isValidState,
  buildScanTargetAssociations,
  startNewCampaign,
  DEFAULT_CACHE_TTL_MS,
} = require('./lib/designerScanState');
const { loadState, saveStateAtomic, acquireLock, releaseLock } = require('./lib/scanStateStore');
const { scanTarget } = require('./lib/scheduler');
const { SnapshotStore } = require('./lib/snapshotStore');
const { buildHandoffReport, deliverReport } = require('./lib/grishaHandoff');

const DESIGNERS_FILE = path.join(__dirname, 'config', 'designers.json');
const STATE_FILE = path.join(__dirname, 'data', 'designer-scan-state.json');
const LOCK_FILE = `${STATE_FILE}.lock`;
const SNAPSHOT_DIR = path.join(__dirname, 'data', 'snapshots');
const KB_FEED_FILE = path.join(__dirname, '..', 'knowledge-base', 'intelligence', 'grisha-intelligence-feed.md');

const BATCH_SIZE = Number(process.env.SEO_DESIGNER_BATCH_SIZE) || 3;
const CONCURRENCY = Number(process.env.SEO_DESIGNER_CONCURRENCY) || 2;
const MAX_ATTEMPTS = Number(process.env.SEO_DESIGNER_MAX_ATTEMPTS) || 3; // cross-run eligibility for a failed target
const RETRY_LIMIT = Number(process.env.SEO_DESIGNER_RETRY_LIMIT) || 3; // in-run retries for a transient failure
const CACHE_TTL_MS = Number(process.env.SEO_DESIGNER_CACHE_TTL_MS) || DEFAULT_CACHE_TTL_MS;
const NEW_CAMPAIGN = process.env.SEO_DESIGNER_NEW_CAMPAIGN === '1';

// Only retry reasons that are plausibly transient (a flaky connection/timeout).
// A dead domain (dns_resolution_failed) or an SSRF block won't fix itself by
// retrying immediately, so retrying those would just waste the time budget.
const TRANSIENT_REASONS = new Set(['request_failed']);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scanWithRetry(target, store) {
  let result;
  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
    result = await scanTarget(target, { store });
    if (result.ok || !TRANSIENT_REASONS.has(result.reason) || attempt === RETRY_LIMIT) return result;
    await sleep(500 * 2 ** (attempt - 1));
  }
  return result;
}

async function runWithConcurrency(items, concurrency, worker) {
  let next = 0;
  async function run() {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, run));
}

async function main() {
  if (!acquireLock(LOCK_FILE)) {
    console.log('Another designer-scan run is already in progress (lock held). Exiting.');
    return;
  }

  try {
    const designers = JSON.parse(fs.readFileSync(DESIGNERS_FILE, 'utf8'));
    if (!Array.isArray(designers)) throw new Error('designers.json must contain a JSON array.');

    let state = loadState(STATE_FILE, createState);
    if (!isValidState(state)) {
      console.warn('Invalid scan state on disk — starting a fresh campaign.');
      state = createState();
    }

    if (NEW_CAMPAIGN) {
      console.log(`SEO_DESIGNER_NEW_CAMPAIGN=1 — starting a new campaign (was: ${state.campaignId}). Snapshot history is preserved.`);
      state = startNewCampaign(state);
    }

    const unique = indexDesigners(designers, {
      onSkipped: (d) => console.warn('Skipping designer without a valid identifier:', d && d.name),
    });
    const associations = buildScanTargetAssociations(designers);
    ensureRecords(state, unique.keys());
    saveStateAtomic(STATE_FILE, state);

    const eligible = selectEligible(state, [...unique.keys()], { maxAttempts: MAX_ATTEMPTS, cacheTtlMs: CACHE_TTL_MS });
    const batch = eligible.slice(0, Math.max(1, BATCH_SIZE));

    console.log(`Campaign: ${state.campaignId}`);
    console.log(`Designer records: ${designers.length} | Unique scan targets: ${unique.size}`);
    console.log(`Eligible this run: ${eligible.length} | Selected batch: ${batch.length} (concurrency ${CONCURRENCY})`);

    if (batch.length === 0) {
      console.log('No eligible designers. Campaign scan is complete.');
      process.exitCode = 0;
      return;
    }

    // Reserve the whole batch (and persist that reservation) before scanning
    // anything, so a crash mid-scan is visible as "in_progress", not lost.
    for (const key of batch) {
      state.records[key].status = 'in_progress';
      state.records[key].attempts += 1;
    }
    saveStateAtomic(STATE_FILE, state);

    const store = new SnapshotStore({ dir: SNAPSHOT_DIR });
    const batchOutcomes = [];
    let successCount = 0;
    let failureCount = 0;

    await runWithConcurrency(batch, CONCURRENCY, async (key) => {
      const designer = unique.get(key);
      const target = designer.canonicalWebsite || designer.website;
      const record = state.records[key];
      const names = associations.get(key)?.designerNames || [designer.name];
      const label = names.length > 1 ? `${key} (designers: ${names.join(', ')})` : key;

      if (!target) {
        record.status = 'failed';
        record.lastError = 'no_website';
        record.lastScanAt = new Date().toISOString();
        saveStateAtomic(STATE_FILE, state);
        batchOutcomes.push({ key, target: null, ok: false, reason: 'no_website' });
        failureCount += 1;
        console.log(`[${label}] FAILED - no website on record.`);
        return;
      }

      const result = await scanWithRetry(target, store);
      record.lastScanAt = new Date().toISOString();
      batchOutcomes.push({ key, ...result });

      if (result.ok) {
        record.status = 'completed';
        record.attempts = 0; // reset the consecutive-failure counter on success
        delete record.lastError;
        successCount += 1;
        const summary = result.notModified
          ? 'not modified (cached)'
          : result.diff.isFirstObservation
            ? 'baseline recorded'
            : result.diff.changed
              ? `changed: ${result.diff.changedFields.join(', ')}`
              : 'no change';
        console.log(`[${label}] completed - ${summary}.`);
      } else {
        record.status = 'failed';
        record.lastError = result.reason;
        failureCount += 1;
        console.log(`[${label}] FAILED - ${result.reason}.`);
      }

      // Persisted as soon as this designer's real result is known — never
      // marked done speculatively, and never lost if another worker throws.
      saveStateAtomic(STATE_FILE, state);
    });

    // Hand off only verified, materially-changed findings. "Grisha" has no
    // running process/API in this project — this writes the knowledge-base
    // file a future Claude-as-Grisha session reads, which is the real
    // existing mechanism (see knowledge-base/grisha-master-knowledge.md).
    const report = buildHandoffReport({ campaignId: state.campaignId, batchResults: batchOutcomes, associations });
    const delivery = deliverReport(report, { kbFile: KB_FEED_FILE });
    if (delivery.delivered) {
      console.log(`Handoff: ${report.findingsCount} finding(s) -> ${delivery.jsonPath}`);
      console.log(`Knowledge-base feed updated: ${KB_FEED_FILE}`);
    } else {
      console.log(`Handoff: report ${report.reportId} already delivered — skipped duplicate.`);
    }

    if (failureCount > 0 && successCount === 0) {
      process.exitCode = 1; // total failure
    } else if (failureCount > 0) {
      process.exitCode = 2; // partial completion
    } else {
      process.exitCode = 0;
    }
  } finally {
    releaseLock(LOCK_FILE);
  }
}

main().catch((error) => {
  console.error('Designer scanning orchestration failed:', error);
  process.exitCode = 1;
});
