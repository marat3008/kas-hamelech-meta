const test = require('node:test');
const assert = require('node:assert/strict');
const { extractSitemapUrls, extractSitemapDirectives } = require('../lib/sitemapDiscovery');

test('extracts <loc> entries from a sitemap xml document', () => {
  const xml = '<urlset><url><loc>https://competitor.test/a</loc></url><url><loc>https://competitor.test/b</loc></url></urlset>';
  assert.deepEqual(extractSitemapUrls(xml), ['https://competitor.test/a', 'https://competitor.test/b']);
});

test('finds Sitemap: directives in robots.txt', () => {
  const robots = 'User-agent: *\nDisallow: /admin\nSitemap: https://competitor.test/sitemap.xml';
  assert.deepEqual(extractSitemapDirectives(robots), ['https://competitor.test/sitemap.xml']);
});
