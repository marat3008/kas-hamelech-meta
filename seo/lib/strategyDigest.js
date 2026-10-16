const fs = require('fs');
const path = require('path');

function dateKey(iso) {
  return iso.slice(0, 10); // YYYY-MM-DD
}

// Pure aggregation: a once-daily rollup composed entirely from numbers other,
// already-tested parts of this system produced (scan coverage, the hourly
// handoff reports, provider status). It invents no new scoring or strategic
// claims of its own — that judgement stays with the owner/Grisha session
// reading the digest, same limitation the hourly handoff already states.
function buildStrategyDigest({
  designers,
  scanTargetCount,
  scannedTargetCount,
  handoffReportsLast24h,
  providerStatus,
  now = () => new Date().toISOString(),
}) {
  const generatedAt = now();

  let newBaselines = 0;
  let changed = 0;
  for (const report of handoffReportsLast24h) {
    for (const finding of report.findings || []) {
      if (finding.status === 'new_baseline') newBaselines += 1;
      else changed += 1;
    }
  }

  const freeProviders = providerStatus.filter((p) => p.free);
  const paidAvailable = providerStatus.filter((p) => !p.free && p.available);
  const paidBlocked = providerStatus.filter((p) => !p.free && !p.available);

  return {
    date: dateKey(generatedAt),
    generatedAt,
    totalDesigners: designers.length,
    totalScanTargets: scanTargetCount,
    targetsWithBaseline: scannedTargetCount,
    coveragePct: scanTargetCount > 0 ? Math.round((scannedTargetCount / scanTargetCount) * 1000) / 10 : null,
    changesLast24h: { total: newBaselines + changed, newBaselines, changed },
    providers: {
      free: freeProviders.map((p) => p.name),
      paidAvailable: paidAvailable.map((p) => p.name),
      paidBlocked: paidBlocked.map((p) => ({ name: p.name, reason: p.reason })),
    },
  };
}

function renderDigestMarkdown(digest) {
  const lines = [`\n## ${digest.generatedAt} — Daily strategy digest (${digest.date})`, ''];
  const coverage = digest.coveragePct == null ? 'n/a' : `${digest.coveragePct}%`;
  lines.push(`- Scan coverage: ${digest.targetsWithBaseline}/${digest.totalScanTargets} targets have a baseline (${coverage}); ${digest.totalDesigners} designer record(s) tracked.`);
  lines.push(`- Last 24h: ${digest.changesLast24h.total} signal(s) — ${digest.changesLast24h.newBaselines} new baseline(s), ${digest.changesLast24h.changed} change(s).`);
  const paidNote = digest.providers.paidBlocked.length
    ? digest.providers.paidBlocked.map((p) => `${p.name} (${p.reason})`).join(', ')
    : 'none';
  lines.push(`- Data providers: free = ${digest.providers.free.join(', ') || 'none'}; paid blocked = ${paidNote}.`);
  lines.push('', '_Rollup of signals already verified by the hourly scanner — no new scanning, no new scoring claims._', '');
  return lines.join('\n');
}

function hasDigestToday(dateStr, indexFile) {
  if (!fs.existsSync(indexFile)) return false;
  return JSON.parse(fs.readFileSync(indexFile, 'utf8')).includes(dateStr);
}

function markDigestDelivered(dateStr, indexFile) {
  fs.mkdirSync(path.dirname(indexFile), { recursive: true });
  const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : [];
  if (!index.includes(dateStr)) index.push(dateStr);
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
}

// Idempotent per calendar day (not per timestamp) — deliberately different
// from a report-id hash, so a retried or re-triggered run on the same day
// never duplicates the entry.
function deliverDigest(digest, { indexFile, kbFile }) {
  if (hasDigestToday(digest.date, indexFile)) {
    return { delivered: false, reason: 'already_delivered_today', date: digest.date };
  }
  fs.mkdirSync(path.dirname(kbFile), { recursive: true });
  fs.appendFileSync(kbFile, renderDigestMarkdown(digest));
  markDigestDelivered(digest.date, indexFile);
  return { delivered: true, date: digest.date, kbFile };
}

module.exports = {
  dateKey,
  buildStrategyDigest,
  renderDigestMarkdown,
  hasDigestToday,
  markDigestDelivered,
  deliverDigest,
};
