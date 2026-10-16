const dns = require('dns');
const http = require('http');
const https = require('https');
const { assertSafeUrl, isBlockedAddress } = require('./ssrfGuard');

const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 10000;
const REDIRECT_CODES = [301, 302, 303, 307, 308];

function defaultResolve(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses.map((a) => a.address));
    });
  });
}

function defaultRequest({ ipAddress, hostname, port, protocol, path, headers, timeoutMs, maxBytes }) {
  const transport = protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        host: ipAddress,
        port: port || (protocol === 'https:' ? 443 : 80),
        path,
        method: 'GET',
        headers: { ...headers, Host: hostname },
        servername: protocol === 'https:' ? hostname : undefined,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        let total = 0;
        res.on('data', (chunk) => {
          total += chunk.length;
          if (total > maxBytes) {
            req.destroy(new Error('max_bytes_exceeded'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') });
        });
        res.on('error', reject);
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

// SSRF-safe GET with dependency-injectable DNS resolution and transport so
// tests exercise the decision logic (blocking, redirect cap, downgrade
// rejection) without touching the network. Re-validates and re-resolves on
// every redirect hop rather than trusting the first check.
async function safeFetch(targetUrl, options = {}) {
  const {
    maxRedirects = DEFAULT_MAX_REDIRECTS,
    maxBytes = DEFAULT_MAX_BYTES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    userAgent = 'KingChairsCompetitorBot/1.0 (+offline)',
    headers = {},
    resolve = defaultResolve,
    request = defaultRequest,
  } = options;

  let currentUrl = targetUrl;
  let redirects = 0;
  let previousProtocol = null;

  for (;;) {
    const check = assertSafeUrl(currentUrl);
    if (!check.safe) return { ok: false, reason: check.reason, url: currentUrl };
    const parsed = check.url;

    if (previousProtocol === 'https:' && parsed.protocol === 'http:') {
      return { ok: false, reason: 'protocol_downgrade', url: currentUrl };
    }
    previousProtocol = parsed.protocol;

    let addresses;
    try {
      addresses = await resolve(parsed.hostname);
    } catch (err) {
      return { ok: false, reason: 'dns_resolution_failed', url: currentUrl, error: err.message };
    }
    if (!addresses || addresses.length === 0) {
      return { ok: false, reason: 'dns_resolution_failed', url: currentUrl };
    }
    const blocked = addresses.find((ip) => {
      try {
        return isBlockedAddress(ip);
      } catch {
        return true;
      }
    });
    if (blocked) {
      return { ok: false, reason: 'blocked_resolved_address', url: currentUrl, address: blocked };
    }

    let response;
    try {
      response = await request({
        ipAddress: addresses[0],
        hostname: parsed.hostname,
        port: parsed.port,
        protocol: parsed.protocol,
        path: parsed.pathname + parsed.search,
        headers: { 'User-Agent': userAgent, ...headers },
        timeoutMs,
        maxBytes,
      });
    } catch (err) {
      return { ok: false, reason: 'request_failed', url: currentUrl, error: err.message };
    }

    if (REDIRECT_CODES.includes(response.statusCode)) {
      const location = response.headers.location;
      if (!location) return { ok: false, reason: 'redirect_without_location', url: currentUrl };
      if (redirects >= maxRedirects) return { ok: false, reason: 'too_many_redirects', url: currentUrl };
      redirects += 1;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return { ok: true, url: currentUrl, statusCode: response.statusCode, headers: response.headers, body: response.body, redirects };
  }
}

module.exports = { safeFetch, defaultResolve, defaultRequest, DEFAULT_MAX_REDIRECTS, DEFAULT_MAX_BYTES, DEFAULT_TIMEOUT_MS };
