function extractSitemapUrls(xml) {
  if (typeof xml !== 'string') throw new TypeError('extractSitemapUrls expects a string');
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
}

function extractSitemapDirectives(robotsText) {
  return (robotsText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^sitemap\s*:/i.test(line))
    .map((line) => line.split(':').slice(1).join(':').trim());
}

module.exports = { extractSitemapUrls, extractSitemapDirectives };
