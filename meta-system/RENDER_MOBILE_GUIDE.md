# 📱 מדריך התקנה מהנייד — Render.com
## כס המלך עיצובים | סמסונג גלקסי S23 אולטרה

---

> ✋ **כל הצעדים מבוצעים מהנייד בלבד — ללא מחשב!**

---

## מה שצריך:
- [ ] סמסונג S23 אולטרה (יש ✅)
- [ ] חשבון Gmail
- [ ] קובץ ה-ZIP שהורדת מקלוד

---

# שלב 1 — פתח חשבון GitHub (5 דקות)

GitHub זה כמו "כספת קוד" בענן — שם נשים את הקוד שלנו.

1. פתח דפדפן **Chrome** בנייד
2. כנס ל: **github.com**
3. לחץ **"Sign up"**
4. הירשם עם Gmail שלך
5. בחר תוכנית **Free**
6. אמת את האימייל

---

# שלב 2 — העלה את הקוד ל-GitHub (10 דקות)

## 2.1 — חלץ את ה-ZIP
1. פתח **"My Files"** (ניהול קבצים) בנייד
2. מצא את קובץ **meta-system.zip** שהורדת
3. לחץ לחיצה ארוכה → **"Extract"** (חלץ)
4. תיווצר תיקייה בשם **meta-system**

## 2.2 — צור Repository חדש ב-GitHub
1. פתח את אפליקציית **GitHub Mobile** (הורד מ-Play Store)
2. לחץ על **➕** למעלה
3. בחר **"New Repository"**
4. שם: `kas-hamelech-meta`
5. בחר **Private** (פרטי — חשוב!)
6. לחץ **"Create Repository"**

## 2.3 — העלה את הקבצים
1. בתוך ה-Repository לחץ **"Add file"** → **"Upload files"**
2. בחר **"Choose files"**
3. נווט לתיקיית **meta-system** שחילצת
4. סמן **את כל הקבצים** (לחץ ממושך על הראשון → בחר הכל)
5. לחץ **"Commit changes"**

> ⚠️ **חשוב:** אל תעלה את קובץ **.env** — הוא מכיל סיסמאות!

---

# שלב 3 — פתח חשבון Render.com (5 דקות)

1. כנס ל: **render.com**
2. לחץ **"Get Started for Free"**
3. בחר **"Continue with GitHub"**
4. אשר את הגישה

---

# שלב 4 — הגדר מסד נתונים ב-Render (5 דקות)

## 4.1 — צור PostgreSQL Database
1. לחץ **"New +"** (כפתור כחול)
2. בחר **"PostgreSQL"**
3. מלא:
   - **Name:** `kas-hamelech-db`
   - **Region:** Frankfurt (הכי קרוב לישראל)
   - **Plan:** Free
4. לחץ **"Create Database"**
5. חכה כ-2 דקות

## 4.2 — שמור את פרטי החיבור
אחרי שהמסד עלה, תראה את הפרטים:
```
לחץ על "Connect" ושמור:

Internal Database URL:
_________________________________
```

---

# שלב 5 — הגדר את השרת ב-Render (10 דקות)

## 5.1 — צור Web Service
1. לחץ **"New +"** → **"Web Service"**
2. בחר **"Connect a repository"**
3. מצא את `kas-hamelech-meta` ולחץ **"Connect"**

## 5.2 — הגדרות השרת
מלא את השדות הבאים:

| שדה | מה לכתוב |
|-----|-----------|
| Name | `kas-hamelech-server` |
| Region | Frankfurt |
| Branch | `main` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Plan | **Free** |

## 5.3 — הוסף משתני סביבה (הסיסמאות שלך)
לחץ על **"Environment Variables"** ולחץ **"Add"** לכל אחד:

```
WA_PHONE_NUMBER_ID        = (מה שכתבת בשלב 1.3)
WA_SYSTEM_USER_TOKEN      = (מה שכתבת בשלב 1.4)
WA_BUSINESS_ACCOUNT_ID    = (מה שכתבת בשלב 1.3)
FB_PAGE_ID                = (מה שכתבת בשלב 1.6)
FB_PAGE_ACCESS_TOKEN      = (= WA_SYSTEM_USER_TOKEN)
FB_AD_ACCOUNT_ID          = (מה שכתבת בשלב 1.7)
META_APP_ID               = (מה שכתבת בשלב 1.1)
META_APP_SECRET           = (מה שכתבת בשלב 1.2)
META_VERIFY_TOKEN         = כסהמלך2024
META_PIXEL_ID             = (מה שכתבת בשלב 1.5)
META_CAPI_TOKEN           = (מה שכתבת בשלב 1.5)
META_BUSINESS_ID          = (מהגדרות Business שלך)
DATABASE_URL              = (ה-URL מה-Database שיצרת)
NODE_ENV                  = production
ALERT_EMAIL               = האימייל שלך
```

## 5.4 — הפעל!
לחץ **"Create Web Service"**

Render יתחיל לבנות — ייקח כ-3-5 דקות.
תראה הודעה ירוקה: **"Live"** ✅

---

# שלב 6 — קבל את כתובת השרת שלך

אחרי שהשרת עלה, תראה כתובת בצורה:
```
https://kas-hamelech-server.onrender.com
```

✏️ **שמור את הכתובת הזו — תצטרך אותה לשלב הבא!**

---

# שלב 7 — חבר את Webhook ב-Meta

חזור לשלב 2.3 במדריך הראשי (SETUP_GUIDE_HEBREW.md):
- **Callback URL**: `https://kas-hamelech-server.onrender.com/webhooks/meta`
- **Verify Token**: `כסהמלך2024`

---

# שלב 8 — בדיקה מהנייד 🎉

פתח בדפדפן:
```
https://kas-hamelech-server.onrender.com
```

אם תראה את הדשבורד — **הכל עובד!** 🎊

---

# ⚠️ חשוב לדעת על Render Free

| נושא | מה שצריך לדעת |
|------|----------------|
| שינה | השרת "נרדם" אחרי 15 דק׳ חוסר פעילות |
| התעוררות | ייקח ~30 שניות לקום שוב |
| מגבלה | 750 שעות/חודש (מספיק לשימוש רגיל) |
| שדרוג | $7/חודש לשרת שתמיד ער — מומלץ בהמשך |

---

# 🆘 בעיות נפוצות בנייד

**"Build Failed"**
→ שלח לי את ההודעה האדומה — אתקן את הקוד

**"Cannot find .env"**
→ בסדר! ב-Render משתמשים ב-Environment Variables במקום .env

**הדשבורד לא נטען**
→ חכה 30 שניות ורענן (השרת מתעורר)

---

> 💡 **טיפ לעט S-Pen:**
> השתמש בעט לסמן ולהעתיק את ה-URL והסיסמאות — 
> הרבה יותר מדויק מהאצבע!

---

*כס המלך עיצובים — מדריך Render | מאי 2026*
