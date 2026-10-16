const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadState, saveStateAtomic, acquireLock, releaseLock } = require('../lib/scanStateStore');

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'seo-scanstate-'));
}

test('loadState returns the factory result when the file does not exist', () => {
  const dir = tempDir();
  try {
    const state = loadState(path.join(dir, 'state.json'), () => ({ fresh: true }));
    assert.deepEqual(state, { fresh: true });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('saveStateAtomic persists content that loadState reads back, with no leftover temp file', () => {
  const dir = tempDir();
  const file = path.join(dir, 'state.json');
  try {
    saveStateAtomic(file, { campaignId: 'c1', records: { a: { status: 'pending', attempts: 0 } } });
    const loaded = loadState(file, () => null);
    assert.equal(loaded.campaignId, 'c1');
    const leftover = fs.readdirSync(dir).filter((f) => f.endsWith('.tmp'));
    assert.deepEqual(leftover, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('acquireLock blocks a second concurrent acquire until released', () => {
  const dir = tempDir();
  const lockFile = path.join(dir, 'state.json.lock');
  try {
    assert.equal(acquireLock(lockFile), true);
    assert.equal(acquireLock(lockFile), false);
    releaseLock(lockFile);
    assert.equal(acquireLock(lockFile), true);
    releaseLock(lockFile);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('releaseLock on a lock that was never acquired is a no-op, not an error', () => {
  const dir = tempDir();
  try {
    assert.doesNotThrow(() => releaseLock(path.join(dir, 'never-created.lock')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
