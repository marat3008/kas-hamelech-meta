const test = require('node:test');
const assert = require('node:assert/strict');
const { isBlockedAddress, assertSafeUrl } = require('../lib/ssrfGuard');

test('blocks loopback, private, and cloud metadata addresses', () => {
  assert.equal(isBlockedAddress('127.0.0.1'), true);
  assert.equal(isBlockedAddress('10.0.0.5'), true);
  assert.equal(isBlockedAddress('192.168.1.1'), true);
  assert.equal(isBlockedAddress('169.254.169.254'), true);
  assert.equal(isBlockedAddress('::1'), true);
});

test('does not block ordinary public-looking addresses', () => {
  assert.equal(isBlockedAddress('93.184.216.34'), false);
  assert.equal(isBlockedAddress('8.8.8.8'), false);
});

test('rejects non-http(s) protocols and embedded credentials', () => {
  assert.equal(assertSafeUrl('file:///etc/passwd').safe, false);
  assert.equal(assertSafeUrl('http://user:pass@example.com').safe, false);
});

test('rejects an IP-literal URL that points at a blocked address', () => {
  const result = assertSafeUrl('http://127.0.0.1/admin');
  assert.equal(result.safe, false);
  assert.equal(result.reason, 'blocked_ip_literal');
});
