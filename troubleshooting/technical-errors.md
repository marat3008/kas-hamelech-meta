# 🔧 פתרון תקלות — שגיאות טכניות | כס המלך עיצובים

**קובץ אב:** `grisha-master-knowledge.md`
**קוד:** `meta-system/` · **התקנה:** `SETUP_GUIDE_HEBREW.md`

> כל שגיאה נרשמת גם ל-`error_logs` (`db/database.js` → `logError`). כשלא בטוח — הסלם למרט, אל תנחש בפעולה שנוגעת בכסף/נכסים.

---

## 1. טבלת שגיאות מהירה

| בעיה / קוד | סיבה | פתרון מהיר |
|---|---|---|
| **Webhook verification failed** | `META_VERIFY_TOKEN` ב-`.env` ≠ מה שהוזן ב-Meta | להשוות ולהתאים את שני הצדדים (ברירת מחדל בקוד: `כסהמלך2024`) |
| **חתימה נכשלת (403 ב-POST)** | `META_APP_SECRET` שגוי / `rawBody` לא נשמר | לוודא App Secret נכון; לא לשנות סדר middleware ב-`server.js` |
| **Invalid token / code 190** | System User Token פג/בוטל | ליצור **System User Token** חדש (SETUP שלב 1.4) |
| **No permission / code 10 / 200** | חסרים Scopes או גישת נכסים | להוסיף Scopes + Assets ל-System User |
| **WhatsApp 131047** | מחוץ לחלון 24 שעות | לשלוח **תבנית מאושרת** (`sendTemplate`), לא טקסט חופשי |
| **לידים לא נכנסים** | webhook `leadgen` לא רשום / חסר `leads_retrieval` | לרשום `leadgen` + להוסיף הרשאה |
| **הודעות WhatsApp לא מגיעות** | webhook לא מאומת / שדות לא מסומנים | לאמת webhook; לסמן `messages`,`message_deliveries`,`message_reads` |
| **חוסר אחידות Graph API** | `meta-ads.js` v23 מול `conversions.js`/`leads.js` v25 | לאחד גרסה — **משימת פיתוח** |
| **התראות אימייל לא נשלחות** | הגדרות SMTP ב-`.env` שגויות | לבדוק `SMTP_*`, App Password ל-Gmail |
| **DB/Redis לא מתחבר** | `DB_*`/`REDIS_*` שגויים / שירות כבוי | לבדוק `.env` ו-`docker-compose` |

---

## 2. Scopes נדרשים (System User Token)

`whatsapp_business_messaging` · `whatsapp_business_management` · `pages_messaging` · `pages_show_list` · `ads_management` · `ads_read` · `leads_retrieval` · `business_management`.

חסר scope = "No permission". חזור ל-SETUP שלב 1.4.

---

## 3. חלון 24 השעות של WhatsApp (131047)

- בתוך 24 שעות מהודעת הלקוח האחרונה → מותר טקסט חופשי (`sendText`).
- אחרי 24 שעות → **רק תבנית מאושרת** (`sendTemplate`, `type: 'template'`).
- `conversations.window_expires` מנהל את החלון (`now + 24h`).
- אין תבנית מתאימה? → צור/אשר תבנית ב-Meta; עד אז המתן ליוזמה מהלקוח.

---

## 4. CAPI — נקודות תקלה (capi/conversions.js)

- **v25.0**, `event_id` ייחודי לכל אירוע (מונע כפילויות מול הפיקסל).
- **PII מוצפן SHA-256** (`hashData`) — טלפון מנורמל (`normalizePhone`) לפני hash.
- ⚠️ `trackSchedule`/`trackPurchase` **לא מחוברים** — אם חסרים אירועי המרה במעלה המשפך, זו הסיבה, לא באג. חיבורם = משימת פיתוח.

---

## 5. פרוצדורת דיבוג (סדר פעולות)

1. **`/health`** — האם השרת חי? (`{ "status": "ok" }`).
2. **`error_logs`** בבסיס הנתונים — מה נרשם?
3. **לוגים** של השרת (`console.log` בקוד; `morgan` ל-HTTP).
4. **`.env`** — הערך הרלוונטי קיים ונכון?
5. **Meta App Dashboard** — סטטוס webhook, תוקף token, הרשאות.
6. עדיין תקוע? → הסלם למרט **עם השגיאה המדויקת** (העתק־הדבק).

---

## 6. מה שדורש הסלמה (לא לתקן לבד)

- כל דבר שנוגע בהוצאת כסף / הפעלת קמפיין.
- חשבון מושבת/מוגבל (ראה `ads-delivery-and-performance.md`).
- החלפת גרסת Graph API / שינוי קוד = משימת פיתוח מתואמת.

---

*חלק ממאגר הידע החי של כס המלך עיצובים. עדכן ותעד ב-`learning-loop/`.*
