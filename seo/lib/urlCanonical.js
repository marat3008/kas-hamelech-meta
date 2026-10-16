const TRACKING_PARAM_PREFIXES = ['utm_', 'fbclid', 'gclid', 'yclid', 'mc_cid', 'mc_eid', 'msclkid', '_ga'];

function isTrackingParam(key) {
  const lower = key.toLowerCase();
  return TRACKING_PARAM_PREFIXES.some((prefix) => lower === prefix || lower.startsWith(prefix));
}

// Normalizes a URL for identity/comparison purposes only — never for
// deciding SSRF safety, which stays ssrfGuard's job on the exact URL about
// to be fetched. Lowercases the host, strips a leading "www.", drops the
// fragment, removes known tracking params, sorts the remaining params, and
// collapses a trailing-slash-only difference, so equivalent URLs compare equal.
function canonicalizeUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new TypeError('canonicalizeUrl expects a non-empty string');
  }
  const url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  url.hash = '';

  const kept = [...url.searchParams.entries()]
    .filter(([key]) => !isTrackingParam(key))
    .sort(([a], [b]) => (a === b ? 0 : a < b ? -1 : 1));
  url.search = '';
  for (const [key, value] of kept) url.searchParams.append(key, value);

  const trimmedPath = url.pathname.replace(/\/+$/, '');
  url.pathname = trimmedPath === '' ? '/' : trimmedPath;

  return url.toString();
}

module.exports = { canonicalizeUrl, isTrackingParam };
