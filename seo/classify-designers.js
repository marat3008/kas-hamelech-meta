// Grisha — AI classification pass for the designer registry (seo/config/designers.json).
// Append-only per Marat's rule: never deletes existing fields, only adds/updates
// classification + evidence for entries still marked UNCLASSIFIED.
// Runs entirely against the local OmniRoute free gateway (127.0.0.1:20128) —
// zero Claude tokens. Must be executed on the real Windows host (not the
// cloud VM), since only the host can reach 127.0.0.1:20128.

const fs = require('fs');
const path = require('path');
const { SnapshotStore } = require('./lib/snapshotStore');

const ROOT = __dirname;
const DESIGNERS_FILE = path.join(ROOT, 'config', 'designers.json');
const SNAPSHOT_DIR = path.join(ROOT, 'data', 'snapshots');
const OMNI_URL = 'http://127.0.0.1:20128/v1/chat/completions';
const MODELS = ['auto/best-free', 'grisha-fast', 'grisha-balanced', 'groq/llama-3.1-8b-instant'];
const ALLOWED = ['HAREDI_CORE', 'HAREDI_INSTITUTIONAL', 'GENERAL', 'NOT_RELEVANT'];

const store = new SnapshotStore({ dir: SNAPSHOT_DIR });

function hasCJK(s) {
  return /[぀-ヿ㐀-䶿一-鿿]/.test(s || '');
}

async function callFree(messages) {
  for (const model of MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(OMNI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.2, stream: false }),
        signal: controller.signal,
      });
      if (!res.ok) continue;
      const data = await res.json();
      const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (content && content.trim()) return { content, model };
    } catch (_) {
      // try next model
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (_) {
    return null;
  }
}

function buildPrompt(designer, signals) {
  const title = (signals && signals.title) || '';
  const description = (signals && signals.description) || '';
  const h1 = Array.isArray(signals && signals.h1) ? signals.h1.join(' | ') : '';
  const h2 = Array.isArray(signals && signals.h2) ? signals.h2.slice(0, 5).join(' | ') : '';
  const sys = 'אתה מסייע לסווג מעצבי/אדריכלי פנים ישראלים לפי התמחות מגזרית, על בסיס אותות אתר (title/meta/H1/H2) בלבד. ' +
    'ענה ב-JSON תקני בלבד, בלי טקסט נוסף, בלי Markdown, בלי תווים סיניים/יפניים. ' +
    'סכמה: {"classification":"HAREDI_CORE|HAREDI_INSTITUTIONAL|GENERAL|NOT_RELEVANT","reason":"עד 20 מילים בעברית, מצטט/מתבסס על האותות"}. ' +
    'HAREDI_CORE = המעצב/ת מתמחה או פונה במפורש למגזר החרדי/דתי (תוכן/לשון מעידה). ' +
    'HAREDI_INSTITUTIONAL = התמחות בבתי כנסת/ישיבות/מבני ציבור דתיים. ' +
    'GENERAL = מעצב/ת פנים כללי, בלי אינדיקציה מגזרית. ' +
    'NOT_RELEVANT = לא מעצב/ת פנים בפועל, או אתר לא רלוונטי/לא תקין.';
  const user = 'שם: ' + designer.name + '\nכתובת: ' + designer.canonicalWebsite + '\nTitle: ' + title + '\nDescription: ' + description + '\nH1: ' + h1 + '\nH2: ' + h2;
  return [
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ];
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const designers = JSON.parse(fs.readFileSync(DESIGNERS_FILE, 'utf8'));
  const targets = designers.filter((d) => d.classification === 'UNCLASSIFIED');
  console.log('Total designers: ' + designers.length + ' | UNCLASSIFIED to process: ' + targets.length);

  const counts = {};
  let processed = 0;
  let skippedNoSnapshot = 0;
  let failed = 0;

  for (const designer of targets) {
    const latest = store.loadLatest(designer.canonicalWebsite);
    if (!latest || !latest.signals) {
      skippedNoSnapshot += 1;
      continue;
    }
    const messages = buildPrompt(designer, latest.signals);
    const result = await callFree(messages);
    if (!result) {
      failed += 1;
      console.log('[FAIL] ' + designer.canonicalWebsite + ' - no model responded');
      continue;
    }
    const parsed = extractJson(result.content);
    const nowIso = new Date().toISOString();
    if (!parsed || !ALLOWED.includes(parsed.classification) || hasCJK(parsed.reason)) {
      designer.verificationStatus = 'NEEDS_REVIEW';
      designer.evidence = (designer.evidence || []).concat([
        'AI classification attempt via OmniRoute (' + result.model + ') returned invalid output - flagged for manual review (' + nowIso + ').',
      ]);
      designer.lastCheckedAt = nowIso;
      counts.NEEDS_REVIEW = (counts.NEEDS_REVIEW || 0) + 1;
      processed += 1;
      continue;
    }
    designer.classification = parsed.classification;
    designer.verificationStatus = 'AI_CLASSIFIED';
    designer.evidence = (designer.evidence || []).concat([
      'AI classification via OmniRoute (' + result.model + ') from live title/meta snapshot: "' + parsed.reason + '" (' + nowIso + ').',
    ]);
    designer.lastCheckedAt = nowIso;
    counts[parsed.classification] = (counts[parsed.classification] || 0) + 1;
    processed += 1;
    await sleep(150);
  }

  const tmpFile = DESIGNERS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(designers, null, 2));
  fs.renameSync(tmpFile, DESIGNERS_FILE);

  console.log('--- Classification run complete ---');
  console.log('Processed: ' + processed + ' | Skipped (no snapshot): ' + skippedNoSnapshot + ' | Failed (no model): ' + failed);
  console.log('Breakdown: ' + JSON.stringify(counts));
}

main().catch((err) => {
  console.error('Classification run failed:', err);
  process.exitCode = 1;
});
