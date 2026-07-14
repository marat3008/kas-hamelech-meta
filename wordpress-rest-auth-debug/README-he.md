# אבחון תקלת `rest_not_logged_in` + היעלמות Application Passwords

מדריך זה נותן לך כלי אבחון שמצביע **בשם** על התוסף/הפילטר שאשם, במקום לנחש בין 23 התוספים.

> **חשוב:** ה־repo הזה (`kas-hamelech-meta`) הוא מערכת ה־Node.js של Meta/WhatsApp — הוא **לא** אתר הוורדפרס. לכן אי אפשר לקרוא את `functions.php` / `wp-config.php` שלך מכאן. הכלי הבא רץ **על השרת שלך**, מדווח מה קורה שם, וגם יכול לתקן.

---

## מה כלול

| קובץ | מה זה |
|------|--------|
| `mu-plugins/rest-auth-diagnostic.php` | תוסף אבחון שמדווח בדיוק מי חוסם. רץ אוטומטית, לא ניתן לכיבוי ממסך התוספים. |
| `htaccess-authorization-fix.txt` | תיקון ל־`.htaccess` כשהשרת מוחק את כותרת ה־Authorization (הגורם #1 בפועל). |

---

## שלב 1 — התקנה (2 דקות, בלי קוד)

1. היכנס ל־**cPanel → File Manager** (או FTP) של `public_html`.
2. פתח `wp-content/`. אם אין תיקייה בשם `mu-plugins` — צור אותה.
3. העלה לתוכה את `rest-auth-diagnostic.php`.
4. זהו. אין צורך "להפעיל" — תוספי `mu-plugins` פעילים אוטומטית.

> שנה בקובץ את השורה `define( 'KH_DIAG_KEY', 'kh-change-me-9f3a' );` לסיסמה משלך — היא מאפשרת לקרוא את הדוח גם אם ההתחברות שבורה.

---

## שלב 2 — קריאת הדוח

בחר אחת מהדרכים:

- **דפדפן (מחובר כאדמין):** `https://your-site.com/wp-admin/tools.php?page=kh-rest-auth-diagnostic`
- **דפדפן (בלי התחברות, אם login שבור):** `https://your-site.com/wp-json/kh-diag/v1/report?key=הסיסמה-שבחרת`
- **WP-CLI (SSH):** `wp eval 'do_action("kh_diag_cli");'`

**דרך wp-admin תראה בראש העמוד "סיכום בעברית" עם שורות ✅/❌ ומה לעשות בכל שורה** — אין צורך לקרוא JSON. (בדרכי ה־API/CLI המידע הזה נמצא בשדה `verdict_he`.)

---

## שלב 3 — קריאת המסקנה

הדוח בודק בדיוק את שני החשודים שגרישה סימן, ועוד אחד נפוץ:

### חשוד 1 — פילטר על `rest_authentication_errors`
אם `filters_on_rest_authentication_errors` **לא ריק**, מישהו חוסם REST למשתמשים לא מאומתים.
השדה `file` יראה לך את התוסף (למשל `plugins/maspik/...`, `plugins/wordfence/...`, או `mu-plugins/...`).
→ **פעולה:** כבה זמנית את אותו תוסף, ובדוק אם Application Passwords חזרו.

### חשוד 2 — פילטר על `wp_is_application_passwords_available`
אם `wp_is_application_passwords_available` הוא `false`:
- אם `filters_on_wp_is_application_passwords_available` מצביע על קובץ תוסף/`functions.php` → זה ה"hardening" שמכבה אותם. הסר את ה־snippet או כבה את התוסף.
- אם אין פילטר אבל `is_ssl` הוא `false` → ראה למטה (פרוקסי HTTPS).

### חשוד 3 (הכי נפוץ בפועל) — כותרת Authorization נמחקת
אם `authorization_header` מציג `... REDIRECT_HTTP_AUTHORIZATION` או `absent`, השרת מוחק את פרטי ההזדהות של ה־Application Password לפני שוורדפרס רואה אותם — ולכן כל בקשה מקבלת `rest_not_logged_in`.
→ **פעולה:** הוסף את הבלוק מ־`htaccess-authorization-fix.txt` לקובץ `.htaccess` ב־`public_html`, טען מחדש את הדוח, וודא ש־`authorization_header` הפך ל־`present (HTTP_AUTHORIZATION)`.

### מקרה נוסף — `is_ssl=false` מאחורי Cloudflare/פרוקסי
זה לבדו מסתיר את Application Passwords. מצב התיקון (שלב 4) פותר זאת אוטומטית.

---

## שלב 4 — הפעלת התיקונים האוטומטיים (אופציונלי)

אחרי שראית את הדוח, אם תרצה שהכלי גם **יתקן** (יאלץ הפעלת App Passwords, יסמוך על ה־HTTPS של הפרוקסי, וישחזר את כותרת ה־Authorization), הוסף ל־`wp-config.php` (מעל השורה `/* That's all, stop editing! */`):

```php
define( 'KH_DIAG_APPLY_FIX', true );
```

טען מחדש את הדוח — `fix_mode_applied` יהפוך ל־`true` — ונסה שוב ליצור Application Password ב־
**המשתמשים → הפרופיל שלך → Application Passwords**.

> חשוב לזכור: התיקון ב־`mu-plugin` הוא "עקיפה". אחרי שזיהית את האשם האמיתי (חשוד 1/2), עדיף לתקן את המקור — ואז **למחוק את `rest-auth-diagnostic.php`** מהשרת.

---

## שלב 5 — בדיקת אמת של Application Password

אחרי שהצלחת ליצור סיסמה (נניח קיבלת `abcd EFGH ijkl MNOP qrst UVWX`):

```bash
curl -u "USERNAME:abcd EFGH ijkl MNOP qrst UVWX" \
     https://your-site.com/wp-json/wp/v2/users/me
```

- מקבל JSON עם פרטי המשתמש → **התקלה נפתרה.**
- מקבל `{"code":"rest_not_logged_in"}` → חזור לחשוד 3 (כותרת Authorization) — כמעט תמיד זו הסיבה שנשארת.

---

## ניקוי בסיום

כשהכול עובד: מחק את `wp-content/mu-plugins/rest-auth-diagnostic.php` והסר את `define('KH_DIAG_APPLY_FIX', true);` מ־`wp-config.php`.
