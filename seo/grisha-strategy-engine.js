// Entry point for the "Grisha Strategy Engine" Windows Scheduled Task
// (daily, 05:00). This file previously did not exist, which made that task
// fail every day since 2026-10-10 (MODULE_NOT_FOUND) — see
// knowledge-base/learning-loop/LEARNING_LOG.md, 2026-10-16 entry.
//
// It is a once-a-day rollup, not a second scanner: it reads what the
// hourly designer-scan engine (run-designer-scan.js) already verified
// (snapshot coverage, the last 24h of grisha-handoff reports, provider
// status) and writes one short digest. No network calls, no new scoring
// logic, nothing that touches spend or publishing.
const fs = require('fs');
const path = require('path');
const { indexDesigners } = require('./lib/designerScanState');
const { SnapshotStore } = require('./lib/snapshotStore');
const { listProviderStatus } = require('./lib/providers');
const { buildStrategyDigest, deliverDigest } = require('./lib/strategyDigest');

const DESIGNERS_FILE = path.join(__dirname, 'config', 'designers.json');
const SNAPSHOT_DIR = path.join(__dirname, 'data', 'snapshots');
const HANDOFF_DIR = path.join(__dirname, 'data', 'grisha-handoff');
const KB_FILE = path.join(__dirname, '..', 'knowledge-base', 'intelligence', 'grisha-strategy-digest.md');
const INDEX_FILE = path.join(__dirname, 'data', 'strategy-digest-delivered.json');
const LOOKBACK_MS = 24 * 60 * 60 * 1000;

function loadRecentHandoffReports(dir, sinceMs) {
  if (!fs.existsSync(dir)) return [];
  const cutoff = Date.now() - sinceMs;
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      } catch {
        return null; // a malformed/partial file is skipped, not fatal to the digest
      }
    })
    .filter((r) => r && r.generatedAt && new Date(r.generatedAt).getTime() >= cutoff);
}

function countScannedTargets(designers, store) {
  const unique = indexDesigners(designers, { onSkipped: () => {} });
  let scanned = 0;
  for (const designer of unique.values()) {
    const target = designer.canonicalWebsite || designer.website;
    if (target && store.loadLatest(target)) scanned += 1;
  }
  return { uniqueCount: unique.size, scanned };
}

function main() {
  const designers = JSON.parse(fs.readFileSync(DESIGNERS_FILE, 'utf8'));
  if (!Array.isArray(designers)) throw new Error('designers.json must contain a JSON array.');

  const store = new SnapshotStore({ dir: SNAPSHOT_DIR });
  const { uniqueCount, scanned } = countScannedTargets(designers, store);
  const handoffReportsLast24h = loadRecentHandoffReports(HANDOFF_DIR, LOOKBACK_MS);
  const providerStatus = listProviderStatus();

  const digest = buildStrategyDigest({
    designers,
    scanTargetCount: uniqueCount,
    scannedTargetCount: scanned,
    handoffReportsLast24h,
    providerStatus,
  });

  const result = deliverDigest(digest, { indexFile: INDEX_FILE, kbFile: KB_FILE });
  if (result.delivered) {
    console.log(`Strategy digest written for ${result.date} -> ${result.kbFile}`);
  } else {
    console.log(`Strategy digest for ${digest.date} already delivered today — skipped duplicate.`);
  }
  process.exitCode = 0;
}

try {
  main();
} catch (error) {
  console.error('Strategy engine failed:', error);
  process.exitCode = 1;
}
