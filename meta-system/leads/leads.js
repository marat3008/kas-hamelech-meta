// ===================================================
// לידים - Lead Ads
// מטפל בלידים שמגיעים מטפסי פייסבוק ואינסטגרם
// ===================================================

const axios     = require('axios');
const db        = require('../db/database');
const capi      = require('../capi/conversions');
const whatsapp  = require('../channels/whatsapp');
const notifier  = require('../utils/notifier');

const BASE_URL   = 'https://graph.facebook.com/v25.0';
const PAGE_TOKEN = () => process.env.FB_PAGE_ACCESS_TOKEN;

// ===================================================
// טיפול בליד חדש מ-Meta Lead Ads
// ===================================================
async function handleNewLead(leadEvent) {
  const { leadgen_id, page_id, form_id, ad_id, adgroup_id, created_time } = leadEvent;

  console.log(`🎯 ליד חדש! ID: ${leadgen_id}`);

  try {
    // שלב 1: שלוף פרטי הליד מ-Meta
    const leadData = await fetchLeadDetails(leadgen_id);
    if (!leadData) return;

    // שלב 2: המר לאובייקט נוח
    const contact = parseLeadFields(leadData.field_data);
    console.log(`📋 ליד: ${contact.full_name} | ${contact.email} | ${contact.phone}`);

    // שלב 3: שמור ב-DB
    await db.saveLead({
      leadgen_id,
      form_id,
      ad_id,
      campaign_id:  adgroup_id,
      name:         contact.full_name,
      email:        contact.email,
      phone:        contact.phone,
      field_data:   contact,
      source:       'meta_lead_ads',
      created_at:   new Date(created_time * 1000)
    });

    // שלב 4: שלח אירוע "Lead" ל-Meta CAPI (לאופטימיזציה של קמפיינים)
    await capi.sendEvent({
      event_name: 'Lead',
      event_id:   `lead_${leadgen_id}`,
      email:      contact.email,
      phone:      contact.phone
    });

    // שלב 5: שלח WhatsApp אוטומטי לליד (אם יש מספר טלפון)
    if (contact.phone) {
      await sendLeadWelcomeMessage(contact);
    }

    // שלב 6: שלח התראה לצוות
    await notifier.sendLeadAlert(contact);

  } catch (err) {
    console.error('❌ שגיאה בטיפול בליד:', err.message);
    await db.logError('lead', err.message, leadEvent);
  }
}

// ===================================================
// שליפת פרטי ליד מ-Meta API
// ===================================================
async function fetchLeadDetails(leadgenId) {
  try {
    const { data } = await axios.get(`${BASE_URL}/${leadgenId}`, {
      params: {
        access_token: PAGE_TOKEN(),
        fields: 'created_time,id,ad_id,form_id,field_data'
      }
    });
    return data;
  } catch (err) {
    console.error('❌ שגיאה בשליפת ליד:', err.response?.data || err.message);
    return null;
  }
}

// ===================================================
// המרת שדות הליד לאובייקט נוח
// ===================================================
function parseLeadFields(fieldData) {
  const contact = {};
  for (const field of (fieldData || [])) {
    contact[field.name] = field.values?.[0] || '';
  }
  // נרמול שמות שדות נפוצים
  return {
    full_name:    contact.full_name || contact.name || '',
    email:        contact.email || '',
    phone:        normalizePhone(contact.phone_number || contact.phone || ''),
    city:         contact.city || '',
    notes:        contact.your_question || contact.message || '',
    ...contact
  };
}

// ===================================================
// הודעת ווטסאפ לליד חדש
// ===================================================
async function sendLeadWelcomeMessage(contact) {
  const firstName = contact.full_name?.split(' ')[0] || 'לקוח יקר';
  await whatsapp.sendText(
    contact.phone,
    `👑 שלום ${firstName}!\n\n` +
    `תודה שהתעניינת בכס המלך עיצובים.\n` +
    `קיבלנו את פנייתך ונחזור אליך תוך שעה ✨\n\n` +
    `בינתיים, תוכל לראות את העבודות שלנו:\n` +
    `📸 אינסטגרם: @kas_hamelech\n` +
    `🌐 אתר: www.kashamelech.co.il`
  );
}

// ===================================================
// שליפת כל הלידים (לדשבורד)
// ===================================================
async function getAllLeads(filters = {}) {
  return db.getLeads(filters);
}

// ===================================================
// עזרים
// ===================================================
function normalizePhone(phone) {
  if (!phone) return '';
  // הסרת תווים לא נחוצים
  let clean = phone.replace(/[\s\-\(\)]/g, '');
  // המרה לפורמט בינלאומי ישראלי
  if (clean.startsWith('0')) {
    clean = '972' + clean.substring(1);
  }
  return clean;
}

module.exports = { handleNewLead, getAllLeads, fetchLeadDetails };
