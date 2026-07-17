// ===================================================
// שרת ראשי — כס המלך עיצובים
// Meta Webhooks + פרסום אוטונומי
// ===================================================

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const crypto   = require('crypto');

const publishRoutes = require('./publishing/routes');
const { startScheduler } = require('./publishing/scheduler');

const app = express();

app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// אימות חתימת Meta
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function verifyMetaSignature(req) {
  if (!process.env.META_APP_SECRET) return true; // dev mode
  const signature = req.get('x-hub-signature-256') || '';
  const expected  = 'sha256=' + crypto
    .createHmac('sha256', process.env.META_APP_SECRET)
    .update(req.rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Webhook Meta
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/webhooks/meta', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Webhook Meta אומת');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post('/webhooks/meta', (req, res) => {
  if (!verifyMetaSignature(req)) return res.sendStatus(401);
  res.sendStatus(200);

  const { object, entry = [] } = req.body;
  console.log(`📡 Webhook נכנס: ${object} (${entry.length} entries)`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Publishing API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use('/api/publish', publishRoutes);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// בדיקת תקינות
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    business: 'כס המלך עיצובים',
    time: new Date().toISOString(),
    autoPublish: 'active',
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'כס המלך עיצובים — מערכת פרסום אוטונומית',
    endpoints: {
      health:         'GET  /health',
      publishNow:     'POST /api/publish/now',
      postList:       'GET  /api/publish/posts',
      toFacebook:     'POST /api/publish/facebook',
      toInstagram:    'POST /api/publish/instagram',
      toBuffer:       'POST /api/publish/buffer',
      schedulerStart: 'POST /api/publish/scheduler/start',
      schedulerStop:  'POST /api/publish/scheduler/stop',
      schedulerRun:   'POST /api/publish/scheduler/run-now',
      schedulerStatus:'GET  /api/publish/status',
    },
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// הפעלה
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('👑 ===================================');
  console.log('   כס המלך עיצובים — מערכת פעילה');
  console.log('===================================');
  console.log(`🌐 פורט: ${PORT}`);
  console.log(`📡 Webhook: /webhooks/meta`);
  console.log(`📢 Publish API: /api/publish`);
  console.log('===================================');
  console.log('');

  // הפעלת scheduler אוטומטי
  if (process.env.AUTO_PUBLISH === 'true') {
    startScheduler();
  } else {
    console.log('ℹ️  AUTO_PUBLISH=false — scheduler לא הופעל אוטומטית');
    console.log('   להפעיל: POST /api/publish/scheduler/start');
    console.log('   או: הוסף AUTO_PUBLISH=true ל-.env');
  }
});
