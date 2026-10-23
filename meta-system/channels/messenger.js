// ===================================================
// Facebook Messenger API
// מטפל בהודעות נכנסות מ-Messenger
// ===================================================

const axios = require('axios');
const db    = require('../db/database');

const BASE_URL = 'https://graph.facebook.com/v25.0';
const PAGE_TOKEN = () => process.env.FB_PAGE_ACCESS_TOKEN;

function getHeaders() {
  return { 'Authorization': `Bearer ${PAGE_TOKEN()}`, 'Content-Type': 'application/json' };
}

// טיפול בהודעה נכנסת מ-Messenger
async function handleIncoming(event, pageId) {
  if (event.message) {
    const { sender, message } = event;
    console.log(`💬 Messenger נכנס מ: ${sender.id}`);

    await db.saveMessage({
      channel:   'messenger',
      direction: 'inbound',
      from:      sender.id,
      type:      message.attachments ? 'media' : 'text',
      content:   message.text || '[קובץ מצורף]',
      meta_id:   message.mid
    });

    await db.upsertConversation({
      channel:     'messenger',
      contact_id:  sender.id,
      last_inbound: new Date(),
      window_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // תגובה אוטומטית
    await sendText(sender.id,
      `👑 שלום! קיבלנו את הודעתך.\n` +
      `נציג כס המלך עיצובים יחזור אליך בהקדם. 🪑\n\n` +
      `לשירות מהיר יותר - פנה אלינו בוואטסאפ!`
    );
  } else if (event.postback) {
    console.log(`🔘 Postback מ-${event.sender.id}: ${event.postback.payload}`);
  }
}

// שליחת הודעה דרך Messenger
async function sendText(recipientId, text) {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/${process.env.FB_PAGE_ID}/messages`,
      {
        messaging_type: 'RESPONSE',
        recipient: { id: recipientId },
        message:   { text }
      },
      { headers: getHeaders() }
    );
    console.log(`✅ Messenger נשלח ל-${recipientId}`);
    return data.message_id;
  } catch (err) {
    console.error('❌ שגיאה בשליחת Messenger:', err.response?.data || err.message);
  }
}

module.exports = { handleIncoming, sendText };
