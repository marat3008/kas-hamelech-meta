const REGISTRY_VERSION = 'capability-registry-v1';

// Intentionally empty: no SEO data provider has been selected and verified.
// Do not register one here until its official docs, supported dimensions,
// authentication, terms, and pricing have been confirmed.
const PROVIDERS = {};

function getCapability(providerName, feature) {
  const provider = PROVIDERS[providerName];
  if (!provider) {
    return { status: 'unsupported', reason: 'missing_credentials', registryVersion: REGISTRY_VERSION };
  }
  const capability = provider.capabilities[feature];
  if (!capability) {
    return { status: 'unsupported', reason: 'unsupported', registryVersion: REGISTRY_VERSION };
  }
  return { ...capability, registryVersion: REGISTRY_VERSION };
}

function registerProvider(definition) {
  if (!definition || !definition.name || !definition.capabilities) {
    throw new TypeError('provider definition requires name and capabilities');
  }
  PROVIDERS[definition.name] = definition;
}

function listProviders() {
  return Object.keys(PROVIDERS);
}

// Verified 2026-10-08 against the connected Ahrefs API v3 MCP: the server
// responds (auth works, OpenAPI docs fetched live), but every endpoint
// tried — including the ones Ahrefs documents as free/unit-less — returns
// {"error":"Insufficient plan"}. Re-verified 2026-10-16 (domain_rating only,
// same result) — still blocked, no plan change yet. Recorded as unsupported
// with evidence so a future session doesn't silently re-probe or assume
// it's unconfigured; re-verify after the account's Ahrefs plan changes.
registerProvider({
  name: 'ahrefs',
  capabilities: {
    domain_rating: {
      status: 'unsupported',
      reason: 'insufficient_plan',
      evidenceRef: '2026-10-16 site-explorer-domain-rating(target=kingchairs.co.il) -> {"error":"Insufficient plan"} (also 2026-10-08, same result)',
      lastVerified: '2026-10-16',
    },
    organic_keywords: {
      status: 'unsupported',
      reason: 'insufficient_plan',
      evidenceRef: '2026-10-08 site-explorer-organic-keywords(target=kingchairs.co.il) -> {"error":"Insufficient plan"}',
      lastVerified: '2026-10-08',
    },
    public_domain_rating_free: {
      status: 'unsupported',
      reason: 'insufficient_plan',
      evidenceRef: '2026-10-08 public-domain-rating-free(targets=[kingchairs.co.il]) -> {"error":"Insufficient plan"}',
      lastVerified: '2026-10-08',
    },
  },
});

module.exports = { getCapability, registerProvider, listProviders, REGISTRY_VERSION };
