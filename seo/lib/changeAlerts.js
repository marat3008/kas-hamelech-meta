const SEVERITY_BY_FIELD = {
  title: 'high',
  canonical: 'high',
  robotsMeta: 'high',
  description: 'medium',
  jsonLd: 'medium',
  h1: 'medium',
  h2: 'low',
  openGraph: 'low',
};

function buildAlerts(target, diffResult) {
  if (!diffResult.changed) return [];
  if (diffResult.isFirstObservation) {
    return [{ type: 'baseline_recorded', severity: 'info', target, message: `First observation recorded for ${target}.` }];
  }
  return diffResult.changedFields.map((field) => ({
    type: 'signal_changed',
    field,
    severity: SEVERITY_BY_FIELD[field] || 'low',
    target,
    message: `${field} changed for ${target}.`,
  }));
}

module.exports = { buildAlerts, SEVERITY_BY_FIELD };
