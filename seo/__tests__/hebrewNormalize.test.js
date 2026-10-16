const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeQuery } = require('../lib/hebrewNormalize');

test('trims whitespace and strips punctuation', () => {
  const { normalized } = normalizeQuery('  כיסאות  לפינת אוכל!! ');
  assert.equal(normalized, 'כיסאות לפינת אוכל');
});

test('preserves distinct queries that differ only by location', () => {
  const a = normalizeQuery('כיסאות בני ברק').normalized;
  const b = normalizeQuery('כיסאות ירושלים').normalized;
  assert.notEqual(a, b);
});

test('keeps the original string untouched', () => {
  const raw = '  כיסאות!  ';
  const { original } = normalizeQuery(raw);
  assert.equal(original, raw);
});
