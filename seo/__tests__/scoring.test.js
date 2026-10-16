const test = require('node:test');
const assert = require('node:assert/strict');
const {
  scoreOpportunity,
  scoreOmnipresence,
  scoreShareOfVoice,
  visibilityGap,
} = require('../lib/scoring');

test('opportunity score is null below minimum coverage', () => {
  const result = scoreOpportunity({ businessFit: 0.8 });
  assert.equal(result.score, null);
  assert.equal(result.reason, 'insufficient_data');
});

test('opportunity score is deterministic and versioned once coverage is sufficient', () => {
  const components = {
    businessFit: 0.8,
    intent: 0.7,
    competitorStrength: 0.5,
    ownedGap: 0.6,
    firstPartyEvidence: 0.4,
    trendSignal: 0.5,
    featureOpportunity: 0.3,
  };
  const a = scoreOpportunity(components);
  const b = scoreOpportunity(components);
  assert.equal(a.score, b.score);
  assert.equal(a.formulaVersion, 'opp-v1');
  assert.ok(a.score > 0 && a.score <= 100);
});

test('omnipresence excludes unsupported channels instead of scoring them zero', () => {
  const result = scoreOmnipresence({
    organic: { supported: true, present: true, position: 3 },
    paid: { supported: false },
    local: { supported: false },
    shopping: { supported: false },
    imageVideo: { supported: false },
    richAnswer: { supported: false },
  });
  assert.ok(result.coverage < 1);
  assert.equal(result.channelVector.paid, null);
  assert.ok(result.score > 0);
});

test('omnipresence is null when no channel is supported', () => {
  const result = scoreOmnipresence({});
  assert.equal(result.score, null);
});

test('share of voice normalizes to 100 and returns null on zero denominator', () => {
  const r = scoreShareOfVoice({ us: 30, competitorA: 70 });
  assert.equal(r.scores.us + r.scores.competitorA, 100);
  const zero = scoreShareOfVoice({ us: 0, competitorA: 0 });
  assert.equal(zero.scores, null);
});

test('visibility gap is never negative and preserves the signed difference', () => {
  const g = visibilityGap(40, 60);
  assert.equal(g.gap, 0);
  assert.equal(g.signedDiff, -20);
});
