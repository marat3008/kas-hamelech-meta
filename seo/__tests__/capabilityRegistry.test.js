const test = require('node:test');
const assert = require('node:assert/strict');
const { getCapability, listProviders } = require('../lib/capabilityRegistry');

test('an unconfigured provider returns unsupported, not absent/zero', () => {
  const cap = getCapability('nonexistent-provider', 'organic_serp');
  assert.equal(cap.status, 'unsupported');
  assert.ok(cap.registryVersion);
});

test('ahrefs is registered but verified unsupported due to plan limits, with evidence', () => {
  assert.ok(listProviders().includes('ahrefs'));
  const cap = getCapability('ahrefs', 'organic_keywords');
  assert.equal(cap.status, 'unsupported');
  assert.equal(cap.reason, 'insufficient_plan');
  assert.ok(cap.evidenceRef);
});

test('an unknown feature on a known provider is still unsupported, not silently absent', () => {
  const cap = getCapability('ahrefs', 'local_pack');
  assert.equal(cap.status, 'unsupported');
  assert.equal(cap.reason, 'unsupported');
});
