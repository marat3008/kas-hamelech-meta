// ===================================================
// Publisher — פרסום לפייסבוק, אינסטגרם וטיקטוק
// Meta Graph API v21 | TikTok Content Posting API v2
// ===================================================

const axios = require('axios');

const GRAPH   = 'https://graph.facebook.com/v21.0';
const TIKTOK  = 'https://open.tiktokapis.com/v2';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// פייסבוק
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function postToFacebook({ message, imageUrl, link } = {}) {
  const pageId    = process.env.FB_PAGE_ID;
  const pageToken = process.env.FB_PAGE_ACCESS_TOKEN;

  if (!pageId || !pageToken) throw new Error('FB_PAGE_ID או FB_PAGE_ACCESS_TOKEN חסרים ב-.env');

  const body = { message, access_token: pageToken };
  if (link)     body.link     = link;
  if (imageUrl) body.picture  = imageUrl;

  const endpoint = imageUrl
    ? `${GRAPH}/${pageId}/photos`   // פוסט עם תמונה
    : `${GRAPH}/${pageId}/feed`;    // פוסט טקסט בלבד

  const payload = imageUrl
    ? { caption: message, url: imageUrl, access_token: pageToken }
    : body;

  const { data } = await axios.post(endpoint, payload);
  console.log(`✅ [Facebook] פורסם — ID: ${data.id}`);
  return { platform: 'facebook', id: data.id, success: true };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// אינסטגרם (Graph API — שני שלבים)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function postToInstagram({ caption, imageUrl } = {}) {
  const igUserId = process.env.IG_USER_ID;
  const token    = process.env.FB_PAGE_ACCESS_TOKEN;

  if (!igUserId || !token) throw new Error('IG_USER_ID או FB_PAGE_ACCESS_TOKEN חסרים ב-.env');
  if (!imageUrl)           throw new Error('Instagram דורש imageUrl לפרסום');

  // שלב 1: יצירת container
  const { data: container } = await axios.post(
    `${GRAPH}/${igUserId}/media`,
    { image_url: imageUrl, caption, access_token: token }
  );

  // שלב 2: פרסום
  const { data: published } = await axios.post(
    `${GRAPH}/${igUserId}/media_publish`,
    { creation_id: container.id, access_token: token }
  );

  console.log(`✅ [Instagram] פורסם — ID: ${published.id}`);
  return { platform: 'instagram', id: published.id, success: true };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Buffer API (אופציונלי — עבור תזמון עתידי)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scheduleViaBuffer({ text, imageUrl, scheduledAt, profileIds } = {}) {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  if (!token) throw new Error('BUFFER_ACCESS_TOKEN חסר ב-.env');

  const body = {
    text,
    profile_ids: profileIds || [
      process.env.BUFFER_FB_PROFILE_ID,
      process.env.BUFFER_IG_PROFILE_ID,
    ].filter(Boolean),
    media: imageUrl ? { photo: imageUrl } : undefined,
    scheduled_at: scheduledAt || undefined,
  };

  const { data } = await axios.post(
    'https://api.bufferapp.com/1/updates/create.json',
    body,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log(`✅ [Buffer] תוזמן — ID: ${data.updates?.[0]?.id}`);
  return { platform: 'buffer', success: true, updates: data.updates };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// פרסום לכל הפלטפורמות ביחד
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function publishPost(post, { imageUrl } = {}) {
  const results = [];
  const errors  = [];

  // פייסבוק
  if (post.platforms.includes('facebook') && post.facebook) {
    try {
      const r = await postToFacebook({ message: post.facebook, imageUrl });
      results.push(r);
    } catch (e) {
      console.error(`❌ [Facebook] שגיאה: ${e.response?.data?.error?.message || e.message}`);
      errors.push({ platform: 'facebook', error: e.response?.data?.error?.message || e.message });
    }
  }

  // אינסטגרם (רק אם יש תמונה)
  if (post.platforms.includes('instagram') && post.instagram && imageUrl) {
    try {
      const r = await postToInstagram({ caption: post.instagram, imageUrl });
      results.push(r);
    } catch (e) {
      console.error(`❌ [Instagram] שגיאה: ${e.response?.data?.error?.message || e.message}`);
      errors.push({ platform: 'instagram', error: e.response?.data?.error?.message || e.message });
    }
  } else if (post.platforms.includes('instagram') && !imageUrl) {
    console.log('ℹ️ [Instagram] דילוג — אין imageUrl (Instagram דורש תמונה)');
  }

  // טיקטוק (וידאו או תמונה)
  const tikTokText = post.tiktok || post.instagram || post.facebook;
  if (post.platforms.includes('tiktok') && tikTokText) {
    const videoUrl = post.videoUrl || process.env.DEFAULT_POST_VIDEO_URL || null;
    const imgUrl   = imageUrl || process.env.DEFAULT_POST_IMAGE_URL || null;
    if (videoUrl || imgUrl) {
      try {
        const r = await postToTikTok({ caption: tikTokText, videoUrl, imageUrl: imgUrl });
        results.push(r);
      } catch (e) {
        console.error(`❌ [TikTok] שגיאה: ${e.message}`);
        errors.push({ platform: 'tiktok', error: e.message });
      }
    } else {
      console.log('ℹ️ [TikTok] דילוג — אין videoUrl או imageUrl (TikTok דורש מדיה)');
    }
  }

  return { results, errors, publishedAt: new Date().toISOString() };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// טיקטוק (Content Posting API v2)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function postToTikTok({ caption, videoUrl, imageUrl } = {}) {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) throw new Error('TIKTOK_ACCESS_TOKEN חסר ב-.env');
  if (!videoUrl && !imageUrl) throw new Error('TikTok דורש videoUrl או imageUrl');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8',
  };

  const postInfo = {
    title: caption.slice(0, 2200),
    privacy_level: process.env.TIKTOK_PRIVACY || 'PUBLIC_TO_EVERYONE',
    disable_duet: false,
    disable_comment: false,
    disable_stitch: false,
  };

  let endpoint, body;

  if (videoUrl) {
    endpoint = `${TIKTOK}/post/publish/video/init/`;
    body = {
      post_info: { ...postInfo, video_cover_timestamp_ms: 1000 },
      source_info: { source: 'PULL_FROM_URL', video_url: videoUrl },
    };
  } else {
    endpoint = `${TIKTOK}/post/publish/content/init/`;
    body = {
      post_info: postInfo,
      source_info: {
        source: 'PULL_FROM_URL',
        photo_images: [imageUrl],
        photo_cover_index: 0,
      },
    };
  }

  const { data } = await axios.post(endpoint, body, { headers });

  if (data.error?.code && data.error.code !== 'ok') {
    throw new Error(`TikTok שגיאה: ${data.error.message}`);
  }

  const publishId = data.data?.publish_id;
  console.log(`✅ [TikTok] פורסם — Publish ID: ${publishId}`);
  return { platform: 'tiktok', id: publishId, success: true };
}

module.exports = { postToFacebook, postToInstagram, scheduleViaBuffer, postToTikTok, publishPost };
