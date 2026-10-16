const test = require('node:test');
const assert = require('node:assert/strict');
const { RunGovernor } = require('../lib/runGovernor');

test('reserve blocks spend beyond the hard cap', () => {
  const gov = new RunGovernor({ hardCapUnits: 100 });
  assert.equal(gov.reserve('a', 80).ok, true);
  const second = gov.reserve('b', 30);
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'skipped_budget');
});

test('settle releases the reservation and records actual spend', () => {
  const gov = new RunGovernor({ hardCapUnits: 100 });
  gov.reserve('a', 50);
  gov.settle('a', 45);
  assert.equal(gov.availableUnits(), 100);
  assert.equal(gov.settledUnits, 45);
});

test('duplicate reservation ids are rejected', () => {
  const gov = new RunGovernor({ hardCapUnits: 100 });
  gov.reserve('a', 10);
  assert.throws(() => gov.reserve('a', 10));
});
