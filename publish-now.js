// ===================================================
// פרסום מיידי — הרץ: node publish-now.js
// ===================================================

require('dotenv').config();
const axios = require('axios');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// מלא את הפרטים האלה (או שים ב-.env)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || 'הכנס-כאן-את-הטוקן';
const PAGE_ID    = process.env.FB_PAGE_ID           || 'הכנס-כאן-את-PAGE-ID';

// הפוסט שיפורסם עכשיו
const POST_TEXT = `הפרטים הם שעושים את ההבדל. 🤍

ידית עור עם כפתור זהב.
פיפינג שחור מדויק.
בד בוקלה רך במגע.
רגלי עץ חמות.

כל אחד מהכסאות האלה מיוצר בהתאמה אישית — הבד, הצבע, הגובה — בדיוק כמו שדימיינתם.

📍 אולם תצוגה: אליהו איתן 3, ראשון לציון (קומה ב׳, אולם 228)
📲 לפגישת עיצוב ללא התחייבות: 0523084224

#כסהמלך #כסאותיוקרה #ריהוטיוקרה #עיצובפנים`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function publishNow() {
  if (PAGE_TOKEN.includes('הכנס') || PAGE_ID.includes('הכנס')) {
    console.log('');
    console.log('❌ חסרים פרטים! מלא את PAGE_TOKEN ו-PAGE_ID בתוך הקובץ או ב-.env');
    console.log('');
    console.log('📖 איך מקבלים Page Access Token (2 דקות):');
    console.log('');
    console.log('  1. כנס ל: https://developers.facebook.com/tools/explorer');
    console.log('  2. לחץ "Generate Access Token"');
    console.log('  3. סמן הרשאה: pages_manage_posts ו-pages_read_engagement');
    console.log('  4. לחץ "Generate Access Token" שוב ואשר');
    console.log('  5. בחלון שנפתח — בחר "Get Page Access Token" מהתפריט');
    console.log('     ובחר את הדף "רהיטי כס המלך עיצובים"');
    console.log('  6. העתק את הטוקן');
    console.log('');
    console.log('  לקבלת Page ID:');
    console.log('  כנס לעמוד הפייסבוק → About → תמצא "Page ID" בתחתית');
    console.log('');
    return;
  }

  console.log('📤 מפרסם פוסט לפייסבוק...');

  try {
    const { data } = await axios.post(
      `https://graph.facebook.com/v21.0/${PAGE_ID}/feed`,
      { message: POST_TEXT, access_token: PAGE_TOKEN }
    );
    console.log('');
    console.log('✅ פורסם בהצלחה!');
    console.log(`   Post ID: ${data.id}`);
    console.log(`   קישור: https://facebook.com/${data.id.replace('_', '/posts/')}`);
    console.log('');
  } catch (err) {
    const e = err.response?.data?.error;
    console.log('');
    console.log('❌ שגיאה בפרסום:');
    console.log(`   ${e?.message || err.message}`);
    if (e?.code === 190) console.log('   → הטוקן פג תוקף. צור טוקן חדש ב-Graph Explorer');
    if (e?.code === 200) console.log('   → אין הרשאת pages_manage_posts לטוקן זה');
    console.log('');
  }
}

publishNow();
