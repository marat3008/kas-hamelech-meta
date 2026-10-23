// ===================================================
// מערכת התראות - אימייל ולוג
// ===================================================

const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST  || 'smtp.gmail.com',
      port: process.env.SMTP_PORT  || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

// ===================================================
// שליחת התראת ליד חדש
// ===================================================
async function sendLeadAlert(contact) {
  const alertEmail = process.env.ALERT_EMAIL;
  if (!alertEmail || !process.env.SMTP_USER) {
    console.log(`🔔 ליד חדש: ${contact.full_name} | ${contact.phone} | ${contact.email}`);
    return;
  }

  try {
    await getTransporter().sendMail({
      from:    process.env.SMTP_USER,
      to:      alertEmail,
      subject: `🪑 ליד חדש! ${contact.full_name} - כס המלך עיצובים`,
      html: `
        <div dir="rtl" style="font-family:Arial; padding:20px; background:#f9f6f0; border-radius:8px;">
          <h2 style="color:#8B6914;">👑 ליד חדש - כס המלך עיצובים</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:8px; font-weight:bold;">שם:</td><td>${contact.full_name || '-'}</td></tr>
            <tr><td style="padding:8px; font-weight:bold;">טלפון:</td><td>${contact.phone || '-'}</td></tr>
            <tr><td style="padding:8px; font-weight:bold;">אימייל:</td><td>${contact.email || '-'}</td></tr>
            <tr><td style="padding:8px; font-weight:bold;">עיר:</td><td>${contact.city || '-'}</td></tr>
            <tr><td style="padding:8px; font-weight:bold;">הודעה:</td><td>${contact.notes || '-'}</td></tr>
            <tr><td style="padding:8px; font-weight:bold;">זמן:</td><td>${new Date().toLocaleString('he-IL')}</td></tr>
          </table>
          <p style="margin-top:20px; color:#666;">
            לניהול הליד היכנס ל-<a href="${process.env.SERVER_URL}">דשבורד כס המלך</a>
          </p>
        </div>
      `
    });
    console.log(`📧 התראת ליד נשלחה ל-${alertEmail}`);
  } catch (err) {
    console.error('❌ שגיאה בשליחת אימייל:', err.message);
  }
}

module.exports = { sendLeadAlert };
