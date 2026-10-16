const { normalizeQuery } = require('./hebrewNormalize');

const STOPWORDS = new Set(['את', 'של', 'עם', 'על', 'כל', 'גם', 'אם', 'לא', 'הוא', 'היא', 'זה', 'זו', 'the', 'and', 'of', 'for', 'a', 'to']);

function extractKeywordCandidates(signals) {
  const text = [signals.title, signals.description, ...(signals.h1 || []), ...(signals.h2 || [])].filter(Boolean).join(' ');
  const words = normalizeQuery(text).normalized.split(' ').filter(Boolean);

  const counts = new Map();
  for (const word of words) {
    if (word.length < 2 || STOPWORDS.has(word.toLowerCase())) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([word, count]) => ({ word, count }));
}

module.exports = { extractKeywordCandidates, STOPWORDS };
