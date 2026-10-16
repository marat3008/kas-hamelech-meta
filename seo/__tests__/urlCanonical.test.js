const test = require('node:test');
const assert = require('node:assert/strict');
const { canonicalizeUrl } = require('../lib/urlCanonical');

test('strips utm_ and other known tracking params', () => {
  assert.equal(
    canonicalizeUrl('https://example.com/page?utm_source=fb&id=5'),
    'https://example.com/page?id=5',
  );
});

test('drops the fragment', () => {
  assert.equal(canonicalizeUrl('https://example.com/page#section'), 'https://example.com/page');
});

test('lowercases the host and strips a leading www.', () => {
  assert.equal(canonicalizeUrl('https://WWW.Example.com/'), 'https://example.com/');
});

test('collapses a trailing-slash difference and an empty path to "/"', () => {
  assert.equal(canonicalizeUrl('https://example.com'), canonicalizeUrl('https://example.com/'));
});

test('sorts remaining query params so order does not matter', () => {
  assert.equal(canonicalizeUrl('https://example.com/?b=2&a=1'), canonicalizeUrl('https://example.com/?a=1&b=2'));
});

test('two URLs that differ only by tracking params and www canonicalize to the same value', () => {
  const a = canonicalizeUrl('https://www.example.com/shop?fbclid=abc123');
  const b = canonicalizeUrl('https://example.com/shop');
  assert.equal(a, b);
});
