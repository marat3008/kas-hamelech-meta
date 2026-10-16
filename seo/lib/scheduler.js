const cron = require('node-cron');
const path = require('path');
const { safeFetch } = require('./safeFetch');
const { extractSignals } = require('./htmlSignals');
const { diffSignals } = require('./snapshotDiff');
const { buildAlerts } = require('./changeAlerts');
const { buildReport } = require('./report');
const { SnapshotStore } = require('./snapshotStore');

const DEFAULT_DATA_DIR = path.join(__dirname, '..', 'data', 'snapshots');

// Fetches one target, diffs it against its last stored snapshot, persists
// the new one to disk, and returns a report. Never throws for a single
// target's failure (network error, SSRF block, non-200) — it's recorded in
// the result instead, so one bad target can't stop the rest of the batch.
//
// Sends If-None-Match/If-Modified-Since from the last stored snapshot when
// available, so an unchanged page costs a conditional request instead of a
// full fetch. A 304 is reported as "not changed" using the *previous*
// signals — it must never be treated as a real page body, or every field
// would look like it changed to empty/null.
async function scanTarget(target, { store, fetch = safeFetch, now = () => new Date().toISOString() } = {}) {
  const previous = store.loadLatest(target);
  const conditionalHeaders = {};
  if (previous?.etag) conditionalHeaders['If-None-Match'] = previous.etag;
  if (previous?.lastModified) conditionalHeaders['If-Modified-Since'] = previous.lastModified;

  const fetchResult = await fetch(target, Object.keys(conditionalHeaders).length ? { headers: conditionalHeaders } : {});
  if (!fetchResult.ok) {
    return { target, ok: false, reason: fetchResult.reason, generatedAt: now() };
  }

  const observedAt = now();

  if (fetchResult.statusCode === 304 && previous) {
    const diff = { changed: false, isFirstObservation: false, changedFields: [], contentHash: previous.contentHash };
    return {
      target,
      ok: true,
      ...buildReport({ target, signals: previous.signals, diff, alerts: [], generatedAt: observedAt }),
      notModified: true,
    };
  }

  const signals = extractSignals(fetchResult.body);
  const diff = diffSignals(previous ? previous.signals : null, signals);
  const alerts = buildAlerts(target, diff);

  store.append(target, {
    observedAt,
    signals,
    contentHash: diff.contentHash,
    etag: fetchResult.headers?.etag || null,
    lastModified: fetchResult.headers?.['last-modified'] || null,
  });

  return { target, ok: true, ...buildReport({ target, signals, diff, alerts, generatedAt: observedAt }) };
}

async function runScanJob(targets, { dataDir = DEFAULT_DATA_DIR, store, ...scanOptions } = {}) {
  const snapshotStore = store || new SnapshotStore({ dir: dataDir });
  const results = [];
  for (const target of targets) {
    results.push(await scanTarget(target, { store: snapshotStore, ...scanOptions }));
  }
  return results;
}

// Thin wrapper around node-cron. `cronLib` and `runScan` are injectable so
// tests capture the scheduled callback and invoke it manually instead of
// registering a real timer.
function startScheduler({ cronExpression, targets, dataDir = DEFAULT_DATA_DIR, cronLib = cron, runScan = runScanJob, onResult }) {
  if (typeof cronLib.validate === 'function' && !cronLib.validate(cronExpression)) {
    throw new Error(`invalid cron expression: ${cronExpression}`);
  }
  return cronLib.schedule(cronExpression, async () => {
    const results = await runScan(targets, { dataDir });
    if (onResult) onResult(results);
  });
}

module.exports = { scanTarget, runScanJob, startScheduler, DEFAULT_DATA_DIR };
