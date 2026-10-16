const test = require('node:test');
const assert = require('node:assert/strict');
const { diffSignals } = require('../lib/snapshotDiff');

const BASE = { title: 'A', description: 'd', canonical: null, robotsMeta: null, h1: [], h2: [], jsonLd: [], openGraph: {} };

test('a first observation is a baseline, not a change', () => {
  const result = diffSignals(null, BASE);
  assert.equal(result.isFirstObservation, true);
  assert.equal(result.changed, true);
});

test('detects a changed title between two snapshots', () => {
  const result = diffSignals(BASE, { ...BASE, title: 'New title' });
  assert.equal(result.changed, true);
  assert.deepEqual(result.changedFields, ['title']);
});

test('identical snapshots report no change', () => {
  const result = diffSignals(BASE, { ...BASE });
  assert.equal(result.changed, false);
  assert.deepEqual(result.changedFields, []);
});
