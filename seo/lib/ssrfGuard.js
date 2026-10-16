const net = require('net');

// Best-effort, dependency-free blocklist. Not exhaustive CIDR arithmetic for
// every reserved range, but covers loopback, RFC1918/4193 private space,
// link-local (incl. the 169.254.169.254 cloud metadata address), multicast,
// and IPv4-mapped IPv6 (re-checked against the IPv4 rules).
const IPV4_BLOCKED_RANGES = [
  ['0.0.0.0', '0.255.255.255'],
  ['10.0.0.0', '10.255.255.255'],
  ['100.64.0.0', '100.127.255.255'],
  ['127.0.0.0', '127.255.255.255'],
  ['169.254.0.0', '169.254.255.255'],
  ['172.16.0.0', '172.31.255.255'],
  ['192.0.0.0', '192.0.0.255'],
  ['192.0.2.0', '192.0.2.255'],
  ['192.168.0.0', '192.168.255.255'],
  ['198.18.0.0', '198.19.255.255'],
  ['198.51.100.0', '198.51.100.255'],
  ['203.0.113.0', '203.0.113.255'],
  ['224.0.0.0', '255.255.255.255'],
];

function ipv4ToInt(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function isBlockedIPv4(ip) {
  const value = ipv4ToInt(ip);
  return IPV4_BLOCKED_RANGES.some(([start, end]) => value >= ipv4ToInt(start) && value <= ipv4ToInt(end));
}

function isBlockedIPv6(ip) {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('::ffff:')) {
    const mapped = normalized.slice('::ffff:'.length);
    if (net.isIPv4(mapped)) return isBlockedIPv4(mapped);
  }
  return ['fe8', 'fe9', 'fea', 'feb', 'fc', 'fd', 'ff'].some((prefix) => normalized.startsWith(prefix));
}

function isBlockedAddress(ip) {
  if (net.isIPv4(ip)) return isBlockedIPv4(ip);
  if (net.isIPv6(ip)) return isBlockedIPv6(ip);
  throw new TypeError(`not a valid IP address: ${ip}`);
}

function assertSafeUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: 'invalid_url' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, reason: 'unsupported_protocol' };
  }
  if (parsed.username || parsed.password) {
    return { safe: false, reason: 'userinfo_not_allowed' };
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(hostname) && isBlockedAddress(hostname)) {
    return { safe: false, reason: 'blocked_ip_literal' };
  }
  return { safe: true, url: parsed };
}

module.exports = { isBlockedAddress, isBlockedIPv4, isBlockedIPv6, assertSafeUrl };
