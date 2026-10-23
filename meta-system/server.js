// ===================================================
// שרת ראשי - כס המלך עיצובים
// Meta Business API Integration
// ===================================================

require('dotenv').config();
const express = require('express');
const crypto  = require('crypto');
const cors    = require('cors');
const morgan  = require('morgan');

// טעינת מודולי הערוצים
const whatsapp  = require('./channels/whatsapp');
const messenger = require('./channels/messenger');
const instagram = require('./channels/instagram');
const leads     = require('./leads/leads');
const dashboard = require('./dashboard/routes');
const db        = require('./db/database');

const app = express();

// === הגדרות בסיסיות ===
app.use(cors());
app.use(morgan('dev'));
app.use(express.static('dashboard/public'));

// === חשוב! קריאת גוף הבקשה לפני עיבוד JSON ===
// זה נדרש כדי לאמת חתימת Meta
app.use('/webhooks/meta', express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.json());

// ===================================================
// פונקציה לאימות חתימת Meta
// Meta שולחת חתימה מוצפנת - אנחנו מאמתים שהיא אמיתית
// ===================================================
function verifyMetaSignature(req) {
  const signature = req.get('x-hub-signature-256') || '';
  const expected  = 'sha256=' + crypto
    .createHmac('sha256', process.env.META_APP_SECRET)
    .update(req.rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch (e) {
    return false;
  }
}

// ===================================================
// WEBHOOK - נקודת קבלת הודעות מ-Meta
// כל ההודעות מ-WhatsApp, Messenger, Instagram
// מגיעות לכאן
// ===================================================

// אימות ראשוני של ה-Webhook (Meta בודקת שהשרת שלך חי)
app.get('/webhooks/meta', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('📡 Meta מבצעת אימות Webhook...');

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Webhook אומת בהצלחה!');
    return res.status(200).send(challenge);
  }

  console.log('❌ אימות Webhook נכשל - בדוק את META_VERIFY_TOKEN');
  res.sendStatus(403);
});

// קבלת הודעות ואירועים מ-Meta
app.post('/webhooks/meta', async (req, res) => {
  // תמיד נענה ל-Meta תוך שנייה, אחרת היא תנסה שוב
  if (!verifyMetaSignature(req)) {
    console.log('⚠️ חתימה לא תקינה - הבקשה נדחתה');
    return res.sendStatus(401);
  }

  // שלח אישור מיידי ל-Meta
  res.sendStatus(200);

  // עבד את ההודעה ברקע
  const { object, entry = [] } = req.body;

  try {
    switch (object) {
      case 'whatsapp_business_account':
        // הודעת WhatsApp נכנסת
        for (const e of entry) {
          const change = e.changes?.[0];
          if (change?.field === 'messages' && change.value?.messages) {
            for (const msg of change.value.messages) {
              await whatsapp.handleIncoming(msg, change.value.metadata, e.id);
            }
          }
          // עדכוני סטטוס (נקרא, נשלח, וכו')
          if (change?.value?.statuses) {
            for (const status of change.value.statuses) {
              await whatsapp.handleStatus(status);
            }
          }
        }
        break;

      case 'page':
        // הודעות Messenger ולידים מפייסבוק
        for (const e of entry) {
          // לידים מ-Lead Ads
          for (const change of (e.changes || [])) {
            if (change.field === 'leadgen') {
              await leads.handleNewLead(change.value);
            }
          }
          // הודעות Messenger
          for (const msg of (e.messaging || [])) {
            await messenger.handleIncoming(msg, e.id);
          }
        }
        break;

      case 'instagram':
        // הודעות DM באינסטגרם
        for (const e of entry) {
          for (const msg of (e.messaging || [])) {
            await instagram.handleIncoming(msg, e.id);
          }
        }
        break;

      default:
        console.log(`⚠️ אירוע לא מוכר מ-Meta: ${object}`);
    }
  } catch (err) {
    console.error('❌ שגיאה בעיבוד הודעת Meta:', err.message);
    // שמירת השגיאה ב-DB לחקירה
    await db.logError('webhook', err.message, req.body);
  }
});

// ===================================================
// נתיבי דשבורד ו-API
// ===================================================
app.use('/api', dashboard);

// דף הבית - דשבורד ניהול
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/dashboard/public/index.html');
});

// בדיקת תקינות השרת
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    business: process.env.BUSINESS_NAME || 'כס המלך עיצובים'
  });
});

// ===================================================
// הפעלת השרת
// ===================================================
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // חיבור למסד הנתונים
    await db.connect();
    console.log('✅ מסד הנתונים מחובר');

    // הפעלת השרת
    app.listen(PORT, () => {
      console.log('');
      console.log('🪑 ===================================');
      console.log('   כס המלך עיצובים - מערכת Meta');
      console.log('===================================');
      console.log(`🌐 שרת פעיל בפורט: ${PORT}`);
      console.log(`📡 Webhook URL: ${process.env.SERVER_URL}/webhooks/meta`);
      console.log(`🖥️  דשבורד: http://localhost:${PORT}`);
      console.log('===================================');
      console.log('');
    });
  } catch (err) {
    console.error('❌ שגיאה בהפעלת השרת:', err.message);
    process.exit(1);
  }
}

startServer();
