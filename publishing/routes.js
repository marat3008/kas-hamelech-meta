// ===================================================
// Publishing Routes — API לניהול פרסום
// ===================================================

const express  = require('express');
const router   = express.Router();
const library  = require('./content-library');
const publisher = require('./publisher');
const scheduler = require('./scheduler');

// GET /api/publish/status — סטטוס ה-scheduler
router.get('/status', (req, res) => {
  res.json(scheduler.getScheduleStatus());
});

// GET /api/publish/posts — כל הפוסטים בספריית התוכן
router.get('/posts', (req, res) => {
  const { platform } = req.query;
  const posts = platform
    ? library.getPostsForPlatform(platform)
    : library.POSTS;
  res.json({ count: posts.length, posts: posts.map(p => ({ id: p.id, category: p.category, platforms: p.platforms })) });
});

// GET /api/publish/posts/:id — תוכן מלא של פוסט ספציפי
router.get('/posts/:id', (req, res) => {
  const post = library.POSTS.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'פוסט לא נמצא' });
  res.json(post);
});

// POST /api/publish/now — פרסום מיידי
// body: { postId?, imageUrl? }
router.post('/now', async (req, res) => {
  try {
    const { postId, imageUrl } = req.body;
    const post = postId
      ? library.POSTS.find(p => p.id === postId)
      : library.getNextPost();

    if (!post) return res.status(404).json({ error: 'פוסט לא נמצא' });

    const result = await publisher.publishPost(post, { imageUrl });
    res.json({ post: post.id, ...result });
  } catch (err) {
    console.error('❌ שגיאה בפרסום מיידי:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/publish/facebook — פרסום ישיר לפייסבוק
// body: { message, imageUrl? }
router.post('/facebook', async (req, res) => {
  try {
    const { message, imageUrl } = req.body;
    if (!message) return res.status(400).json({ error: 'message הוא שדה חובה' });
    const result = await publisher.postToFacebook({ message, imageUrl });
    res.json(result);
  } catch (err) {
    console.error('❌ שגיאה בפרסום לפייסבוק:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/publish/instagram — פרסום ישיר לאינסטגרם
// body: { caption, imageUrl }
router.post('/instagram', async (req, res) => {
  try {
    const { caption, imageUrl } = req.body;
    if (!caption || !imageUrl) return res.status(400).json({ error: 'caption ו-imageUrl הם שדות חובה' });
    const result = await publisher.postToInstagram({ caption, imageUrl });
    res.json(result);
  } catch (err) {
    console.error('❌ שגיאה בפרסום לאינסטגרם:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/publish/buffer — שליחה ל-Buffer לתזמון
// body: { text, imageUrl?, scheduledAt? }
router.post('/buffer', async (req, res) => {
  try {
    const { text, imageUrl, scheduledAt } = req.body;
    if (!text) return res.status(400).json({ error: 'text הוא שדה חובה' });
    const result = await publisher.scheduleViaBuffer({ text, imageUrl, scheduledAt });
    res.json(result);
  } catch (err) {
    console.error('❌ שגיאה בשליחה ל-Buffer:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/publish/scheduler/start — הפעלת scheduler
router.post('/scheduler/start', (req, res) => {
  scheduler.startScheduler();
  res.json({ status: 'started', ...scheduler.getScheduleStatus() });
});

// POST /api/publish/scheduler/stop — עצירת scheduler
router.post('/scheduler/stop', (req, res) => {
  scheduler.stopScheduler();
  res.json({ status: 'stopped' });
});

// POST /api/publish/scheduler/run-now — הרצה ידנית של slot
// body: { slotName? }
router.post('/scheduler/run-now', async (req, res) => {
  try {
    const slotName = req.body?.slotName || 'ידני';
    await scheduler.runPublish(slotName);
    res.json({ status: 'done', slotName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
