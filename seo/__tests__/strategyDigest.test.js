const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildStrategyDigest, deliverDigest, hasDigestToday } = require('../lib/strategyDigest');

function sampleProviderStatus() {
  return [
    { name: 'WebsiteSEO', free: true, available: true, reason: null },
    { name: 'ahrefs', free: false, available: false, reason: 'insufficient_plan' },
  ];
}

test('aggregates coverage and last-24h signals without inventing new scores', () => {
  const handoffReportsLast24h = [
    { findings: [{ status: 'new_baseline' }, { status: 'changed' }] },
    { findings: [] },
  ];
  const digest = buildStrategyDigest({
    designers: [{ name: 'a' }, { name: 'b' }],
    scanTargetCount: 4,
    scannedTargetCount: 2,
    handoffReportsLast24h,
    providerStatus: sampleProviderStatus(),
    now: () => '2026-10-16T05:00:00.000Z',
  });

  assert.equal(digest.date, '2026-10-16');
  assert.equal(digest.totalDesigners, 2);
  assert.equal(digest.coveragePct, 50);
  assert.deepEqual(digest.changesLast24h, { total: 2, newBaselines: 1, changed: 1 });
  assert.deepEqual(digest.providers.free, ['WebsiteSEO']);
  assert.deepEqual(digest.providers.paidBlocked, [{ name: 'ahrefs', reason: 'insufficient_plan' }]);
});

test('coveragePct is null when there are no scan targets, not a divide-by-zero artifact', () => {
  const digest = buildStrategyDigest({
    designers: [],
    scanTargetCount: 0,
    scannedTargetCount: 0,
    handoffReportsLast24h: [],
    providerStatus: [],
    now: () => '2026-10-16T05:00:00.000Z',
  });
  assert.equal(digest.coveragePct, null);
});

test('deliverDigest writes once per calendar day; a same-day retry does not duplicate', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strategy-digest-'));
  const kbFile = path.join(dir, 'kb', 'digest.md');
  const indexFile = path.join(dir, 'index.json');
  try {
    const digest = buildStrategyDigest({
      designers: [{ name: 'a' }],
      scanTargetCount: 1,
      scannedTargetCount: 1,
      handoffReportsLast24h: [],
      providerStatus: sampleProviderStatus(),
      now: () => '2026-10-16T05:00:00.000Z',
    });

    const first = deliverDigest(digest, { indexFile, kbFile });
    assert.equal(first.delivered, true);
    assert.ok(fs.existsSync(kbFile));
    assert.equal(hasDigestToday('2026-10-16', indexFile), true);

    const second = deliverDigest(digest, { indexFile, kbFile });
    assert.equal(second.delivered, false);
    assert.equal(second.reason, 'already_delivered_today');

    const content = fs.readFileSync(kbFile, 'utf8');
    assert.equal(content.split('Daily strategy digest').length - 1, 1); // not duplicated
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a later run on a new day is not blocked by a previous day already delivered', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strategy-digest-'));
  const kbFile = path.join(dir, 'kb', 'digest.md');
  const indexFile = path.join(dir, 'index.json');
  try {
    const day1 = buildStrategyDigest({ designers: [], scanTargetCount: 0, scannedTargetCount: 0, handoffReportsLast24h: [], providerStatus: [], now: () => '2026-10-16T05:00:00.000Z' });
    const day2 = buildStrategyDigest({ designers: [], scanTargetCount: 0, scannedTargetCount: 0, handoffReportsLast24h: [], providerStatus: [], now: () => '2026-10-17T05:00:00.000Z' });

    assert.equal(deliverDigest(day1, { indexFile, kbFile }).delivered, true);
    assert.equal(deliverDigest(day2, { indexFile, kbFile }).delivered, true);

    const content = fs.readFileSync(kbFile, 'utf8');
    assert.equal(content.split('Daily strategy digest').length - 1, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
