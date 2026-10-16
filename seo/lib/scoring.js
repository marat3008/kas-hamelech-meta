const FORMULA_VERSION_OPP = 'opp-v1';
const FORMULA_VERSION_PRIORITY = 'priority-v1';
const FORMULA_VERSION_OMNI = 'omni-v1';
const FORMULA_VERSION_SOV = 'sov-v1';

const OPP_WEIGHTS = {
  businessFit: 0.20,
  intent: 0.20,
  competitorStrength: 0.15,
  ownedGap: 0.20,
  firstPartyEvidence: 0.10,
  trendSignal: 0.05,
  featureOpportunity: 0.10,
};
const OPP_MIN_COVERAGE = 0.60;

const PRIORITY_WEIGHTS = {
  opportunity: 0.30,
  expectedImpact: 0.20,
  evidenceConfidence: 0.15,
  urgency: 0.15,
  businessImportance: 0.10,
  feasibility: 0.10,
};
const PRIORITY_MIN_COVERAGE = 0.70;

const OMNI_CHANNEL_WEIGHTS = {
  organic: 0.45,
  paid: 0.15,
  local: 0.15,
  shopping: 0.10,
  imageVideo: 0.05,
  richAnswer: 0.10,
};

const SOV_MIN_COVERAGE = 0.60;

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Missing components are excluded; remaining weights renormalize only if
// minCoverage is met. Otherwise the score is null (insufficient_data) —
// never imputed as if it were an observed value.
function weightedScore(components, weights, minCoverage) {
  let availableWeight = 0;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const key of Object.keys(weights)) {
    totalWeight += weights[key];
    const value = components ? components[key] : undefined;
    if (value === null || value === undefined) continue;
    availableWeight += weights[key];
    weightedSum += weights[key] * value;
  }
  const coverage = totalWeight === 0 ? 0 : availableWeight / totalWeight;
  if (availableWeight === 0 || coverage < minCoverage) {
    return { score: null, coverage, reason: 'insufficient_data' };
  }
  return { score: round2((weightedSum / availableWeight) * 100), coverage, reason: null };
}

function scoreOpportunity(components) {
  const result = weightedScore(components, OPP_WEIGHTS, OPP_MIN_COVERAGE);
  return { ...result, formulaVersion: FORMULA_VERSION_OPP, components };
}

function scorePriority(components) {
  const result = weightedScore(components, PRIORITY_WEIGHTS, PRIORITY_MIN_COVERAGE);
  return { ...result, formulaVersion: FORMULA_VERSION_PRIORITY, components };
}

function organicPresence(position, maxRank) {
  if (position === null || position === undefined) return 0;
  const capped = Math.min(position, maxRank);
  return 1 / Math.log2(capped + 1);
}

// channelObservations[channel] = { supported, present, position?, prominence? }
// An unsupported/missing channel is excluded from the denominator (coverage
// drops) rather than counted as a zero presence value.
function scoreOmnipresence(channelObservations, options = {}) {
  const maxRank = options.maxRank || 100;
  const observations = channelObservations || {};
  let weightedSum = 0;
  let availableWeight = 0;
  let totalWeight = 0;
  const channelVector = {};

  for (const channel of Object.keys(OMNI_CHANNEL_WEIGHTS)) {
    const weight = OMNI_CHANNEL_WEIGHTS[channel];
    totalWeight += weight;
    const observation = observations[channel];
    if (!observation || observation.supported === false) {
      channelVector[channel] = null;
      continue;
    }
    availableWeight += weight;
    const presence = !observation.present
      ? 0
      : channel === 'organic'
        ? organicPresence(observation.position, maxRank)
        : observation.prominence ?? 1;
    channelVector[channel] = presence;
    weightedSum += weight * presence;
  }

  const coverage = totalWeight === 0 ? 0 : availableWeight / totalWeight;
  if (availableWeight === 0) {
    return { score: null, coverage, channelVector, formulaVersion: FORMULA_VERSION_OMNI, reason: 'insufficient_data' };
  }
  return {
    score: round2((weightedSum / availableWeight) * 100),
    coverage,
    channelVector,
    formulaVersion: FORMULA_VERSION_OMNI,
    reason: null,
  };
}

// entityVisibility: { entityId: visibilityContribution }. Relative to the
// observed entity set/provider coverage only — not market-wide share.
function scoreShareOfVoice(entityVisibility, options = {}) {
  const minCoverage = options.minCoverage ?? SOV_MIN_COVERAGE;
  const coverage = options.coverage ?? 1;
  const entries = Object.entries(entityVisibility || {});
  const denominator = entries.reduce((sum, [, v]) => sum + (v || 0), 0);
  if (denominator === 0 || coverage < minCoverage) {
    return { scores: null, formulaVersion: FORMULA_VERSION_SOV, reason: denominator === 0 ? 'zero_denominator' : 'insufficient_data' };
  }
  const scores = {};
  for (const [entityId, value] of entries) {
    scores[entityId] = round2((value / denominator) * 100);
  }
  return { scores, formulaVersion: FORMULA_VERSION_SOV, reason: null };
}

function visibilityGap(competitorOmni, ownedOmni) {
  if (competitorOmni === null || competitorOmni === undefined || ownedOmni === null || ownedOmni === undefined) {
    return { gap: null, signedDiff: null, reason: 'insufficient_data' };
  }
  const diff = competitorOmni - ownedOmni;
  return { gap: Math.max(0, diff), signedDiff: diff, reason: null };
}

module.exports = {
  weightedScore,
  scoreOpportunity,
  scorePriority,
  scoreOmnipresence,
  scoreShareOfVoice,
  visibilityGap,
  FORMULA_VERSION_OPP,
  FORMULA_VERSION_PRIORITY,
  FORMULA_VERSION_OMNI,
  FORMULA_VERSION_SOV,
};
