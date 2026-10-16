const test = require('node:test');
const assert = require('node:assert/strict');
const { parseIsraeliPrice } = require('../lib/priceParser');

test('parses comma-grouped thousands unambiguously', () => {
  const r = parseIsraeliPrice('₪1,299');
  assert.equal(r.value, 1299);
  assert.equal(r.ambiguous, false);
  assert.equal(r.currency, 'ILS');
});

test('flags dot-grouped thousands as ambiguous instead of guessing', () => {
  const r = parseIsraeliPrice('1.299 ₪');
  assert.equal(r.value, null);
  assert.equal(r.ambiguous, true);
  assert.equal(r.reason, 'ambiguous_thousands_separator');
});

test('parses a plain integer with a ש"ח suffix', () => {
  const r = parseIsraeliPrice('1299 ש"ח');
  assert.equal(r.value, 1299);
  assert.equal(r.currency, 'ILS');
});
