// ===================================================
// נתיבי API לדשבורד
// ===================================================

const express  = require('express');
const router   = express.Router();
const db       = require('../db/database');
const ads      = require('../ads/meta-ads');
const whatsapp = require('../channels/whatsapp');
const leads    = require('../leads/leads');

// סטטיסטיקות כלליות
router.get('/stats', async (req, res) => {
  try {
    const [dbStats, adsStats] = await Promise.all([
      db.getStats(),
      ads.getDashboardSummary()
    ]);
    res.json({ ...dbStats, ads: adsStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// כל הלידים
router.get('/leads', async (req, res) => {
  try {
    const data = await db.getLeads({ status: req.query.status, limit: parseInt(req.query.limit) || 50 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// עדכון סטטוס ליד
router.patch('/leads/:id', async (req, res) => {
  try {
    await db.pool?.query(
      `UPDATE leads SET status=$1, notes=$2 WHERE id=$3`,
      [req.body.status, req.body.notes, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// כל השיחות
router.get('/conversations', async (req, res) => {
  try {
    const data = await db.getConversations(parseInt(req.query.limit) || 50);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// היסטוריית הודעות לשיחה
router.get('/messages/:channel/:contactId', async (req, res) => {
  try {
    const data = await db.getMessages(req.params.channel, req.params.contactId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// שליחת הודעת WhatsApp ידנית
router.post('/send/whatsapp', async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ error: 'חסר to או message' });
    const msgId = await whatsapp.sendText(to, message);
    res.json({ success: true, message_id: msgId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// סטטיסטיקות מודעות
router.get('/ads', async (req, res) => {
  try {
    const data = await ads.getDashboardSummary();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// עצור/הפעל קמפיין
router.patch('/ads/campaigns/:id', async (req, res) => {
  try {
    await ads.updateCampaignStatus(req.params.id, req.body.status);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
