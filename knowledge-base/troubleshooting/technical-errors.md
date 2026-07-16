# Technical & API Errors — Symptom → Cause → Fix

Covers the `meta-system` server, Meta webhooks, tokens/permissions, WhatsApp Cloud API, CAPI, Lead Ads sync, and the database. File/line references point at the code in the archives (`meta-system-v2-2.zip`).

---

## 1. Webhook & signature

| Symptom | Likely cause | Fix |
|---|---|---|
| "Webhook verification failed" / Meta shows red ✗ when saving | `META_VERIFY_TOKEN` in `.env` ≠ the token typed into Meta | Make them identical (default in guide: `כסהמלך2024`). Re-verify. `server.js` GET `/webhooks/meta` compares them. |
| Meta says webhook OK, but **nothing happens** on messages/leads | Webhook *fields* not subscribed, or the App isn't subscribed to the Page/WABA | In Meta → subscribe fields: `messages`, `message_deliveries`, `message_reads` (WhatsApp) and `leadgen` (Page). Subscribe the App to the Page. |
| POST returns **401 "חתימה לא תקינה"** (invalid signature) | `META_APP_SECRET` wrong, OR body was re-parsed so `rawBody` differs from what Meta signed | Verify `META_APP_SECRET`. Ensure the raw-body capture middleware runs for `/webhooks/meta` *before* any other JSON parse (`server.js` uses `express.json({ verify })` to set `req.rawBody`). Don't move that. |
| Meta keeps retrying / duplicate processing | Server didn't reply 200 within seconds | Always `res.sendStatus(200)` immediately, then process in the background — the code already does this; don't add slow work before the 200. |
| `⚠️ אירוע לא מוכר מ-Meta` in logs | Webhook `object` type not handled (e.g., new product) | Expected for unhandled types; add a `case` in the `switch` (`server.js`) if it's one you need. |

---

## 2. Tokens & permissions

| Symptom | Likely cause | Fix |
|---|---|---|
| "Invalid OAuth access token" / API 401 / error code **190** | System User Token expired or revoked | Regenerate the **System User Token** (Business Settings → Users → System Users → Generate). Update `WA_SYSTEM_USER_TOKEN` / `FB_PAGE_ACCESS_TOKEN`. Prefer a **never-expiring System User token**. |
| "(#10) / (#200) Application does not have permission" | Missing scope or asset access | Ensure token has: `whatsapp_business_messaging`, `whatsapp_business_management`, `pages_messaging`, `pages_show_list`, `ads_management`, `ads_read`, `leads_retrieval`, `business_management`. Grant the System User access to the WABA, Page, and Ad Account (Add Assets). |
| Lead fetch works but WhatsApp send fails (or vice-versa) | Two different tokens: WhatsApp/Ads use `WA_SYSTEM_USER_TOKEN`; Lead fetch uses `FB_PAGE_ACCESS_TOKEN` | Both must be valid & scoped. `leads.js` reads with the **Page** token; `whatsapp.js`/`meta-ads.js` use the **System User** token. |
| Everything 400s after a while | Token silently expired (short-lived page token) | Use long-lived / system-user tokens; add a startup check that pings `/me` and warns if a token is invalid. |

---

## 3. WhatsApp Cloud API (sending messages)

| Error / code | Meaning | Fix |
|---|---|---|
| **131047** "Re-engagement message" | You tried to send a free-form message **outside the 24-hour** customer service window | Use an **approved template** (`whatsapp.sendTemplate`). Free text only works ≤24h after the user's last message. `whatsapp.js` tracks the window via `upsertConversation` (`window_expires`). |
| **132000 / 132001** | Template param count/name mismatch or template not approved | Match the number/order of `{{n}}` params; use only **approved** templates in the right language (`he`). |
| **133010** | Phone number not on WhatsApp | Validate number; `normalizePhone` converts leading `0` → `972`. Confirm country code. |
| **131026** "Message undeliverable" | Recipient can't receive (not opted-in / blocked / bad number) | Nothing to send; log and route to human. |
| **131056 / 80007** | Rate / pair-rate limit | Back off and retry; don't blast. Raise messaging limits by improving number quality. |
| **131051** | Unsupported message type | Send a supported type (text/image/template/interactive). |
| Number quality drops / "Flagged" in WhatsApp Manager | Too many blocks/spam reports, mass unsolicited messages | Only message people who contacted you or opted in; keep content relevant; respect the 24h window. Quality gates your daily send limit. |
| `markAsRead` fails | Non-critical | Ignored by design (`whatsapp.js` swallows it). No action. |

