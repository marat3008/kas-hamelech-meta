const fs = require('fs');
const path = require('path');
const { normalizeQuery } = require('./hebrewNormalize');

const SEED_FILE = path.join(__dirname, '..', 'knowledge', 'seed-queries.json');

function loadSeedQueries() {
  const raw = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  return {
    ...raw,
    seedQueries: raw.seedQueries.map((entry) => ({
      ...entry,
      normalized: normalizeQuery(entry.query).normalized,
    })),
  };
}

module.exports = { loadSeedQueries, SEED_FILE };
