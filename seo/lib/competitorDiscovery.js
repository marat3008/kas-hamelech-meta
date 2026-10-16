const DEFAULT_THRESHOLD = {
  minObservations: 3,
  minDistinctQueries: 2,
  minDistinctDates: 2,
  windowDays: 30,
  minBusinessRelevance: 0.60,
};

// A single appearance is a lead, not a competitor. Promotion to "candidate"
// requires independent evidence across queries and dates within the window.
function evaluateCandidate(observations, options = {}) {
  const threshold = { ...DEFAULT_THRESHOLD, ...options };
  if (!Array.isArray(observations) || observations.length === 0) {
    return { isCandidate: false, observationCount: 0, reason: 'no_observations', threshold };
  }

  const windowMs = threshold.windowDays * 24 * 60 * 60 * 1000;
  const latest = Math.max(...observations.map((o) => new Date(o.observedAt).getTime()));
  const inWindow = observations.filter((o) => latest - new Date(o.observedAt).getTime() <= windowMs);

  const distinctQueries = new Set(inWindow.map((o) => o.queryId)).size;
  const distinctDates = new Set(inWindow.map((o) => new Date(o.observedAt).toISOString().slice(0, 10))).size;
  const avgRelevance = inWindow.reduce((sum, o) => sum + (o.businessRelevance ?? 0), 0) / inWindow.length;

  const isCandidate =
    inWindow.length >= threshold.minObservations &&
    distinctQueries >= threshold.minDistinctQueries &&
    distinctDates >= threshold.minDistinctDates &&
    avgRelevance >= threshold.minBusinessRelevance;

  return {
    isCandidate,
    observationCount: inWindow.length,
    distinctQueries,
    distinctDates,
    avgRelevance,
    threshold,
    reason: isCandidate ? null : 'threshold_not_met',
  };
}

module.exports = { evaluateCandidate, DEFAULT_THRESHOLD };
