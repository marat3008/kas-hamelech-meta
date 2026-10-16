function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function stripTags(str) {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseAttrs(attrString) {
  const attrs = {};
  const attrRe = /([a-zA-Z-]+)\s*=\s*"([^"]*)"|([a-zA-Z-]+)\s*=\s*'([^']*)'/g;
  let match;
  while ((match = attrRe.exec(attrString))) {
    const key = (match[1] || match[3]).toLowerCase();
    attrs[key] = match[2] !== undefined ? match[2] : match[4];
  }
  return attrs;
}

// Regex-based, not a full HTML parser — deliberately simple since this only
// needs the handful of SEO-relevant tags, not arbitrary markup.
function extractSignals(html) {
  if (typeof html !== 'string') throw new TypeError('extractSignals expects an HTML string');

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(stripTags(titleMatch[1])) : null;

  let description = null;
  let robotsMeta = null;
  const openGraph = {};
  for (const [, raw] of html.matchAll(/<meta\s+([^>]*?)\/?>/gi)) {
    const attrs = parseAttrs(raw);
    if (attrs.name?.toLowerCase() === 'description' && attrs.content) {
      description = decodeEntities(attrs.content);
    }
    if (attrs.name?.toLowerCase() === 'robots' && attrs.content) {
      robotsMeta = attrs.content;
    }
    if (attrs.property?.toLowerCase().startsWith('og:') && attrs.content !== undefined) {
      openGraph[attrs.property.toLowerCase()] = decodeEntities(attrs.content);
    }
  }

  let canonical = null;
  for (const [, raw] of html.matchAll(/<link\s+([^>]*?)\/?>/gi)) {
    const attrs = parseAttrs(raw);
    if (attrs.rel?.toLowerCase() === 'canonical' && attrs.href) {
      canonical = attrs.href;
    }
  }

  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decodeEntities(stripTags(m[1])));
  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => decodeEntities(stripTags(m[1])));

  const jsonLd = [];
  for (const [, block] of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLd.push(JSON.parse(block));
    } catch {
      // malformed JSON-LD is common on real pages; skip rather than fail the whole extraction
    }
  }

  return { title, description, canonical, robotsMeta, openGraph, h1, h2, jsonLd };
}

module.exports = { extractSignals };
