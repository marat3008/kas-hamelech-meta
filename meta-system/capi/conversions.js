// ===================================================
// Meta Conversions API (CAPI)
// שולח אירועי המרה ל-Meta לשיפור הקמפיינים
// ===================================================

const axios  = require('axios');
const crypto = require('crypto');

const BASE_URL = 'https://graph.facebook.com/v25.0';

// הצפנת נתוני משתמש (חובה לפי Meta)
function hashData(value) {
  if (!value) return undefined;
  return crypto
    .createHash('sha256')
    .update(value.toString().trim().toLowerCase())
    .digest('hex');
}

// נרמול מספר טלפון לפני הצפנה
function normalizePhone(phone) {
  return phone?.replace(/[\s\-\(\)\+]/g, '') || '';
}

// ===================================================
// שליחת אירוע ל-Meta
// ===================================================
async function sendEvent({
  event_name,       // שם האירוע: 'Lead', 'Purchase', 'Contact', 'Schedule'
  event_id,         // מזהה ייחודי למניעת כפילויות
  event_time,       // זמן (אופציונלי - ברירת מחדל: עכשיו)
  email,            // אימייל (יוצפן אוטומטית)
  phone,            // טלפון (יוצפן אוטומטית)
  fbc,              // פרמטר fbclid מהפרסומת (אם קיים)
  fbp,              // Facebook browser cookie
  value,            // ערך כספי (לרכישות)
  currency = 'ILS', // מטבע
  content_ids       // מזהי מוצרים
}) {
  const PIXEL = process.env.META_PIXEL_ID;
  const TOKEN  = process.env.META_CAPI_TOKEN;

  if (!PIXEL || !TOKEN) {
    console.warn('⚠️ CAPI: חסר PIXEL_ID או CAPI_TOKEN - האירוע לא נשלח');
    return;
  }

  const eventData = {
    event_name,
    event_id,
    event_time:    event_time || Math.floor(Date.now() / 1000),
    action_source: 'business_messaging',
    user_data: {
      em:  email ? [hashData(email)] : undefined,
      ph:  phone ? [hashData(normalizePhone(phone))] : undefined,
      fbc,
      fbp,
    },
    custom_data: value !== undefined ? {
      currency,
      value,
      content_ids: content_ids || []
    } : undefined
  };

  // הסרת שדות ריקים
  Object.keys(eventData.user_data).forEach(k => {
    if (eventData.user_data[k] === undefined) delete eventData.user_data[k];
  });

  try {
    await axios.post(
      `${BASE_URL}/${PIXEL}/events`,
      { data: [eventData] },
      { params: { access_token: TOKEN } }
    );
    console.log(`📊 CAPI: אירוע "${event_name}" נשלח ל-Meta`);
  } catch (err) {
    console.error('❌ שגיאת CAPI:', err.response?.data || err.message);
  }
}

// === קיצורים נוחים ===

// לקוח יצר קשר
async function trackContact(phone, email) {
  return sendEvent({ event_name: 'Contact', event_id: `contact_${Date.now()}`, phone, email });
}

// ליד חדש
async function trackLead(phone, email) {
  return sendEvent({ event_name: 'Lead', event_id: `lead_${Date.now()}`, phone, email });
}

// תיאום ביקור
async function trackSchedule(phone, email) {
  return sendEvent({ event_name: 'Schedule', event_id: `schedule_${Date.now()}`, phone, email });
}

// רכישה
async function trackPurchase(phone, email, value, contentIds = []) {
  return sendEvent({
    event_name:  'Purchase',
    event_id:    `purchase_${Date.now()}`,
    phone, email, value,
    content_ids: contentIds
  });
}

module.exports = { sendEvent, trackContact, trackLead, trackSchedule, trackPurchase };
