const test = require('node:test');
const assert = require('node:assert/strict');
const { listProviderStatus } = require('../lib/providers');

test('free providers are always available and marked free', () => {
  const website = listProviderStatus().find((p) => p.name === 'WebsiteSEO');
  assert.equal(website.free, true);
  assert.equal(website.available, true);
});

test('a paid provider blocked by plan is reported unavailable without disabling the free providers', () => {
  const list = listProviderStatus();
  const ahrefs = list.find((p) => p.name === 'ahrefs');
  assert.equal(ahrefs.available, false);
  assert.equal(ahrefs.free, false);
  assert.ok(ahrefs.reason);
  const website = list.find((p) => p.name === 'WebsiteSEO');
  assert.equal(website.available, true);
});
