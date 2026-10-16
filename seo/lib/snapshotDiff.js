const crypto = require('crypto');

const TRACKED_FIELDS = ['title', 'description', 'canonical', 'robotsMeta'];

function hashSignals(signals) {
  return crypto.createHash('sha256').update(JSON.stringify(signals)).digest('hex');
}

function diffSignals(previous, current) {
  if (!previous) {
    return { changed: true, isFirstObservation: true, changedFields: [], contentHash: hashSignals(current) };
  }
  const changedFields = TRACKED_FIELDS.filter((field) => JSON.stringify(previous[field]) !== JSON.stringify(current[field]));
  if (JSON.stringify(previous.h1) !== JSON.stringify(current.h1)) changedFields.push('h1');
  if (JSON.stringify(previous.h2) !== JSON.stringify(current.h2)) changedFields.push('h2');
  if (JSON.stringify(previous.jsonLd) !== JSON.stringify(current.jsonLd)) changedFields.push('jsonLd');
  if (JSON.stringify(previous.openGraph) !== JSON.stringify(current.openGraph)) changedFields.push('openGraph');

  return {
    changed: changedFields.length > 0,
    isFirstObservation: false,
    changedFields,
    contentHash: hashSignals(current),
  };
}

module.exports = { diffSignals, hashSignals, TRACKED_FIELDS };
