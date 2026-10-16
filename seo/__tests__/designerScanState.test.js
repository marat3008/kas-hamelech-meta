const test = require('node:test');
const assert = require('node:assert/strict');
const {
  designerKey,
  isValidState,
  createState,
  indexDesigners,
  ensureRecords,
  selectEligible,
  buildScanTargetAssociations,
  startNewCampaign,
} = require('../lib/designerScanState');

test('designerKey prefers an explicit id', () => {
  assert.equal(designerKey({ id: 'abc', name: 'X', canonicalWebsite: 'https://x.test/' }), 'abc');
});

test('designerKey falls back to the site hostname with www stripped', () => {
  assert.equal(designerKey({ name: 'X', canonicalWebsite: 'https://www.Example.test/path' }), 'example.test');
});

test('designerKey falls back to the normalized name when there is no id or website', () => {
  assert.equal(designerKey({ name: '  מעצבת   א  ' }), 'מעצבת א');
});

test('designerKey throws when nothing identifies the designer', () => {
  assert.throws(() => designerKey({}));
});

test('indexDesigners dedupes two different people sharing one hostname by falling back to name', () => {
  const designers = [
    { name: 'שותפה א', canonicalWebsite: 'https://shared.test/' },
    { name: 'שותפה ב', canonicalWebsite: 'https://shared.test/' },
  ];
  const unique = indexDesigners(designers);
  assert.equal(unique.size, 1); // same hostname key, same as designerKey alone would produce
  assert.equal(unique.get('shared.test').name, 'שותפה א'); // first occurrence wins
});

test('indexDesigners skips an unidentifiable entry via the onSkipped callback instead of throwing', () => {
  const skipped = [];
  const unique = indexDesigners([{ notAName: true }, { name: 'ok' }], { onSkipped: (d) => skipped.push(d) });
  assert.equal(unique.size, 1);
  assert.equal(skipped.length, 1);
});

test('selectEligible includes pending, in_progress, and under-limit failed; excludes completed and exhausted failed', () => {
  const state = createState('c1');
  state.records = {
    a: { status: 'pending', attempts: 0 },
    b: { status: 'in_progress', attempts: 1 },
    c: { status: 'failed', attempts: 2 },
    d: { status: 'failed', attempts: 3 },
    e: { status: 'completed', attempts: 1 },
  };
  const eligible = selectEligible(state, ['a', 'b', 'c', 'd', 'e'], 3);
  assert.deepEqual(eligible.sort(), ['a', 'b', 'c']);
});

test('ensureRecords adds pending/0-attempt records only for keys that are missing', () => {
  const state = createState('c1');
  state.records.a = { status: 'completed', attempts: 2 };
  ensureRecords(state, ['a', 'b']);
  assert.equal(state.records.a.status, 'completed'); // untouched
  assert.deepEqual(state.records.b, { status: 'pending', attempts: 0 });
});

test('isValidState rejects malformed shapes', () => {
  assert.equal(isValidState(null), false);
  assert.equal(isValidState({ campaignId: 'x', records: [] }), false);
  assert.equal(isValidState({ campaignId: 'x', records: {} }), true);
});

test('selectEligible reselects a completed target once it goes stale past cacheTtlMs', () => {
  const state = createState('c1');
  const oldScan = new Date('2026-01-01T00:00:00.000Z').toISOString();
  state.records = {
    fresh: { status: 'completed', attempts: 0, lastScanAt: new Date('2026-10-09T00:00:00.000Z').toISOString() },
    stale: { status: 'completed', attempts: 0, lastScanAt: oldScan },
  };
  const now = () => new Date('2026-10-09T01:00:00.000Z').getTime();
  const eligible = selectEligible(state, ['fresh', 'stale'], { maxAttempts: 3, cacheTtlMs: 24 * 60 * 60 * 1000, now });
  assert.deepEqual(eligible, ['stale']);
});

test('selectEligible with a plain number (legacy call) never reselects completed targets', () => {
  const state = createState('c1');
  state.records = { old: { status: 'completed', attempts: 0, lastScanAt: '2020-01-01T00:00:00.000Z' } };
  assert.deepEqual(selectEligible(state, ['old'], 3), []);
});

test('buildScanTargetAssociations lists every designer name under a shared scan key', () => {
  const designers = [
    { name: 'שותפה א', canonicalWebsite: 'https://shared.test/' },
    { name: 'שותפה ב', canonicalWebsite: 'https://shared.test/' },
    { name: 'עצמאית', canonicalWebsite: 'https://solo.test/' },
  ];
  const associations = buildScanTargetAssociations(designers);
  assert.deepEqual(associations.get('shared.test').designerNames, ['שותפה א', 'שותפה ב']);
  assert.equal(associations.get('shared.test').canonicalUrls.size, 1);
  assert.deepEqual(associations.get('solo.test').designerNames, ['עצמאית']);
});

test('startNewCampaign resets every known key to pending/0-attempts under a fresh campaignId', () => {
  const state = createState('old-campaign');
  state.records = {
    a: { status: 'completed', attempts: 1, lastScanAt: 'x' },
    b: { status: 'failed', attempts: 3, lastError: 'oops' },
  };
  const fresh = startNewCampaign(state);
  assert.notEqual(fresh.campaignId, 'old-campaign');
  assert.deepEqual(fresh.records.a, { status: 'pending', attempts: 0 });
  assert.deepEqual(fresh.records.b, { status: 'pending', attempts: 0 });
});
