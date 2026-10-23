// ===================================================
// WhatsApp Business Cloud API
// מטפל בכל ההודעות הנכנסות והיוצאות בווטסאפ
// ===================================================

const axios = require('axios');
const db    = require('../db/database');
const capi  = require('../capi/conversions');

const WA_VERSION = 'v23.0';
const BASE_URL   = `https://graph.facebook.com/${WA_VERSION}`;
const PHONE_ID   = () => process.env.WA_PHONE_NUMBER_ID;
const TOKEN      = () => process.env.WA_SYSTEM_USER_TOKEN;

// כותרות HTTP לכל בקשה ל-Meta
function getHeaders() {
  return {
    'Authorization': `Bearer ${TOKEN()}`,
    'Content-Type':  'application/json'
  };
}

// ===================================================
// טיפול בהודעה נכנסת
// ===================================================
async function handleIncoming(message, metadata, wabaId) {
  console.log(`📱 WhatsApp נכנס מ: ${message.from} | סוג: ${message.type}`);

  // שמירה במסד הנתונים
  await db.saveMessage({
    channel:    'whatsapp',
    direction:  'inbound',
    from:       message.from,
    type:       message.type,
    content:    extractContent(message),
    meta_id:    message.id,
    timestamp:  new Date(parseInt(message.timestamp) * 1000)
  });

  // שלח אישור קריאה
  await markAsRead(message.id);

  // עדכן/צור שיחה פתוחה (חלון 24 שעות)
  await db.upsertConversation({
    channel:    'whatsapp',
    contact_id: message.from,
    last_inbound: new Date(),
    window_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  // שלח אירוע "Contact" ל-Meta CAPI למעקב
  await capi.sendEvent({
    event_name: 'Contact',
    event_id:   `wa_${message.id}`,
    phone:      message.from
  });

  // תגובה אוטומטית לפי סוג ההודעה
  await autoRespond(message);
}

// ===================================================
// תגובה אוטומטית חכמה
// ===================================================
async function autoRespond(message) {
  const text = extractContent(message)?.toLowerCase() || '';

  // זיהוי כוונת הלקוח
  if (isGreeting(text)) {
    await sendWelcomeMessage(message.from);
  } else if (isPriceInquiry(text)) {
    await sendCatalogMessage(message.from);
  } else if (isAppointmentRequest(text)) {
    await sendAppointmentMessage(message.from);
  } else {
    // הודעה כללית - שלח לטיפול אנושי
    await sendHandoffMessage(message.from);
    await notifyTeam(message);
  }
}

// זיהוי ברכות
function isGreeting(text) {
  return ['שלום', 'היי', 'הי', 'בוקר', 'ערב', 'hello', 'hi'].some(w => text.includes(w));
}

// זיהוי שאלות מחיר
function isPriceInquiry(text) {
  return ['מחיר', 'עלות', 'כמה עולה', 'מחירון', 'price', 'cost'].some(w => text.includes(w));
}

// זיהוי בקשות תיאום
function isAppointmentRequest(text) {
  return ['פגישה', 'להגיע', 'ביקור', 'סיור', 'appointment', 'visit'].some(w => text.includes(w));
}

// ===================================================
// הודעות תבנית (Templates)
// ===================================================

// הודעת ברוכים הבאים
async function sendWelcomeMessage(to) {
  return sendText(to,
    `👑 שלום! ברוכים הבאים לכס המלך עיצובים\n\n` +
    `אנחנו מתמחים בכיסאות מרופדים יוקרתיים בהתאמה אישית.\n\n` +
    `במה נוכל לעזור לך?\n` +
    `1️⃣ צפייה בקטלוג\n` +
    `2️⃣ מחירים והצעת מחיר\n` +
    `3️⃣ תיאום ביקור בסטודיו`
  );
}

// הודעת קטלוג
async function sendCatalogMessage(to) {
  return sendText(to,
    `🛋️ הקטלוג שלנו כולל:\n\n` +
    `• כיסאות סלון יוקרתיים\n` +
    `• כורסאות מעצבים\n` +
    `• ספות בהתאמה אישית\n` +
    `• ריפוד מחדש לרהיטים קיימים\n\n` +
    `כל פריט מיוצר בהתאמה אישית לבית שלך.\n` +
    `רוצה לראות דוגמאות? שלח *כן* ונשלח לך תמונות 📸`
  );
}

// הודעת תיאום ביקור
async function sendAppointmentMessage(to) {
  return sendText(to,
    `📅 נשמח לראות אותך בסטודיו שלנו!\n\n` +
    `שלח לנו:\n` +
    `• שם מלא\n` +
    `• יום ושעה מועדפים\n\n` +
    `ונאשר את הביקור תוך שעה. 🪑`
  );
}

// הודעת העברה לנציג
async function sendHandoffMessage(to) {
  return sendText(to,
    `🙏 תודה על פנייתך!\n` +
    `נציג יחזור אליך בהקדם האפשרי.\n` +
    `שעות פעילות: א׳-ה׳ 9:00-18:00`
  );
}

// ===================================================
// פונקציות שליחה
// ===================================================

// שליחת הודעת טקסט
async function sendText(to, body) {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/${PHONE_ID()}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to,
        type: 'text',
        text: { body, preview_url: true }
      },
      { headers: getHeaders() }
    );

    // שמור הודעה יוצאת ב-DB
    await db.saveMessage({
      channel:   'whatsapp',
      direction: 'outbound',
      to,
      type:      'text',
      content:   body,
      meta_id:   data.messages[0].id
    });

    console.log(`✅ WhatsApp נשלח ל-${to}`);
    return data.messages[0].id;
  } catch (err) {
    console.error('❌ שגיאה בשליחת WhatsApp:', err.response?.data || err.message);
    throw err;
  }
}

