function buildReport({ target, signals, diff, alerts, scores, generatedAt }) {
  return {
    target,
    generatedAt: generatedAt || new Date().toISOString(),
    signals: {
      title: signals.title,
      description: signals.description,
      canonical: signals.canonical,
      h1Count: (signals.h1 || []).length,
      h2Count: (signals.h2 || []).length,
      hasJsonLd: (signals.jsonLd || []).length > 0,
      hasOpenGraph: Object.keys(signals.openGraph || {}).length > 0,
    },
    diff: { changed: diff.changed, changedFields: diff.changedFields, isFirstObservation: diff.isFirstObservation },
    alerts,
    scores: scores || null,
  };
}

module.exports = { buildReport };
