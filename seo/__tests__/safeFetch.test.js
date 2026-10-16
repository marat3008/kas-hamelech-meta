const test = require('node:test');
const assert = require('node:assert/strict');
const { safeFetch } = require('../lib/safeFetch');

test('blocks a request whose DNS resolves to a private address', async () => {
  const result = await safeFetch('http://internal.example/', {
    resolve: async () => ['10.0.0.5'],
    request: async () => {
      throw new Error('should not be called');
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'blocked_resolved_address');
});

test('fails closed after exceeding the redirect cap, re-resolving each hop', async () => {
  let calls = 0;
  const result = await safeFetch('http://example.test/a', {
    maxRedirects: 1,
    resolve: async () => ['93.184.216.34'],
    request: async () => {
      calls += 1;
      return { statusCode: 302, headers: { location: `http://example.test/${calls}` }, body: '' };
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'too_many_redirects');
  assert.equal(calls, 2);
});

test('rejects an https-to-http downgrade on redirect', async () => {
  const result = await safeFetch('https://example.test/', {
    resolve: async () => ['93.184.216.34'],
    request: async (opts) =>
      opts.protocol === 'https:'
        ? { statusCode: 302, headers: { location: 'http://example.test/' }, body: '' }
        : { statusCode: 200, headers: {}, body: 'should not reach here' },
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'protocol_downgrade');
});

test('returns the body on a successful fetch', async () => {
  const result = await safeFetch('http://example.test/', {
    resolve: async () => ['93.184.216.34'],
    request: async () => ({ statusCode: 200, headers: {}, body: '<html></html>' }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.body, '<html></html>');
});
