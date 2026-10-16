const { getCapability, listProviders } = require('./capabilityRegistry');

// The core principle: the agent must work for free. These never go
// unavailable because of billing — they're public-data scanning, not a paid
// API. Paid providers (from capabilityRegistry) are optional adapters layered
// on top; losing one must never disable this list.
const FREE_PROVIDERS = [
  { name: 'WebsiteSEO', free: true, available: true, reason: null },
  { name: 'RobotsAndSitemap', free: true, available: true, reason: null },
  { name: 'TikTokFirstParty', free: true, available: true, reason: 'Manual read via Claude-in-Chrome; not an API.' },
];

function describePaidProvider(name, feature) {
  const cap = getCapability(name, feature);
  return {
    name,
    free: false,
    available: cap.status === 'available',
    reason: cap.status === 'unsupported' ? cap.reason : null,
  };
}

// `feature` lets a caller probe a specific capability on each registered
// paid provider; defaults to a representative feature for the status list.
function listProviderStatus(feature = 'organic_keywords') {
  const paid = listProviders().map((name) => describePaidProvider(name, feature));
  return [...FREE_PROVIDERS, ...paid];
}

module.exports = { listProviderStatus, FREE_PROVIDERS };
