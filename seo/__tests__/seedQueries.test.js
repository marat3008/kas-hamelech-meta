const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSeedQueries } = require('../lib/seedQueries');

test('loads the observed TikTok seed queries with provenance intact', () => {
  const data = loadSeedQueries();
  assert.equal(data.sourceType, 'observed');
  assert.equal(data.seedQueries.length, 3);
});

test('does not collapse distinct spellings of the same word', () => {
  const data = loadSeedQueries();
  const normalized = data.seedQueries.map((q) => q.normalized);
  assert.ok(normalized.includes('כסאות לפינת אוכל'));
  assert.ok(normalized.includes('כיסאות לפינת אוכל'));
  assert.equal(new Set(normalized).size, 3);
});
