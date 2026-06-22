// ===================================================
// Scheduler — תזמון פרסום אוטונומי
// כס המלך עיצובים — 4-5 פוסטים בשבוע
// ===================================================

const cron    = require('node-cron');
const { getNextPost } = require('./content-library');
const { publishPost } = require('./publisher');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// לוח פרסום שבועי (שעון ישראל = UTC+3)
//
//  ראשון  18:00  — פתיחת שבוע
//  שלישי  12:00  — אמצע שבוע
//  רביעי  20:00  — פריים-טיים ערב
//  שישי   09:30  — בוקר שישי
//  שבת    20:00  — מוצאי שבת (פוסט שישי)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// UTC offset: ישראל = UTC+3 (קיץ), UTC+2 (חורף)
// כל הזמנים ב-UTC (Node.js/cron רץ ב-UTC על Render):
//   ראשון  = ב-UTC 15:00 (18:00 ישראל)
//   שלישי  = ב-UTC 09:00 (12:00 ישראל)
//   רביעי  = ב-UTC 17:00 (20:00 ישראל)
//   שישי   = ב-UTC 06:30 (09:30 ישראל)
//   שבת    = ב-UTC 17:00 (20:00 ישראל)

const SCHEDULE = [
  { name: 'ראשון-ערב',     cron: '0 15 * * 0' },
  { name: 'שלישי-צהריים',  cron: '0 9  * * 2' },
  { name: 'רביעי-ערב',     cron: '0 17 * * 3' },
  { name: 'שישי-בוקר',     cron: '30 6  * * 5' },
  { name: 'מוצאי-שבת',     cron: '0 17 * * 6' },
];

const activeTasks = [];

async function runPublish(slotName) {
  const post = getNextPost();
  console.log(`\n📅 [${slotName}] מתחיל פרסום — "${post.id}" (${post.category})`);

  const imageUrl = process.env.DEFAULT_POST_IMAGE_URL || null;

  const result = await publishPost(post, { imageUrl });

  if (result.results.length > 0) {
    console.log(`✅ [${slotName}] פורסם ב-${result.results.map(r => r.platform).join(', ')}`);
  }
  if (result.errors.length > 0) {
    console.log(`⚠️ [${slotName}] שגיאות: ${result.errors.map(e => `${e.platform}: ${e.error}`).join(' | ')}`);
  }
}

function startScheduler() {
  if (activeTasks.length > 0) {
    console.log('⚠️ Scheduler כבר פועל — לא מפעיל שוב');
    return;
  }

  console.log('');
  console.log('⏰ ===================================');
  console.log('   Scheduler פרסום אוטונומי — פעיל');
  console.log('===================================');

  for (const slot of SCHEDULE) {
    const task = cron.schedule(slot.cron, () => runPublish(slot.name), { timezone: 'UTC' });
    activeTasks.push(task);
    console.log(`  📌 ${slot.name.padEnd(18)} — ${slot.cron}`);
  }

  console.log('===================================');
  console.log('');
}

function stopScheduler() {
  activeTasks.forEach(t => t.stop());
  activeTasks.length = 0;
  console.log('🛑 Scheduler הופסק');
}

function getScheduleStatus() {
  return {
    running: activeTasks.length > 0,
    slots: SCHEDULE.map(s => ({ name: s.name, cron: s.cron })),
  };
}

module.exports = { startScheduler, stopScheduler, getScheduleStatus, runPublish };
