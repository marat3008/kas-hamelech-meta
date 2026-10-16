const test = require('node:test');
const assert = require('node:assert/strict');
const { parseRobots, isAllowed, crawlDelayFor } = require('../lib/robotsPolicy');

const ROBOTS_TXT = `
User-agent: *
Disallow: /admin
Allow: /admin/public
Crawl-delay: 2

User-agent: BadBot
Disallow: /
`;

test('an empty Disallow means allow-everything, not a blanket block', () => {
  const parsed = parseRobots('User-agent: *\nDisallow:');
  assert.equal(isAllowed(parsed, 'anybot', '/anything'), true);
});

test('the more specific Allow rule wins over a shorter Disallow prefix', () => {
  const parsed = parseRobots(ROBOTS_TXT);
  assert.equal(isAllowed(parsed, 'MyBot', '/admin/secret'), false);
  assert.equal(isAllowed(parsed, 'MyBot', '/admin/public/page'), true);
});

test('a named group overrides the wildcard group for that agent', () => {
  const parsed = parseRobots(ROBOTS_TXT);
  assert.equal(isAllowed(parsed, 'BadBot', '/anything'), false);
  assert.equal(isAllowed(parsed, 'OtherBot', '/anything'), true);
});

test('reads the crawl-delay for the matching group', () => {
  const parsed = parseRobots(ROBOTS_TXT);
  assert.equal(crawlDelayFor(parsed, 'MyBot'), 2);
});