---

## 4. Conversions API / Pixel (CAPI)

| Symptom | Likely cause | Fix |
|---|---|---|
| `⚠️ CAPI: חסר PIXEL_ID או CAPI_TOKEN` | `META_PIXEL_ID` or `META_CAPI_TOKEN` empty | Fill both in `.env`. Event is silently skipped otherwise (`conversions.js`). |
| Events not showing in Events Manager | Wrong pixel/token, or events failing quietly | `conversions.js` logs `❌ שגיאת CAPI`; check logs. Verify in Events Manager → Test Events. |
| Duplicate conversions counted | Missing/duplicate `event_id` | Every event needs a **unique** `event_id` for dedup (code uses `lead_<id>`, `wa_<id>`, etc.). Keep it stable per real event. |
| Poor match quality | Only phone/email hashed, no `fbc`/`fbp` | Pass `fbc` (from `fbclid`) and `fbp` when available. PII must be **SHA-256 hashed, trimmed, lowercased** — `hashData` already does this; never send raw PII. |
| **Campaigns can't optimize toward revenue** | `trackPurchase`/`trackSchedule` **exist** in `conversions.js` but are **never called** — the flow only fires `Contact` (whatsapp.js) and `Lead` (leads.js) | **Wire them in:** call `trackSchedule` when a studio visit is booked and `trackPurchase(phone, email, value)` when a deal closes. This is the single biggest measurement upgrade (see `../operations/kpis.md`). |
| Odd API behavior across modules | **API version drift**: `whatsapp.js`/`meta-ads.js` use `v23.0`, `leads.js`/`conversions.js` use `v25.0` | Standardize all modules on one current Graph API version to avoid inconsistent fields/deprecations. |

---

## 5. Lead Ads sync (leads not arriving)

| Symptom | Likely cause | Fix |
|---|---|---|
| Form submitted but no lead in system | `leadgen` field not subscribed, or App not subscribed to the Page | Subscribe Page to App + `leadgen` webhook field. `server.js` routes `object:'page'` → `change.field==='leadgen'` → `leads.handleNewLead`. |
| Lead arrives but fields empty/mismatched | Form field names differ from expected | `parseLeadFields` normalizes `full_name/name`, `phone_number/phone`, etc. Add mappings for custom form fields. |
| `leads_retrieval` permission error on fetch | Token lacks scope / Page access | Add `leads_retrieval` and Page asset to the System User / Page token. |
| Lead saved but no WhatsApp welcome | No phone captured, or 24h/template issue | Ensure the form collects phone; first outbound to a *new* lead may need a **template** (see §3). |
| No team alert on new lead | SMTP/notifier misconfig | Check `ALERT_EMAIL`/SMTP vars; `utils/notifier.js` + `leads.js` `notifier.sendLeadAlert`. |

---

## 6. Server, environment & database

| Symptom | Likely cause | Fix |
|---|---|---|
| Server exits on boot: `❌ שגיאה בהפעלת השרת` | DB connect fails (`db.connect()` in `startServer`) | Check `DB_HOST/PORT/NAME/USER/PASSWORD`; is Postgres up? With Docker use `docker-compose up -d`. |
| `/health` unreachable | Server not running / wrong port / not deployed | Confirm process is up, `PORT`, and public `SERVER_URL`. For local + Meta, expose via ngrok (`ngrok http 3000`). |
| Meta can't reach a local server | No public HTTPS URL | Use ngrok or deploy (Render/host). Update the webhook Callback URL and `SERVER_URL`. |
| Secrets committed / leaked | `.env` in git | Keep `.env` untracked (only `.env.example` is committed). Rotate any exposed token immediately. |
| Errors vanish silently | Many handlers `catch` and log only | Errors are persisted via `db.logError('webhook'|'lead', ...)`. Review that table when diagnosing. |

---

## Adding to this file

When you hit a problem not listed here: fix it, then add a row (symptom → cause → fix) and note it in `../learning-loop/LEARNING_LOG.md`. That is how the KB approaches "answer anything."
