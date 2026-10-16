const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { upsertDesigner, loadDesigners, saveDesigners, addDesigners } = require('../lib/designerWatchlist');

test('adds a new designer with sensible defaults when nothing matches', () => {
  const result = upsertDesigner([], { name: 'שם בדיקה', canonicalWebsite: 'https://example.test/' });
  assert.equal(result.length, 1);
  assert.equal(result[0].classification, 'UNCLASSIFIED');
  assert.equal(result[0].verificationStatus, 'UNVERIFIED');
});

test('rejects a record with no name', () => {
  assert.throws(() => upsertDesigner([], { canonicalWebsite: 'https://example.test/' }));
});

test('dedupes by canonical URL (ignoring trailing slash/case) and merges evidence instead of duplicating', () => {
  const first = upsertDesigner([], {
    name: 'מעצבת א',
    canonicalWebsite: 'https://Example.test/',
    classification: 'HAREDI_CORE',
    priority: 'HIGH',
    verificationStatus: 'VERIFIED',
    evidence: ['ראיה א'],
  });
  const second = upsertDesigner(first, {
    name: 'מעצבת א',
    canonicalWebsite: 'https://example.test',
    evidence: ['ראיה ב'],
  });
  assert.equal(second.length, 1);
  assert.deepEqual(second[0].evidence, ['ראיה א', 'ראיה ב']);
  // verificationStatus wasn't re-supplied on the second call — it must not be downgraded/cleared.
  assert.equal(second[0].verificationStatus, 'VERIFIED');
  assert.equal(second[0].classification, 'HAREDI_CORE');
});

test('dedupes by exact name even when the URL differs', () => {
  const first = upsertDesigner([], { name: 'מעצבת ב', canonicalWebsite: 'https://old-site.test/' });
  const second = upsertDesigner(first, { name: 'מעצבת ב', canonicalWebsite: 'https://new-site.test/' });
  assert.equal(second.length, 1);
  assert.equal(second[0].canonicalWebsite, 'https://new-site.test/');
});

test('two distinct designers are both kept, not merged', () => {
  let records = upsertDesigner([], { name: 'מעצבת א', canonicalWebsite: 'https://a.test/' });
  records = upsertDesigner(records, { name: 'מעצבת ב', canonicalWebsite: 'https://b.test/' });
  assert.equal(records.length, 2);
});

test('two different people sharing the same studio website are both kept, not merged into one name', () => {
  let records = upsertDesigner([], { name: 'שותפה א', canonicalWebsite: 'https://shared-studio.test/' });
  records = upsertDesigner(records, { name: 'שותפה ב', canonicalWebsite: 'https://shared-studio.test/' });
  assert.equal(records.length, 2);
  assert.deepEqual(records.map((r) => r.name).sort(), ['שותפה א', 'שותפה ב']);
  assert.ok(records.every((r) => r.canonicalWebsite === 'https://shared-studio.test/'));
});

test('addDesigners persists to disk and loadDesigners reads it back without data loss', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-designers-'));
  const file = path.join(dir, 'designers.json');
  try {
    addDesigners([{ name: 'מעצבת א', canonicalWebsite: 'https://a.test/', verificationStatus: 'VERIFIED' }], file);
    const afterFirst = loadDesigners(file);
    assert.equal(afterFirst.length, 1);

    addDesigners([{ name: 'מעצבת ב', canonicalWebsite: 'https://b.test/' }], file);
    const afterSecond = loadDesigners(file);
    assert.equal(afterSecond.length, 2);
    assert.equal(afterSecond[0].verificationStatus, 'VERIFIED'); // first record untouched by the second call
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
