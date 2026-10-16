const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { SnapshotStore } = require('../lib/snapshotStore');

test('appends snapshots and returns them in history order', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-snapshots-'));
  try {
    const store = new SnapshotStore({ dir });
    store.append('https://competitor.test', { observedAt: '2026-10-01', signals: { title: 'A' } });
    store.append('https://competitor.test', { observedAt: '2026-10-08', signals: { title: 'B' } });
    const history = store.loadHistory('https://competitor.test');
    assert.equal(history.length, 2);
    assert.equal(store.loadLatest('https://competitor.test').signals.title, 'B');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('an unseen target has empty history and a null latest snapshot', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-snapshots-'));
  try {
    const store = new SnapshotStore({ dir });
    assert.deepEqual(store.loadHistory('https://nope.test'), []);
    assert.equal(store.loadLatest('https://nope.test'), null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
