const test = require('node:test');
const assert = require('node:assert/strict');
const { extractSignals } = require('../lib/htmlSignals');

const SAMPLE_HTML = `
<html><head>
<title>כיסאות יוקרה | כס המלך</title>
<meta name="description" content="כיסאות מרופדים בעבודת יד">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://kingchairs.co.il/">
<meta property="og:title" content="כיסאות יוקרה">
<script type="application/ld+json">{"@type":"Product","name":"כיסא יוקרה"}</script>
<script type="application/ld+json">{ not valid json </script>
</head><body>
<h1>כיסאות יוקרה בעבודת יד</h1>
<h2>פינת אוכל מעוצבת</h2>
</body></html>`;

test('extracts title, description, canonical, robots meta, and OpenGraph', () => {
  const signals = extractSignals(SAMPLE_HTML);
  assert.equal(signals.title, 'כיסאות יוקרה | כס המלך');
  assert.equal(signals.description, 'כיסאות מרופדים בעבודת יד');
  assert.equal(signals.canonical, 'https://kingchairs.co.il/');
  assert.equal(signals.robotsMeta, 'index, follow');
  assert.equal(signals.openGraph['og:title'], 'כיסאות יוקרה');
});

test('parses valid JSON-LD and skips malformed blocks instead of failing', () => {
  const signals = extractSignals(SAMPLE_HTML);
  assert.equal(signals.jsonLd.length, 1);
  assert.equal(signals.jsonLd[0].name, 'כיסא יוקרה');
});

test('collects h1/h2 text with tags stripped', () => {
  const signals = extractSignals(SAMPLE_HTML);
  assert.deepEqual(signals.h1, ['כיסאות יוקרה בעבודת יד']);
  assert.deepEqual(signals.h2, ['פינת אוכל מעוצבת']);
});

test('decodes numeric HTML entities (hex and decimal), not just named ones', () => {
  const signals = extractSignals('<title>חנות &#x2d; עיצוב &#8211; פנים &#39;מצוטט&#39;</title>');
  assert.equal(signals.title, "חנות - עיצוב – פנים 'מצוטט'");
});
