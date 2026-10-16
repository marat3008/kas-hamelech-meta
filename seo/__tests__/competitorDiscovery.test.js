const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateCandidate } = require('../lib/competitorDiscovery');

test('a single appearance is only a lead, not a candidate', () => {
  const result = evaluateCandidate([
    { observedAt: '2026-10-01T00:00:00Z', queryId: 'q1', businessRelevance: 0.9 },
  ]);
  assert.equal(result.isCandidate, false);
});

test('meets the threshold across distinct queries and dates within the window', () => {
  const result = evaluateCandidate([
    { observedAt: '2026-10-01T00:00:00Z', queryId: 'q1', businessRelevance: 0.9 },
    { observedAt: '2026-10-05T00:00:00Z', queryId: 'q2', businessRelevance: 0.8 },
    { observedAt: '2026-10-10T00:00:00Z', queryId: 'q1', businessRelevance: 0.7 },
  ]);
  assert.equal(result.isCandidate, true);
});

test('observations outside the rolling window are excluded', () => {
  const result = evaluateCandidate([
    { observedAt: '2026-01-01T00:00:00Z', queryId: 'q1', businessRelevance: 0.9 },
    { observedAt: '2026-10-05T00:00:00Z', queryId: 'q2', businessRelevance: 0.8 },
    { observedAt: '2026-10-10T00:00:00Z', queryId: 'q1', businessRelevance: 0.7 },
  ]);
  assert.equal(result.observationCount, 2);
  assert.equal(result.isCandidate, false);
});
