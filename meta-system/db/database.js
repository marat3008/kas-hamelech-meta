// ===================================================
// מסד נתונים - PostgreSQL
// שמירת הודעות, לידים, שיחות ועוד
// ===================================================

const { Pool } = require('pg');

let pool;

// ===================================================
// חיבור למסד הנתונים
// ===================================================
async function connect() {
  pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 5432,
    database: process.env.DB_NAME     || 'kas_hamelech',
    user:     process.env.DB_USER     || 'admin',
    password: process.env.DB_PASSWORD || 'password',
  });

  // יצירת טבלאות אם לא קיימות
  await createTables();
  console.log('✅ מסד נתונים מחובר');
}

// ===================================================
// יצירת טבלאות
// ===================================================
async function createTables() {
  await pool.query(`
    -- טבלת הודעות
    CREATE TABLE IF NOT EXISTS messages (
      id            SERIAL PRIMARY KEY,
      channel       VARCHAR(20) NOT NULL,   -- whatsapp / messenger / instagram
      direction     VARCHAR(10) NOT NULL,   -- inbound / outbound
      "from"        VARCHAR(100),
      "to"          VARCHAR(100),
      type          VARCHAR(20),
      content       TEXT,
      meta_id       VARCHAR(200),
      status        VARCHAR(20) DEFAULT 'sent',
      created_at    TIMESTAMP DEFAULT NOW()
    );

    -- טבלת שיחות
    CREATE TABLE IF NOT EXISTS conversations (
      id              SERIAL PRIMARY KEY,
      channel         VARCHAR(20) NOT NULL,
      contact_id      VARCHAR(100) NOT NULL,
      last_inbound    TIMESTAMP,
      last_outbound   TIMESTAMP,
      window_expires  TIMESTAMP,
      status          VARCHAR(20) DEFAULT 'open',
      assigned_to     VARCHAR(100),
      needs_review    BOOLEAN DEFAULT FALSE,
      created_at      TIMESTAMP DEFAULT NOW(),
      UNIQUE(channel, contact_id)
    );

    -- טבלת לידים
    CREATE TABLE IF NOT EXISTS leads (
      id            SERIAL PRIMARY KEY,
      leadgen_id    VARCHAR(100) UNIQUE,
      form_id       VARCHAR(100),
      ad_id         VARCHAR(100),
      campaign_id   VARCHAR(100),
      name          VARCHAR(200),
      email         VARCHAR(200),
      phone         VARCHAR(50),
      field_data    JSONB,
      source        VARCHAR(50) DEFAULT 'meta_lead_ads',
      status        VARCHAR(20) DEFAULT 'new',
      notes         TEXT,
      created_at    TIMESTAMP DEFAULT NOW()
    );

    -- טבלת שגיאות
    CREATE TABLE IF NOT EXISTS error_logs (
      id          SERIAL PRIMARY KEY,
      source      VARCHAR(50),
      message     TEXT,
      payload     JSONB,
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- טבלת תור מענה אנושי
    CREATE TABLE IF NOT EXISTS human_review_queue (
      id          SERIAL PRIMARY KEY,
      channel     VARCHAR(20),
      contact_id  VARCHAR(100),
      content     TEXT,
      status      VARCHAR(20) DEFAULT 'pending',
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- אינדקסים לביצועים טובים
    CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
  `);
}

// ===================================================
// פונקציות עזר
// ===================================================

async function saveMessage(msg) {
  await pool.query(
    `INSERT INTO messages (channel, direction, "from", "to", type, content, meta_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [msg.channel, msg.direction, msg.from, msg.to, msg.type, msg.content, msg.meta_id]
  );
}

async function updateMessageStatus(metaId, status) {
  await pool.query(
    `UPDATE messages SET status=$1 WHERE meta_id=$2`,
    [status, metaId]
  );
}

async function upsertConversation(conv) {
  await pool.query(
    `INSERT INTO conversations (channel, contact_id, last_inbound, window_expires)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (channel, contact_id)
     DO UPDATE SET last_inbound=$3, window_expires=$4, status='open'`,
    [conv.channel, conv.contact_id, conv.last_inbound, conv.window_expires]
  );
}

async function saveLead(lead) {
  await pool.query(
    `INSERT INTO leads (leadgen_id, form_id, ad_id, campaign_id, name, email, phone, field_data, source, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (leadgen_id) DO NOTHING`,
    [lead.leadgen_id, lead.form_id, lead.ad_id, lead.campaign_id,
     lead.name, lead.email, lead.phone, JSON.stringify(lead.field_data),
     lead.source, lead.created_at]
  );
}

async function getLeads(filters = {}) {
  const { status, limit = 50 } = filters;
  if (status) {
    const { rows } = await pool.query(
      `SELECT * FROM leads WHERE status=$1 ORDER BY created_at DESC LIMIT $2`,
      [status, limit]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT * FROM leads ORDER BY created_at DESC LIMIT $1`, [limit]
  );
  return rows;
}

async function getConversations(limit = 50) {
  const { rows } = await pool.query(
    `SELECT * FROM conversations ORDER BY last_inbound DESC LIMIT $1`, [limit]
  );
  return rows;
}

async function getMessages(channel, contactId, limit = 50) {
  const { rows } = await pool.query(
    `SELECT * FROM messages
     WHERE channel=$1 AND ("from"=$2 OR "to"=$2)
     ORDER BY created_at ASC LIMIT $3`,
    [channel, contactId, limit]
  );
  return rows;
}

async function flagForHumanReview(item) {
  await pool.query(
    `INSERT INTO human_review_queue (channel, contact_id, content) VALUES ($1,$2,$3)`,
    [item.channel, item.from, item.content]
  );
}

async function logError(source, message, payload) {
  await pool.query(
    `INSERT INTO error_logs (source, message, payload) VALUES ($1,$2,$3)`,
    [source, message, JSON.stringify(payload)]
  );
}

async function getStats() {
  const [msgs, leads, convs] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours'`),
    pool.query(`SELECT COUNT(*) FROM leads WHERE created_at > NOW() - INTERVAL '7 days'`),
    pool.query(`SELECT COUNT(*) FROM conversations WHERE status='open'`)
  ]);
  return {
    messagesLast24h:    parseInt(msgs.rows[0].count),
    leadsLast7d:        parseInt(leads.rows[0].count),
    openConversations:  parseInt(convs.rows[0].count)
  };
}

module.exports = {
  connect,
  saveMessage,
  updateMessageStatus,
  upsertConversation,
  saveLead,
  getLeads,
  getConversations,
  getMessages,
  flagForHumanReview,
  logError,
  getStats
};
