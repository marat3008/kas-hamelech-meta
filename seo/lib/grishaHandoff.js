const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HANDOFF_DIR = path.join(__dirname, '..', 'data', 'grisha-handoff');
const DELIVERED_INDEX_FILE = path.join(HANDOFF_DIR, 'delivered-index.json');

// "Grisha" is a Claude operating persona defined by this repo's knowledge
// base (knowledge-base/grisha-master-knowledge.md, learning-loop/), not a
// separate running process with an API — there is nothing to push this to
// over a network. The real, existing hand-off mechanism is: the next Claude
// session operating as Grisha reads the knowledge-base file this writes.
// Only verified, successful observations become findings — a failed fetch
// is never reported as a competitor signal.
function buildHandoffReport({ campaignId, batchResults, associations, now = () => new Date().toISOString() }) {
  const generatedAt = now();
  const findings = [];

  for (const result of batchResults) {
    if (!result.ok || result.notModified) continue;
    if (!(result.diff.isFirstObservation || result.diff.changed)) continue;

    const assoc = associations && associations.get(result.key);
    findings.push({
      target: result.target,
      designerNames: (assoc && assoc.designerNames) || [],
      status: result.diff.isFirstObservation ? 'new_baseline' : 'changed',
      changedFields: result.diff.changedFields || [],
      titleSnapshot: result.signals ? result.signals.title : null,
      sourceUrl: result.target,
      observedAt: result.generatedAt,
      confidence: 'observed',
      freshness: 'live',
    });
  }

  const basis = `${campaignId}|${findings.map((f) => `${f.target}:${f.status}`).sort().join(',')}|${generatedAt}`;
  const reportId = crypto.createHash('sha256').update(basis).digest('hex').slice(0, 16);

  return {
    reportId,
    campaignId,
    generatedAt,
    findingsCount: findings.length,
    findings,
    limitations: [
      'Website-content signals only (title/description/canonical/robots/OpenGraph/JSON-LD/H1/H2) — no keyword rankings, ad spend, or social-media data.',
      'No advertising-relevance scoring is computed here — that judgement is left to the owner/Grisha session reading this report.',
      'Designers without a reachable site, or scanned-but-unchanged this batch, are not included as findings.',
    ],
  };
}

function hasBeenDelivered(reportId, indexFile = DELIVERED_INDEX_FILE) {
  if (!fs.existsSync(indexFile)) return false;
  return JSON.parse(fs.readFileSync(indexFile, 'utf8')).includes(reportId);
}

function markDelivered(reportId, indexFile = DELIVERED_INDEX_FILE) {
  fs.mkdirSync(path.dirname(indexFile), { recursive: true });
  const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : [];
  if (!index.includes(reportId)) index.push(reportId);
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
}

function saveReportJson(report, dir = HANDOFF_DIR) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${report.reportId}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  return file;
}

function appendToKnowledgeBase(report, kbFile) {
  const lines = [`\n## ${report.generatedAt} — Intelligence report ${report.reportId}`, ''];
  if (report.findings.length === 0) {
    lines.push('No new or changed competitor/designer signals this batch.');
  } else {
    for (const f of report.findings) {
      const who = f.designerNames.length ? f.designerNames.join(', ') : f.target;
      const what = f.status === 'new_baseline' ? 'first observation' : `changed: ${f.changedFields.join(', ')}`;
      lines.push(`- **${who}** (${f.target}) — ${what}; confidence: ${f.confidence}; observed ${f.observedAt}.`);
    }
  }
  lines.push('', `_Full evidence: data/grisha-handoff/${report.reportId}.json_`, '');

  fs.mkdirSync(path.dirname(kbFile), { recursive: true });
  fs.appendFileSync(kbFile, lines.join('\n'));
}

// Idempotent: delivering the same reportId twice is a no-op the second time
// (prevents duplicate entries in the knowledge base across reruns).
//
// A zero-finding report is never written to disk or appended to the
// knowledge base: reportId incorporates generatedAt, so every empty batch
// would otherwise mint a fresh "no signals" entry and the idempotency check
// above would never catch it (each one is unique). Grisha's handoff feed is
// a knowledge base meant to be read, not an activity log — a scan that
// found nothing produces no event for the next session to wade through.
function deliverReport(report, { indexFile = DELIVERED_INDEX_FILE, dir = HANDOFF_DIR, kbFile } = {}) {
  if (report.findingsCount === 0) {
    return { delivered: false, reason: 'no_findings', reportId: report.reportId };
  }
  if (hasBeenDelivered(report.reportId, indexFile)) {
    return { delivered: false, reason: 'already_delivered', reportId: report.reportId };
  }
  const jsonPath = saveReportJson(report, dir);
  if (kbFile) appendToKnowledgeBase(report, kbFile);
  markDelivered(report.reportId, indexFile);
  return { delivered: true, reportId: report.reportId, jsonPath, kbFile: kbFile || null };
}

module.exports = {
  buildHandoffReport,
  hasBeenDelivered,
  markDelivered,
  saveReportJson,
  appendToKnowledgeBase,
  deliverReport,
  HANDOFF_DIR,
  DELIVERED_INDEX_FILE,
};
