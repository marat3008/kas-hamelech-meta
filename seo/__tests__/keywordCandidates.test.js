const test = require('node:test');
const assert = require('node:assert/strict');
const { extractKeywordCandidates } = require('../lib/keywordCandidates');

test('extracts repeated meaningful words from title/description/headings', () => {
  const candidates = extractKeywordCandidates({
    title: 'כסאות לפינת אוכל מעוצבים',
    description: 'כיסאות לפינת אוכל איכותיים',
    h1: ['כסאות לפינת אוכל'],
    h2: [],
  });
  assert.ok(candidates.some((c) => c.word === 'לפינת' && c.count === 3));
});

test('drops common stopwords', () => {
  const candidates = extractKeywordCandidates({ title: 'כסא של המלך', description: '', h1: [], h2: [] });
  assert.ok(!candidates.some((c) => c.word === 'של'));
});
