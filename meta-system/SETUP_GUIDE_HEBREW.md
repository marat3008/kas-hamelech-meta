# 👑 מדריך התקנה - כס המלך עיצובים
## מערכת Meta Business API

---

> ✋ **לא יודע מה זה קוד? אין בעיה!**
> המדריך הזה כתוב בשבילך. עקוב אחרי השלבים בדיוק כפי שהם כתובים.

---

## ⏱️ כמה זמן לוקח? 
- שלב 1 (Meta): 30-60 דקות
- שלב 2 (שרת): 20 דקות  
- שלב 3 (בדיקה): 10 דקות

---

## 📋 מה צריך לפני שמתחילים?
- [ ] חשבון Meta Business Manager מאומת (אמרת שיש ✅)
- [ ] מחשב עם חיבור אינטרנט
- [ ] אימייל פעיל

---

# שלב 1 — הגדרות ב-Meta (חשוב מאוד!)

## 1.1 — צור Meta Developer App

1. כנס לאתר: **https://developers.facebook.com**
2. לחץ על **"My Apps"** (האפליקציות שלי) בפינה הימנית
3. לחץ על הכפתור הירוק **"Create App"**
4. בחר סוג: **"Business"**
5. תן שם: `Kas Hamelech Meta System`
6. הכנס את מזהה ה-Business שלך
7. לחץ **"Create App"**

✏️ **שמור את המספר הזה:**
```
App ID: _______________________
```

---

## 1.2 — קבל את App Secret

1. באפליקציה שיצרת, לחץ על **Settings** → **Basic**
2. ליד **"App Secret"** לחץ **"Show"**
3. הכנס את הסיסמה שלך לפייסבוק

✏️ **שמור:**
```
App Secret: _______________________
```

---

## 1.3 — הגדרת WhatsApp

1. בתפריט השמאלי לחץ **"Add Product"** (הוסף מוצר)
2. מצא **"WhatsApp"** ולחץ **"Set Up"**
3. בחר את ה-Business Account שלך
4. תראה **"Phone Number ID"** — שמור אותו

✏️ **שמור:**
```
Phone Number ID: _______________________
WABA ID (WhatsApp Business Account ID): _______________________
```

---

## 1.4 — צור System User Token

זה כמו "מפתח מאסטר" שמאפשר למערכת לפעול אוטומטית.

1. כנס ל: **https://business.facebook.com**
2. לחץ על **Settings** (הגדרות) → **Business Settings**
3. בתפריט הצד: **Users** → **System Users**
4. לחץ **"Add"** → תן שם: `KasHamelech Bot`
5. בחר **Role: Admin**
6. לחץ **"Add Assets"** ותן גישה ל:
   - WhatsApp Account שלך
   - עמוד הפייסבוק שלך
   - חשבון הפרסום שלך
7. לחץ **"Generate New Token"**
8. בחר את האפליקציה שיצרת
9. סמן את כל ההרשאות הבאות:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
   - ✅ `pages_messaging`
   - ✅ `pages_show_list`
   - ✅ `ads_management`
   - ✅ `ads_read`
   - ✅ `leads_retrieval`
   - ✅ `business_management`
10. לחץ **"Generate Token"** וסמן שקראת את ההתראה

✏️ **שמור (חשוב מאוד — יופיע פעם אחת בלבד!):**
```
System User Token: _______________________
```

---

## 1.5 — הגדרת Pixel (למעקב קמפיינים)

1. כנס ל: **https://business.facebook.com/events_manager**
2. לחץ **"Connect Data Sources"**
3. בחר **"Web"** → **"Facebook Pixel"**
4. תן שם: `Kas Hamelech Pixel`

✏️ **שמור:**
```
Pixel ID: _______________________
```

לקבלת CAPI Token:
1. לחץ על הפיקסל
2. **Settings** → **"Generate Access Token"**

✏️ **שמור:**
```
CAPI Token: _______________________
```

---

## 1.6 — מצא את מזהי העמוד שלך

1. כנס לעמוד הפייסבוק של כס המלך
2. לחץ על **"About"** (אודות)
3. גלול למטה — תמצא **Page ID**

✏️ **שמור:**
```
Facebook Page ID: _______________________
```

לאינסטגרם:
1. כנס להגדרות חשבון האינסטגרם
2. **Account** → **"Professional Account"** → תמצא Account ID

