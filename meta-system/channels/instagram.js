// ===================================================
// Instagram Direct Messages API
// מטפל בהודעות נכנסות מ-Instagram DM
// ===================================================

const axios = require('axios');
const db    = require('../db/database');

const BASE_URL   = 'https://graph.facebook.com/v25.0';
const PAGE_TOKEN = () => process.env.FB_PAGE_ACCESS_TOKEN;

function getHeaders() {
  return { 'Authorization': `Bearer ${PAGE_TOKEN()}`, 'Content-Type': 'application/json' };
}

// טיפול בהודעה נכנסת מ-Instagram DM
async function handleIncoming(event, pageId) {
  if (!event.message) return;

  const { sender, message } = event;
  console.log(`📸 Instagram DM נכנס מ: ${sender.id}`);

  await db.saveMessage({
    channel:   'instagram',
    direction: 'inbound',
    from:      sender.id,
    type:      message.attachments ? 'media' : 'text',
    content:   message.text || '[קובץ מצורף]',
    meta_id:   message.mid
  });

  await db.upsertConversation({
    channel:      'instagram',
    contact_id:   sender.id,
    last_inbound: new Date(),
    window_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  // תגובה אוטומטית
  await sendText(sender.id,
    `👑 תודה שפנית לכס המלך עיצובים!\n\n` +
    `ראינו את ההודעה שלך ונחזור אליך בהקדם 🪑\n` +
    `לשירות מיידי - שלח לנו ב-WhatsApp!`
  );
}

// שליחת הודעה ל-Instagram DM
async function sendText(recipientId, text) {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/${process.env.FB_PAGE_ID}/messages`,
      {
        recipient: { id: recipientId },
        message:   { text }
      },
      { headers: getHeaders() }
    );
    console.log(`✅ Instagram DM נשלח ל-${recipientId}`);
    return data.message_id;
  } catch (err) {
    console.error('❌ שגיאה בשליחת Instagram DM:', err.response?.data || err.message);
  }
}

module.exports = { handleIncoming, sendText };
