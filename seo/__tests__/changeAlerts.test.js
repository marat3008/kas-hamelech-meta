const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAlerts } = require('../lib/changeAlerts');

test('a title change produces a high-severity alert', () => {
  const alerts = buildAlerts('https://competitor.test', { changed: true, isFirstObservation: false, changedFields: ['title'] });
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].severity, 'high');
});

test('no alerts are raised when nothing changed', () => {
  const alerts = buildAlerts('https://competitor.test', { changed: false, isFirstObservation: false, changedFields: [] });
  assert.deepEqual(alerts, []);
});

test('a first observation produces an informational baseline alert, not a change alert', () => {
  const alerts = buildAlerts('https://competitor.test', { changed: true, isFirstObservation: true, changedFields: [] });
  assert.equal(alerts[0].type, 'baseline_recorded');
  assert.equal(alerts[0].severity, 'info');
});