// שליחת תבנית (Template) - לשימוש מחוץ לחלון 24 שעות
async function sendTemplate(to, templateName, params = [], language = 'he') {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/${PHONE_ID()}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: params.length ? [{
            type: 'body',
            parameters: params.map(p => ({ type: 'text', text: String(p) }))
          }] : []
        }
      },
      { headers: getHeaders() }
    );

    console.log(`✅ תבנית WhatsApp נשלחה ל-${to}: ${templateName}`);
    return data.messages[0].id;
  } catch (err) {
    console.error('❌ שגיאה בשליחת תבנית:', err.response?.data || err.message);
    throw err;
  }
}

// שליחת תמונה
async function sendImage(to, imageUrl, caption = '') {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/${PHONE_ID()}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: { link: imageUrl, caption }
      },
      { headers: getHeaders() }
    );
    return data.messages[0].id;
  } catch (err) {
    console.error('❌ שגיאה בשליחת תמונה:', err.response?.data || err.message);
    throw err;
  }
}

// שליחת כפתורים אינטראקטיביים
async function sendButtons(to, bodyText, buttons) {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/${PHONE_ID()}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.map((btn, i) => ({
              type: 'reply',
              reply: { id: `btn_${i}`, title: btn }
            }))
          }
        }
      },
      { headers: getHeaders() }
    );
    return data.messages[0].id;
  } catch (err) {
    console.error('❌ שגיאה בשליחת כפתורים:', err.response?.data || err.message);
    throw err;
  }
}

// סימון הודעה כנקראה
async function markAsRead(messageId) {
  try {
    await axios.post(
      `${BASE_URL}/${PHONE_ID()}/messages`,
      { messaging_product: 'whatsapp', status: 'read', message_id: messageId },
      { headers: getHeaders() }
    );
  } catch (e) {
    // לא קריטי אם נכשל
  }
}

// ===================================================
// עדכוני סטטוס הודעות
// ===================================================
async function handleStatus(status) {
  const { id, status: st, timestamp } = status;
  // עדכן סטטוס ב-DB: sent / delivered / read / failed
  await db.updateMessageStatus(id, st);
  if (st === 'failed') {
    console.warn(`⚠️ הודעה ${id} נכשלה: ${JSON.stringify(status.errors)}`);
  }
}

// ===================================================
// שליחת התראה לצוות
// ===================================================
async function notifyTeam(message) {
  // שמור בDB כהודעה שדורשת מענה אנושי
  await db.flagForHumanReview({
    channel: 'whatsapp',
    from:    message.from,
    content: extractContent(message)
  });
  console.log(`🔔 הצוות קיבל התראה על הודעה מ-${message.from}`);
}

// ===================================================
// עזרים
// ===================================================
function extractContent(message) {
  switch (message.type) {
    case 'text':     return message.text?.body || '';
    case 'image':    return `[תמונה: ${message.image?.caption || ''}]`;
    case 'audio':    return '[הודעה קולית]';
    case 'document': return `[מסמך: ${message.document?.filename || ''}]`;
    case 'video':    return '[וידאו]';
    case 'button':   return message.button?.text || '';
    case 'interactive': return message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
    default: return `[${message.type}]`;
  }
}

module.exports = {
  handleIncoming,
  handleStatus,
  sendText,
  sendTemplate,
  sendImage,
  sendButtons
};
