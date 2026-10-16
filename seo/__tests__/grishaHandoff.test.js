const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildHandoffReport, deliverReport, hasBeenDelivered } = require('../lib/grishaHandoff');

function sampleAssociations() {
  return new Map([['a.test', { designerNames: ['מעצבת א'] }]]);
}

test('only includes successful, changed-or-new findings — never a failure, never an unchanged/not-modified result', () => {
  const batchResults = [
    { key: 'a.test', target: 'https://a.test/', ok: true, generatedAt: 't1', diff: { isFirstObservation: true, changed: true, changedFields: [] }, signals: { title: 'A' } },
    { key: 'b.test', target: 'https://b.test/', ok: true, notModified: true, generatedAt: 't1', diff: { isFirstObservation: false, changed: false, changedFields: [] } },
    { key: 'c.test', target: 'https://c.test/', ok: true, generatedAt: 't1', diff: { isFirstObservation: false, changed: false, changedFields: [] } },
    { key: 'd.test', target: 'https://d.test/', ok: false, reason: 'dns_resolution_failed' },
  ];
  const report = buildHandoffReport({ campaignId: 'c1', batchResults, associations: sampleAssociations(), now: () => 'T' });
  assert.equal(report.findingsCount, 1);
  assert.equal(report.findings[0].target, 'https://a.test/');
  assert.deepEqual(report.findings[0].designerNames, ['מעצבת א']);
});

test('reportId is deterministic for the same inputs and changes when findings differ', () => {
  const base = { campaignId: 'c1', associations: sampleAssociations(), now: () => 'T' };
  const results1 = [{ key: 'a.test', target: 'https://a.test/', ok: true, generatedAt: 't1', diff: { isFirstObservation: true, changed: true, changedFields: [] }, signals: {} }];
  const r1 = buildHandoffReport({ ...base, batchResults: results1 });
  const r2 = buildHandoffReport({ ...base, batchResults: results1 });
  assert.equal(r1.reportId, r2.reportId);

  const results2 = [{ key: 'b.test', target: 'https://b.test/', ok: true, generatedAt: 't1', diff: { isFirstObservation: true, changed: true, changedFields: [] }, signals: {} }];
  const r3 = buildHandoffReport({ ...base, batchResults: results2 });
  assert.notEqual(r1.reportId, r3.reportId);
});

test('deliverReport writes the JSON report and a knowledge-base entry, and is idempotent for the same reportId', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grisha-handoff-'));
  const kbFile = path.join(dir, 'kb', 'feed.md');
  try {
    const report = buildHandoffReport({
      campaignId: 'c1',
      batchResults: [{ key: 'a.test', target: 'https://a.test/', ok: true, generatedAt: 't1', diff: { isFirstObservation: true, changed: true, changedFields: [] }, signals: { title: 'A' } }],
      associations: sampleAssociations(),
      now: () => 'T',
    });

    const first = deliverReport(report, { dir, kbFile, indexFile: path.join(dir, 'index.json') });
    assert.equal(first.delivered, true);
    assert.ok(fs.existsSync(first.jsonPath));
    assert.match(fs.readFileSync(kbFile, 'utf8'), /מעצבת א|a\.test/);

    const second = deliverReport(report, { dir, kbFile, indexFile: path.join(dir, 'index.json') });
    assert.equal(second.delivered, false);
    assert.equal(second.reason, 'already_delivered');

    const kbContentAfterSecond = fs.readFileSync(kbFile, 'utf8');
    assert.equal(kbContentAfterSecond.split('Intelligence report').length - 1, 1); // not duplicated
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('deliverReport writes nothing for a zero-finding report (no JSON file, no knowledge-base entry)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grisha-handoff-'));
  const kbFile = path.join(dir, 'kb', 'feed.md');
  try {
    const report = buildHandoffReport({
      campaignId: 'c1',
      batchResults: [{ key: 'a.test', target: 'https://a.test/', ok: true, notModified: true, generatedAt: 't1', diff: { isFirstObservation: false, changed: false, changedFields: [] } }],
      associations: sampleAssociations(),
      now: () => 'T',
    });
    assert.equal(report.findingsCount, 0);

    const result = deliverReport(report, { dir, kbFile, indexFile: path.join(dir, 'index.json') });
    assert.equal(result.delivered, false);
    assert.equal(result.reason, 'no_findings');
    assert.equal(fs.existsSync(path.join(dir, `${report.reportId}.json`)), false);
    assert.equal(fs.existsSync(kbFile), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('hasBeenDelivered is false for an index file that does not exist yet', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grisha-handoff-'));
  try {
    assert.equal(hasBeenDelivered('nope', path.join(dir, 'missing.json')), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
