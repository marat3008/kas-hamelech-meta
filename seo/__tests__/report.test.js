const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReport } = require('../lib/report');

test('assembles a report that mirrors the underlying signals, diff, and alerts', () => {
  const report = buildReport({
    target: 'https://competitor.test',
    signals: { title: 'T', description: 'D', canonical: null, h1: ['a'], h2: [], jsonLd: [{}], openGraph: { 'og:title': 'T' } },
    diff: { changed: true, changedFields: ['title'], isFirstObservation: false },
    alerts: [{ type: 'signal_changed', field: 'title', severity: 'high' }],
    generatedAt: '2026-10-08T00:00:00.000Z',
  });
  assert.equal(report.signals.h1Count, 1);
  assert.equal(report.signals.hasJsonLd, true);
  assert.equal(report.diff.changedFields[0], 'title');
  assert.equal(report.generatedAt, '2026-10-08T00:00:00.000Z');
});
