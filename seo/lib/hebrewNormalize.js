const WHITESPACE_RE = /\s+/g;
const PUNCTUATION_RE = /["'׳״.,;:!?()[\]{}]/g;

function normalizeQuery(raw) {
  if (typeof raw !== 'string') throw new TypeError('normalizeQuery expects a string');
  const original = raw;
  let normalized = raw.normalize('NFC').trim();
  normalized = normalized.replace(PUNCTUATION_RE, '');
  normalized = normalized.replace(WHITESPACE_RE, ' ').trim();
  return { original, normalized };
}

module.exports = { normalizeQuery };