---

## 1.7 — מצא את מזהה חשבון הפרסום

1. כנס ל: **https://business.facebook.com**
2. **Settings** → **Ad Accounts**
3. מצא את המספר שמתחיל ב-`act_`

✏️ **שמור (ללא ה-act_, רק המספר):**
```
Ad Account ID: _______________________
```

---

# שלב 2 — הגדרת המערכת

## 2.1 — מלא את קובץ ההגדרות

1. פתח את הקובץ: **`.env.example`**
2. שמור אותו בשם חדש: **`.env`** (בלי .example)
3. מלא את כל הערכים עם מה שצברת בשלב 1

כך זה אמור להיראות (דוגמה):
```
WA_PHONE_NUMBER_ID=123456789012345
WA_SYSTEM_USER_TOKEN=EAABxxxxxx...
WA_BUSINESS_ACCOUNT_ID=987654321
FB_PAGE_ID=111222333
FB_PAGE_ACCESS_TOKEN=EAABxxxxxx...
FB_AD_ACCOUNT_ID=444555666
META_APP_ID=777888999
META_APP_SECRET=abc123def456...
META_VERIFY_TOKEN=כסהמלך2024
META_PIXEL_ID=555666777
META_CAPI_TOKEN=EAABxxxxxx...
META_BUSINESS_ID=999888777
```

---

## 2.2 — הפעלת המערכת

### אפשרות א' — עם Docker (הכי קל!)

אם יש לך Docker מותקן:
```bash
docker-compose up -d
```
זהו! המערכת עולה.

### אפשרות ב' — ידנית

1. פתח Terminal/Command Prompt
2. נווט לתיקיית הפרויקט
3. הרץ:
```bash
npm install
npm start
```

---

## 2.3 — הגדרת Webhook ב-Meta

זה מה שמאפשר ל-Meta לשלוח הודעות לשרת שלך.

**קודם — קבל כתובת לשרת שלך:**
- אם אתה בפיתוח מקומי: השתמש ב-[ngrok.com](https://ngrok.com) (חינמי)
  ```bash
  ngrok http 3000
  ```
  תקבל כתובת כמו: `https://abc123.ngrok.io`
  
- אם יש לך שרת: זו פשוט הכתובת שלו

**הגדרת Webhook:**
1. חזור ל-**https://developers.facebook.com**
2. האפליקציה שלך → **WhatsApp** → **Configuration**
3. ליד **Webhook** לחץ **"Edit"**
4. **Callback URL**: `https://הכתובת-שלך/webhooks/meta`
5. **Verify Token**: הכנס `כסהמלך2024` (או מה שכתבת ב-META_VERIFY_TOKEN)
6. לחץ **"Verify and Save"**

אם הכל תקין — תראה ✅ ירוק!

7. תחת **"Webhook Fields"** — סמן:
   - ✅ `messages`
   - ✅ `message_deliveries`
   - ✅ `message_reads`

---

# שלב 3 — בדיקה

## 3.1 — בדוק שהשרת פועל

פתח דפדפן וכנס ל:
```
http://localhost:3000/health
```

אמור לראות:
```json
{ "status": "ok", "business": "כס המלך עיצובים" }
```

## 3.2 — פתח את הדשבורד

```
http://localhost:3000
```

תראה את מרכז הניהול! 🎉

## 3.3 — שלח הודעת WhatsApp ניסיון

1. בדשבורד לחץ על **"שליחת הודעה"**
2. הכנס מספר טלפון (שלך, לבדיקה)
3. כתוב הודעה ולחץ שלח

---

# ❗ בעיות נפוצות

**"Webhook verification failed"**
→ בדוק שה-META_VERIFY_TOKEN זהה בקובץ .env ובמה שהכנסת ב-Meta

**"Invalid token"**
→ System User Token פג תוקף — צור אחד חדש (שלב 1.4)

**"No permission"**
→ ה-System User לא קיבל גישה לנכס הנדרש — חזור לשלב 1.4

**הודעות לא מגיעות**
→ בדוק שה-Webhook מוגדר ומאומת (שלב 2.3)

---

# 📞 צריך עזרה?

כל שאלה — פשוט שאל את קלוד וצרף את השגיאה המדויקת שקיבלת.

---

*מערכת זו נבנתה עבור כס המלך עיצובים*  
*גרסה 1.0 — מאי 2026*
