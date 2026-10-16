const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { scanTarget, runScanJob, startScheduler } = require('../lib/scheduler');
const { SnapshotStore } = require('../lib/snapshotStore');

function tempStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-scheduler-'));
  return { dir, store: new SnapshotStore({ dir }) };
}

test('scanTarget records a baseline on the first successful fetch', async () => {
  const { dir, store } = tempStore();
  try {
    const fakeFetch = async () => ({ ok: true, body: '<title>A</title>' });
    const result = await scanTarget('https://competitor.test', { store, fetch: fakeFetch, now: () => 't1' });
    assert.equal(result.ok, true);
    assert.equal(result.diff.isFirstObservation, true);
    assert.equal(store.loadLatest('https://competitor.test').signals.title, 'A');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('scanTarget detects a change on the second scan and never throws on a failed fetch', async () => {
  const { dir, store } = tempStore();
  try {
    const okFetch = async () => ({ ok: true, body: '<title>A</title>' });
    await scanTarget('https://competitor.test', { store, fetch: okFetch, now: () => 't1' });

    const changedFetch = async () => ({ ok: true, body: '<title>B</title>' });
    const second = await scanTarget('https://competitor.test', { store, fetch: changedFetch, now: () => 't2' });
    assert.equal(second.diff.changed, true);
    assert.deepEqual(second.diff.changedFields, ['title']);

    const blockedFetch = async () => ({ ok: false, reason: 'blocked_resolved_address' });
    const third = await scanTarget('https://competitor.test', { store, fetch: blockedFetch, now: () => 't3' });
    assert.equal(third.ok, false);
    assert.equal(third.reason, 'blocked_resolved_address');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('scanTarget sends conditional headers from the stored snapshot and treats a 304 as unchanged', async () => {
  const { dir, store } = tempStore();
  try {
    const firstFetch = async () => ({ ok: true, statusCode: 200, headers: { etag: '"abc"' }, body: '<title>A</title>' });
    await scanTarget('https://competitor.test', { store, fetch: firstFetch, now: () => 't1' });

    let sentHeaders = null;
    const notModifiedFetch = async (target, options) => {
      sentHeaders = options && options.headers;
      return { ok: true, statusCode: 304, headers: {}, body: '' };
    };
    const second = await scanTarget('https://competitor.test', { store, fetch: notModifiedFetch, now: () => 't2' });

    assert.deepEqual(sentHeaders, { 'If-None-Match': '"abc"' });
    assert.equal(second.ok, true);
    assert.equal(second.notModified, true);
    assert.equal(second.diff.changed, false);
    assert.equal(second.signals.title, 'A'); // reused from the previous snapshot, not fabricated from an empty body
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('runScanJob continues past one target failing so the rest still get scanned', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-scheduler-'));
  try {
    const fakeFetch = async (target) =>
      target === 'https://bad.test' ? { ok: false, reason: 'dns_resolution_failed' } : { ok: true, body: '<title>ok</title>' };
    const results = await runScanJob(['https://bad.test', 'https://good.test'], { dataDir: dir, fetch: fakeFetch });
    assert.equal(results.length, 2);
    assert.equal(results[0].ok, false);
    assert.equal(results[1].ok, true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('startScheduler registers through the injected cron library instead of a real timer', () => {
  let scheduledExpression = null;
  let scheduledFn = null;
  const fakeCronLib = {
    validate: (expr) => expr === 'valid-expr',
    schedule: (expr, fn) => {
      scheduledExpression = expr;
      scheduledFn = fn;
      return { stop: () => {} };
    },
  };
  let runScanCalledWith = null;
  const task = startScheduler({
    cronExpression: 'valid-expr',
    targets: ['https://a.test'],
    cronLib: fakeCronLib,
    runScan: async (targets) => {
      runScanCalledWith = targets;
      return [];
    },
  });
  assert.equal(scheduledExpression, 'valid-expr');
  assert.equal(typeof task.stop, 'function');
  assert.equal(typeof scheduledFn, 'function');
});

test('startScheduler rejects an invalid cron expression up front', () => {
  const fakeCronLib = { validate: () => false, schedule: () => assert.fail('should not schedule') };
  assert.throws(() => startScheduler({ cronExpression: 'nonsense', targets: [], cronLib: fakeCronLib }));
});
