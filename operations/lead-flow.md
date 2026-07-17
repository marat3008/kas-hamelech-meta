# 🔄 זרימת לידים ומערכת (Lead Flow) | כס המלך עיצובים

**קובץ אב:** `grisha-master-knowledge.md`
**קוד:** `meta-system/` (בארכיונים `kas-hamelech-code.7z`, `meta-system-v2-2.zip`)

> קובץ זה מתאר איך ליד/שיחה זורמים במערכת ה-Meta, מבוסס על הקוד בפועל. השתמש בו לפתרון תקלות ולהבנת המשפך התפעולי.

---

## 1. שני מסלולי כניסה

```
מסלול A — Click-to-WhatsApp
  מודעה → הודעת WhatsApp נכנסת → webhook /webhooks/meta
    → channels/whatsapp.js: handleIncoming()
    → פתיחת/עדכון שיחה (חלון 24 שעות) + שמירת הודעה
    → autoRespond(): מענה אוטומטי לפי סוג ההודעה
    → העברה לנציג (handoff) לסגירה ייעוצית

מסלול B — Lead Ad (טופס)
  מודעה → טופס Meta → webhook leadgen
    → leads/leads.js: handleNewLead()
    → fetchLeadDetails() (Graph API v25.0) → parseLeadFields()
    → db.saveLead() + notifier.sendLeadAlert() (אימייל)
    → CAPI sendEvent('Lead') + הודעת WhatsApp פותחת
```

---

## 2. אימות Webhook (server.js)

- **GET `/webhooks/meta`** — אימות ראשוני מול `META_VERIFY_TOKEN`.
- **POST `/webhooks/meta`** — אימות חתימה `x-hub-signature-256` מול `META_APP_SECRET` (`verifyMetaSignature`, HMAC-SHA256, `timingSafeEqual`).
- ה-`rawBody` נשמר לפני parse ה-JSON — נדרש לאימות החתימה. **אל תשנה את סדר ה-middleware הזה.**

**שדות webhook שצריך להיות מסומנים ב-Meta:** `messages`, `message_deliveries`, `message_reads` (WhatsApp). ולידים: רישום webhook `leadgen` + הרשאת `leads_retrieval`.

---

## 3. מנוע המענה האוטומטי (channels/whatsapp.js)

`autoRespond()` מזהה כוונה ומגיב:

| זיהוי | פונקציה | פעולה |
|---|---|---|
| ברכה (`isGreeting`) | `sendWelcomeMessage` | הודעת פתיחה |
| מחיר (`isPriceInquiry`) | `sendCatalogMessage` | ⚠️ קטלוג — היזהר מ-❓ מחיר |
| תיאום (`isAppointmentRequest`) | `sendAppointmentMessage` | תיאום ייעוץ |
| אחר / מורכב | `sendHandoffMessage` | העברה לנציג אנושי |

- **חלון 24 שעות:** שיחה נפתחת עם `window_expires = now + 24h`. בתוך החלון — טקסט חופשי (`sendText`). מחוץ לחלון — **תבנית מאושרת בלבד** (`sendTemplate`), אחרת שגיאה 131047.
- **סימון נקרא:** `markAsRead()`. **כפתורים:** `sendButtons()`. **תמונות:** `sendImage()`.

> ⚠️ המענה על שאלת מחיר לא ימציא מחיר — הוא שולח קטלוג/מפנה לנציג. אין למלא ❓ מחיר בתבניות.

---

## 4. שמירה ותור אנושי (db/database.js)

טבלאות: `messages`, `conversations`, `leads`, `error_logs`, `human_review_queue`.

- `saveLead()` / `getLeads()` — ניהול לידים.
- `flagForHumanReview()` — כל דבר לא ודאי → תור אנושי (במקום ניחוש).
- `logError()` — כל שגיאה נרשמת ל-`error_logs` (מקור לפתרון תקלות).

---

## 5. התראות (utils/notifier.js)

`sendLeadAlert(contact)` שולח אימייל ל-`ALERT_EMAIL` על כל ליד חדש (SMTP מ-`.env`). זו נקודת ההתראה בזמן אמת — ודא שהיא עובדת, כי **זמן תגובה ≤ שעה** הוא KPI קריטי (`operations/kpis.md`).

---

## 6. יעד תפעולי — זמן תגובה

- **≤ שעה** מרגע כניסת ליד/שיחה ועד מענה אנושי.
- מהירות = כבוד = המרה, במיוחד בקהל שומר-שבת.
- **שבת/חג:** אין מענה אוטומטי; לידים שנכנסים אז מטופלים במוצ"ש/מוצאי-חג. ודא שהאוטומציה לא שולחת הודעות בשבת.

---

## 7. פערים ידועים (למעקב פיתוח)

- **CAPI חלקי:** `trackContact`/`trackLead` מחוברים; `trackSchedule`/`trackPurchase` קיימים ב-`capi/conversions.js` אך **לא נקראים** → Meta לא מקבלת אירועי פגישה/רכישה. משימת פיתוח: לחבר בעת סגירה בשיחה.
- **חוסר אחידות גרסת Graph API:** `ads/meta-ads.js` = `v23.0`, `capi/conversions.js` ו-`leads/leads.js` = `v25.0`. לאחד — משימת פיתוח.

פירוט טכני מלא: `troubleshooting/`.

---

*חלק ממאגר הידע החי של כס המלך עיצובים. עדכן ותעד ב-`learning-loop/`.*
