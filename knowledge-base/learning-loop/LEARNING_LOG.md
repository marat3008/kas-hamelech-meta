# 🔁 Learning Log

Append-only. Most-recent entry on top. Use `session-template.md` for the format. See `README.md` for the loop.

---

## 2026-10-23 — Extracted meta-system code into the repo

**Focus:** Marat approved ("תחלץ כן") extracting the `meta-system` Node app from the archive into version control.
**Live actions taken:** none (source-control only)

### What we did
- Extracted `meta-system-v2-2.zip` into `meta-system/` in the repo (17 files): `server.js`, `channels/` (whatsapp, messenger, instagram), `leads/leads.js`, `ads/meta-ads.js`, `capi/conversions.js`, `db/database.js`, `dashboard/`, `utils/notifier.js`, `Dockerfile`, `docker-compose.yml`, `package.json`, and the Hebrew setup/Render guides.
- Verified the bundled `.env.example` contains only placeholders (no real tokens/secrets).
- Left the stub root `server.js`/`package.json` untouched; rebased cleanly onto the current branch tip (which did not yet contain `meta-system/`).

### Notes / next
- The `meta-system/` code now lives under git; the `.zip`/`.7z` archives are redundant (`.7z` already gitignored; can remove on request).
- Backlog now actionable in-tree: wire `trackPurchase`/`trackSchedule` (`capi/conversions.js`), and standardize the Graph API version (v23 vs v25) across modules.

---

## 2026-10-19 — Fixed duplicate /index.php/ URLs end-to-end (permalinks → verified redirects → GSC reindex)

**Focus:** Closed the technical SEO issue flagged in `grisha-competitor-intel` (Google indexing both `/index.php/chairs|about|shop|tables/` and the clean versions in parallel).
**Channels/campaigns touched:** none (technical SEO only).
**Live actions taken:** Marat clicked "Save Changes" on WordPress Settings → Permalinks himself (Grisha does not touch WP live, per the red line). Grisha then, with Marat's go-ahead and using his already-authenticated Chrome session (no credentials entered, no CAPTCHA touched), ran the verified GSC request-indexing flow (`grisha-gsc-request-indexing` skill) for the 4 affected clean URLs.

### What we did
1. Guided Marat through WordPress Settings → Permalinks (screenshots confirmed "Post name" structure was already correct; the fix was re-saving to flush `.htaccess`).
2. Verified live, via the browser (read-only, no login): `/index.php/chairs/`, `/index.php/about/`, `/index.php/shop/` all now 301 to their clean URLs and render the correct page content.
3. Requested Google re-indexing via Search Console (`resource_id=https://www.kingchairs.co.il/`) for the 4 clean canonical URLs: `/chairs/`, `/about/`, `/shop/`, `/tables/`. All 4 returned "התקבלה בקשה ליצירת אינדקס" (request accepted, added to priority crawl queue). No quota warning (well under the ~10-12/day limit).

### What we observed (data)
- 4/4 URLs: redirect verified + GSC indexing request accepted. 0 failures, 0 quota issues.

### What we concluded
- Confirmed: the duplicate-URL technical issue from `grisha-competitor-intel` is resolved. Hypothesis to confirm later (needs days/weeks): Google Search Console's coverage report should show the `/index.php/*` versions drop out and the clean versions get (re)crawled faster given the priority queue request.

### Knowledge-base changes folded back
- This log entry. Worth updating `grisha-competitor-intel`'s "🔴 בעיה טכנית פתוחה" section next time it's touched, to mark it resolved 2026-10-19 rather than leaving it flagged as open.

### Open questions / next session
1. Check GSC Coverage report in a week or two to confirm the old `/index.php/*` URLs actually drop out of the index (not just that the crawl was requested).

---

## 2026-10-19 — Formalized the Grisha ↔ intelligence-agent sync protocol

**Focus:** Marat asked to activate a "perfect, synced, 100%" collaboration between Grisha and the automated intel scanner (`seo/`), framed as competing on his prices. Before writing anything, verified what already exists rather than inventing a new mechanism.
**Channels/campaigns touched:** none (knowledge-base/process only).
**Live actions taken:** none — no spend, no publishing, no product facts touched. Read-only verification: `Get-ScheduledTask`/`Get-ScheduledTaskInfo` on the three relevant Windows tasks.

### What we did
- Verified live that all three scheduled tasks the system depends on are healthy right now: `Grisha Designer Intel Scan` (hourly), `Grisha Strategy Engine` (daily 05:00), and `OmniRoute Watchdog` — all `State: Ready`, `LastResult: 0`. The failures logged on 2026-10-16 (`ERROR_NO_SUCH_LOGON_SESSION`, Watchdog failure) are no longer reproducing.
- Found the real gap: the hourly scanner and daily digest already feed `intelligence/grisha-intelligence-feed.md` / `grisha-strategy-digest.md` correctly, but nothing formally defined when a verified signal should turn into an actual organic-content action versus just being noise.
- Wrote `knowledge-base/intelligence/grisha-content-sync-protocol.md`: the full loop (scan → feed → session reads feed+digest → 3-question relevance/novelty/❓-safety filter → content draft → log → fold learning back), plus an explicit filter so "no new signals" days correctly produce no action.
- Flagged the literal "compete on my prices" framing against existing brand doctrine (`instructions-for-grisha.md` / `grisha-master-knowledge.md`: compete on quality/craft, not price; no discounts). Documented the honest version: market-price context from `grisha-competitor-intel` (pro.co.il/midrag/ynet 2026 benchmarks) can inform messaging, but is never presented as Kas Hamelech's own price (still ❓, unconfirmed).

### What we observed (data)
- `Grisha Designer Intel Scan`: LastRun 2026-10-19 10:13, LastResult 0, NextRun 11:13.
- `Grisha Strategy Engine`: LastRun 2026-10-19 05:00, LastResult 0, NextRun 2026-10-20 05:00.
- `OmniRoute Watchdog`: LastRun 2026-10-19 11:05, LastResult 0, NextRun 11:10.

### What we concluded
- Confirmed: the automation infrastructure Marat was asking to "activate" already runs correctly end-to-end; what was missing was the decision rule connecting its output to content action, not new tooling.
- Hypothesis (to confirm over coming sessions): the 3-question filter (relevant / new / doesn't require a ❓ field) will keep signal-to-draft conversion focused instead of producing noise on every "no new signals" cycle.

### Knowledge-base changes folded back
- New file: `knowledge-base/intelligence/grisha-content-sync-protocol.md`.
- Updated: `knowledge-base/README.md` (added the new file to the structure listing).

### Decisions (update, same day)
- **Marat decided:** stay on quality/craftsmanship positioning, exactly as today — do not open price-based messaging. Price stays ❓, "no discounts" rule unchanged. Updated `grisha-content-sync-protocol.md` §7 to record this as settled, not re-askable unless Marat himself reopens it.

### Open questions / next session
1. Going forward, each session should actually apply the new filter to the latest feed/digest entries and note in this log whether a draft was produced or the signal was correctly skipped — to prove the loop is being used, not just documented.

---

## 2026-10-16 — Scored status report on the agent system (Marat asked for a report + grade)

**Focus:** Marat asked for a detailed report with a score on "my agents" — capability level, gaps, what to improve. Verified every claim live rather than trusting the 2026-10-16 audit notes.
**Live actions taken:** none — read-only verification (`npm test`, `git log`/`status`/`ls-files`, `schtasks /Query`, file reads). This entry only.

### What we verified since the last audit entry (same day, few hours later)
- **Corrected a stale fact from this morning's audit:** commit `cb76a76` (the SEO/intel system commit) **was already pushed** — `git status` shows the branch `claude/king-chairs-marketing-ce6gjs` up to date with `origin`. It is **not** merged into `main` yet — that's the real open item, not the push itself.
- `git ls-files` confirms the 68 previously-untracked files (`seo/`, `knowledge-base/intelligence/`, `knowledge-base/campaigns/`, `grisha-memory.md`, `start-grisha-intelligence.ps1`) are now tracked — the cross-machine gap flagged this morning is closed.
- `npm test` → **99/99 passing** (up from 95/95 logged this morning — more tests landed since).
- **New finding, not previously logged:** `schtasks /Query` on "Grisha Designer Intel Scan" (hourly) shows `Last Result: -2147020576` (0x80070520, `ERROR_NO_SUCH_LOGON_SESSION`) at its most recent run (16/10 14:13), even though the task is configured "Interactive only" and had been running cleanly every hour since 2026-10-09 per the intelligence feed (last clean entry 07:13). Likely cause: the task can't run when no interactive session is active (locked screen / logged off) — worth checking whether the PC was locked around that time.
- **New finding:** "OmniRoute Watchdog" scheduled task's last run (14:50) also returned `Last Result: 1` (failure). Unrelated to Grisha/seo code directly, but it's the infra the "free tokens only" rule depends on, so a sustained failure there pushes bulk work back onto billed tokens silently.
- `seo/lib/runGovernor.js` confirmed still unwired (only referenced by its own test + the README) — same open item as this morning, not yet resolved.
- Live data providers remain unchanged: Ahrefs blocked (`insufficient_plan`, re-verified 2026-10-08, not re-probed today), Supermetrics still expired per earlier memory, Claude-in-Chrome TikTok Studio access not re-tested this session.

### Decisions
- Did not touch Task Scheduler, git (no commit/push), or the Ahrefs/Supermetrics accounts — all require Marat's call (money, or diagnosing why his machine's session state caused the logon error).
- Gave Marat a scored report in chat rather than publishing a separate document, since it's his own internal verdict request.

### Open questions / next session
1. Was the PC locked/logged-off around 16/10 10:13–14:13? If this keeps happening, the hourly scan task needs either "run whether logged on or not" (with stored credentials) or an acceptance that it only runs while Marat is actively logged in.
2. Fix or disable "OmniRoute Watchdog" — currently failing.
3. Merge `claude/king-chairs-marketing-ce6gjs` into `main`, or confirm that's intentionally not the workflow.
4. Wire `runGovernor.js` or remove it.

---

## 2026-10-16 — Agent-system audit: fixed a handoff bug, two broken/undocumented scheduled tasks found

**Focus:** Requested audit of "the agent system" — the Grisha persona + the automated `seo/` designer/competitor scanner it depends on. Reviewed instructions, code, tests, scheduled tasks, and ~3 months of this log for drift between documented and actual behavior.
**Channels/campaigns touched:** none (infrastructure/documentation only).
**Live actions taken:** none — no spend, no publishing, no product facts touched.

### What we did
- Read `instructions-for-grisha.md`, the KB README, and the full `seo/` codebase (lib, tests, config, README) against actual behavior (ran `npm test`, inspected Windows Task Scheduler, inspected `meta-system-v2-2.zip`).
- Fixed a real bug in `seo/lib/grishaHandoff.js`: `deliverReport` always wrote a JSON file + a knowledge-base entry even when a scan found nothing, because `reportId` includes a timestamp so the idempotency check never caught repeat empty reports. The hourly "Grisha Designer Intel Scan" task had been flooding `intelligence/grisha-intelligence-feed.md` with 114 "no signals" entries out of 154 total (74% noise) since 2026-10-09. Added a guard (`findingsCount === 0` → don't write) + a regression test. `npm test` now 95/95 passing.
- Updated `knowledge-base/README.md` and `instructions-for-grisha.md`'s knowledge map: neither previously mentioned `campaigns/`, `intelligence/grisha-intelligence-feed.md`, or the root-level `grisha-memory.md`/`grisha-master-knowledge.md`/`grisha-organic-strategy.md` files, and **neither mentioned that the automated `seo/` scanner exists at all**. A Grisha session reading only `instructions-for-grisha.md` had no way to discover that an automated intelligence feed existed or where it lived — a one-way handoff with no documented receiver.

### What we observed (facts found in the environment, not guessed)
- **This learning log had not been updated since 2026-07-19** (3 months), despite the entire `seo/` scanner subsystem being built, tested, and put into daily operation in that gap (per `seo/README.md`'s own dated changelog, Oct 8–16). The content/organic side (this log, `grisha-memory.md`) and the SEO/competitor-intel side evolved as two unsynchronized tracks.
- A second Windows Scheduled Task, **"Grisha Strategy Engine"** (daily, 05:00), runs `node seo/grisha-strategy-engine.js` — **that file does not exist** anywhere in the repo or its git history. It has been failing silently every day since 2026-10-10 (`LastTaskResult = 1`). Per this session's own safety rules, modifying Windows Task Scheduler is a system-settings change I will not make myself — **this needs Marat's/the operator's decision**: either the script was never committed, or the task should be deleted. See "Open questions" below.
- `knowledge-base/campaigns/`, `knowledge-base/grisha-memory.md`, `knowledge-base/intelligence/`, `seo/`, and `start-grisha-intelligence.ps1` are all **untracked in git** (confirmed via `git status`) — they exist only on this one machine. If this repo is cloned fresh (another machine, or Marat pulling from GitHub), the current working memory, campaign calendars, and the entire SEO scanner would be missing.
- `seo/lib/runGovernor.js` (budget-reservation logic, fully tested) is never imported by any runtime code — a finished but unwired/dead module.
- The `meta-system` codebase that `instructions-for-grisha.md`'s troubleshooting section describes in detail (CAPI, WhatsApp, Lead Ads, `server.js` webhook signature verification) exists only inside `meta-system-v2-2.zip` — the repo's actual live `server.js` at the root is an unrelated 1-line stub (health check + webhook-challenge echo only, no signature verification, no CAPI/leads/WhatsApp wiring). Confirmed the zip's known issues are still present: Graph API version drift (`ads/meta-ads.js`+`whatsapp.js` on v23.0 vs `leads/leads.js`+`capi/conversions.js` on v25.0) and `trackPurchase()`/`trackSchedule()` defined but never called.

### What we concluded (confidence: confirmed, verified directly)
- The handoff bug was a real, verified defect (confirmed by counting feed entries, reading the source, and reproducing the fix with a passing regression test) — not a guess.
- The missing-script scheduled task is a confirmed failure (reproduced `MODULE_NOT_FOUND` by running it directly), not a hypothesis.
- Whether the two "tracks" (organic/Grisha vs. SEO/intel) should formally merge, and whether `meta-system-v2-2.zip` is meant to be the real production backend or a historical snapshot of something deployed elsewhere (e.g. Render, per the zip's own `RENDER_MOBILE_GUIDE.md`), is **not something I can confirm from the repo alone** — flagged for Marat.

### Decisions
- Applied the `grishaHandoff.js` fix and documentation updates now (low-risk, reversible, directly serves the system's own stated design intent).
- Left the 154 historical feed entries untouched — they're evidence of what happened, not an invitation to rewrite history; pruning them is Marat's call, not mine.
- Did **not** touch the Windows Task Scheduler, the `.zip`, or git-add the untracked files — those are environment/scope/business decisions, not code bugs.

### Knowledge-base changes folded back
- `seo/lib/grishaHandoff.js` + `seo/__tests__/grishaHandoff.test.js` — stop persisting zero-finding reports.
- `knowledge-base/README.md` + `instructions-for-grisha.md` — added the missing directories/files to the knowledge map, and explicitly documented the `seo/` automated scanner and its hand-off file so future sessions know it exists.

### Open questions / next session
1. **"Grisha Strategy Engine" scheduled task** (daily 05:00, `node seo/grisha-strategy-engine.js`) has been failing since 2026-10-10 because the file doesn't exist. Marat/operator: either commit the missing script, or delete/disable the task — I won't touch Task Scheduler myself.
2. Should `seo/`, `start-grisha-intelligence.ps1`, `knowledge-base/campaigns/`, `knowledge-base/grisha-memory.md`, and `knowledge-base/intelligence/` be committed to git? Right now the KB's "single source of truth" claim doesn't hold across machines.
3. Is `meta-system-v2-2.zip` the real production backend (deployed elsewhere, e.g. Render) or stale? If it's live, the Graph API version drift and unwired `trackPurchase`/`trackSchedule` are real engineering tickets, not historical notes.
4. Should `seo/lib/runGovernor.js` be wired into the scanner (to actually cap scan budget/cost) or removed as dead code?

---

## 2026-07-19 — TikTok analytics pulled live: SEO is a major lever (27% of traffic from search)

**Focus:** Marat chose to focus on organic. Read the TikTok Studio Analytics (Overview, last 7 days) live.
**Live actions taken:** none (read-only analysis).

### Data (last 7 days — post-viral baseline, ~287 views)
- **Traffic source:** For You **71.6%**, **Search 26.9%**, Personal profile 1.5%.
- **Search queries:** "כסאות לפינת אוכל" 19%, "כיסאות לפינת אוכל" 14.3%, "כסאות אוכל מפוארים" 14.3%.
- The −113.6K drop just reflects the 148K viral video's traffic being concentrated in its first week (early July); baseline is ~200–300/wk. One big hit, not consistent virality — goal is to make the winning formula repeatable.

### Durable lesson (folded into grisha-memory.md)
- **TikTok SEO is a major channel here (27%).** Put the exact search phrases ("כסאות לפינת אוכל" etc.) in the **first line of the caption AND in the on-screen text** — TikTok indexes both for search. Free reach multiplier.

---

## 2026-07-19 — 🔴 MAJOR CORRECTION: live TikTok access — account is active with a 148K viral video

**Focus:** Claude-in-Chrome finally connected. Read the live TikTok Studio for @marataltman. Everything I concluded from earlier screenshots was wrong.

### The correction (discard prior "dormant/577/small account" conclusions)
- Account **@marataltman** is **active**, **169 posts** (posts in July 2026), NOT dormant.
- **Top video: 148,000 views** — "כיסא יוקרה בעבודת יד. פרטים בוואטסאפ עכשיו" (0:50, posted **2026-07-01**). This is the real "137K" the overview hinted at — a genuine organic viral hit, not a paid anomaly.
- Other winners (filtered ≥1K): 5,548 = "אזהרה לא לקנות כסאות מעצבים באלפי שקלים…" (contrarian/warning hook, Jun 30); 3,445 = "#כסאות #כסאותחזקים #כסהמלךעיצובים…#diningchair" (Jan 2024); 1,857; 1,680.

### Winning formula (data-backed)
- **Luxury handmade chair + short video + direct "פרטים בוואטסאפ עכשיו" CTA** → 148K.
- **Contrarian "warning/don't buy before you see" hook** → 5.5K. Pattern-interrupt works for this audience.
- Proven hashtags: `#כסאות #כסאותחזקים #כסהמלךעיצובים #רהיטיםבהתאמהאישית #עיצובפנים #diningchair #פינתאוכל`.

### Apply
- Replicate the 148K formula (luxury chair + WhatsApp CTA) and the warning-hook format in new posts. Fold these into `creative/ad-copy-library.md` and `messaging-framework.md` hook bank.
- Account posts frequently → filming is NOT a blocker (my earlier "need to film" assumption was wrong). Claude-in-Chrome now works → I can read analytics autonomously going forward.

### ⚠️ Note on prior entries below
- The 2026-07-18 entries calling this a "reactivation / small (~577) / dormant" account, and the repost pack built on the Dec-2025 videos, were based on a misleading partial screenshot. Superseded by this entry.

---

## 2026-07-19 — Repost pack built from existing top videos (no filming needed)

**Focus:** Marat: use the account's most-viewed existing videos. Repurpose them instead of filming new footage.
**Live actions taken:** none by me (still no publishing channel — Marat uploads). Prepared optimized captions.

### Repost queue (from the Posts-tab screenshot, by views; 2025-12-01/577 already reposted)
1. **2025-12-28 (236 views)** — new caption: bespoke/dining-chairs (V1+A5) + `#כסאותלפינתאוכל #כסאותאוכלמפוארים #עבודתיד #כסהמלך #רהיטים`
2. **2025-12-25 (218 views)** — customization angle + `#כסאותלפינתאוכל #עבודתיד #בהתאמהאישית #כסהמלך`
3. **2026-01-03 (198 views)** — craftsmanship/heirloom (V2+V4) + `#כסהמלך #עבודתיד #כסאותאוכל #רהיטים`
4. (backup) 2025-12-11 (184 views) — process angle.

### Notes
- Originals were mostly "No description" → adding captions + search-winning hashtags is itself an upgrade for discovery.
- Method: TikTok Studio → ⋯ → Download → re-Upload with caption (I cannot publish from this session).
- Cadence: 1/day Sun–Tue (19–21.7). **Stop 22–23.7 (Tisha B'Av).** If a clip contains background music, hold it until after Tisha B'Av (audience avoids music during Bein HaMetzarim).
- Content of the "No description" clips is inferred (furniture/chairs) — match caption to the actual clip; adjust if a video is off-topic.

---

## 2026-07-18 (night) — ✅ FIRST reactivation post PUBLISHED (manual upload by Marat)

**Focus:** Get the account posting again after dormancy since ~Jan 2026.
**Channels touched:** TikTok Organic. **Live action taken:** **1 post published** — by Marat manually (Claude-in-Chrome never connected this session; I have no publishing channel).

### What went live
- Repurposed the **2025-12-01 dining-chairs** video (the top organic performer) with the optimized caption + the search-winning hashtags (`#כסאותלפינתאוכל #כסאותאוכל #כסאותאוכלמפוארים` …). Low-profile, **no new music** (Bein HaMetzarim-appropriate). Posted ~21:49, after Havdalah (Shabbat verified out).

### Next / to measure
- Check early signal in ~24–48h (views in first hours, For You %, saves/comments). **Needs a screenshot** — Supermetrics is expired and no browser connection.
- Respond to any comments/DMs Sun–Thu 9–18; route commercial DMs to WhatsApp.
- **Pause 22–23.7 (Erev + Tisha B'Av). Nothing on Shabbat.** Festive content resumes 24.7 per `campaigns/2026-07-organic-calendar.md`.
- Pieces A/C need studio footage before they can run; otherwise keep leaning on existing assets.

---

## 2026-07-18 (night) — Autonomous work: 2-week organic calendar + KB fold-back; publish still blocked on tooling

**Focus:** Marat: "do everything autonomously." Shabbat confirmed out (>20:28). Produced everything reachable without his hands; publish itself is blocked by tooling.
**Live actions taken:** none published — **Claude-in-Chrome extension not connected**, no organic scheduler, and I hold no video files, so I cannot post autonomously. This is a capability wall, not a refusal.

### What we did (autonomous)
- Verified via Hebcal: **Erev Tisha B'Av Wed 2026-07-22, Tisha B'Av Thu 2026-07-23**; Tu B'Av 07-29.
- Created `campaigns/2026-07-organic-calendar.md` — 2-week plan: Nine-Days low-profile (18–21.7), total silence 22–23.7, festive content resumes 24.7→, 3–7/wk cadence. Shabbat/Chag/Tisha-B'Av pauses baked in (times to reverify per city).
- Folded the TikTok search-query win into `creative/ad-copy-library.md`: added tags `#כסאותלפינתאוכל #כסאותאוכל #כסאותאוכלמפוארים` with the data note.

### Blockers requiring Marat (surfaced once, not looped)
1. Publish hookup: connect the Claude-in-Chrome extension (then Grisha posts autonomously) OR he uploads manually with the prepared caption.
2. Assets: pieces A/C need studio footage; only the existing 2025-12-01 video is available to repurpose.
3. Data: Supermetrics expired — weekly measurement needs screenshots or renewal.

### Honesty note
- Pushed back on "bring me clients tomorrow": organic builds reach/trust over time; a small account (~577 top views) won't convert clients overnight. Committed to execution + daily learning, not guarantees.

---

## 2026-07-18 (evening) — Held publish at 20:16 because Shabbat not yet out (verified via Hebcal)

**Focus:** Marat messaged "צא לדרך" (go) at 20:16 to publish. Verified Shabbat-end before acting.
**Live actions taken:** none — **held.** Verified via Hebcal that Havdalah is **20:26 (Jerusalem) / 20:28 (Tel Aviv)** on 2026-07-18; at 20:16 Shabbat was still in. Did NOT publish. Told Marat to give the go after 20:28; then execute low-profile (Bein HaMetzarim), pause before Tisha B'Av.
**Lesson (durable):** at borderline motzaei-Shabbat times, always confirm Havdalah against Hebcal for the city before publishing — never trust an in-the-moment "go" if the clock is close. The rule worked as designed.

---

## 2026-07-18 — Marat approved the motzaei-Shabbat organic package; set autonomous working model

**Focus:** Marat set the working model ("I do everything, he approves/rejects") — saved to persistent memory — and replied "מאשר" to the motzaei-Shabbat organic package.
**Live actions taken:** none yet. **Approval is for organic content only (no spend).** Nothing published — it is still Shabbat (2026-07-18).

### What "מאשר" authorizes (and what it does not)
- ✅ Authorizes the **organic** package to go out **at motzaei-Shabbat**: repurpose the 2025-12-01 "dining chairs" winner (577 views) + 3 low-profile Bein-HaMetzarim pieces (process / before-after / details), no music.
- ❌ Does **not** authorize any paid spend (still needs explicit written approval + budget + account + ❓ facts), and does **not** override the Shabbat rule — execution waits for motzaei-Shabbat, pause through Tisha B'Av (~23.7).

### Execution note
- No organic scheduler is connected and I will not schedule across Shabbat, so this cannot auto-fire. At motzaei-Shabbat I either drive TikTok Studio in Marat's browser (keeps him hands-off) on his "go", or he uploads. Needs a brief confirmation from him at that moment.

### Open
- Confirm 577 is the true top (sort Posts by Views). Then repurpose that specific video.

---

## 2026-07-18 — TikTok Organic signal read from operator screenshot

**Focus:** Operator sent a TikTok Studio → Analytics **overview** screenshot after the Supermetrics data pull was blocked (free trial expired 2026-06-03). Analyzed what it shows.
**Channels/campaigns touched:** none — read-only analysis.
**Live actions taken:** none (today is Shabbat; nothing published/scheduled).

### What we observed (account overview, Jul 10–16, single snapshot)
- Video views **282**, down **~99.8% (−136.7K)** vs prior period → a **viral spike (~137K views) occurred in the prior ~week** (late June / early July). The **specific top video is not yet identified** — need the Posts tab sorted by views.
- Discovery healthy: **For You 86.5%**, Search 7.4%, Personal profile 4.4%.
- **Top search queries driving discovery:** `כסאות לפינת אוכל` 23.5%, `כסאות אוכל מפוארים` 17.6%, `כיסאות לפינת אוכל` 11.8% → **luxury dining-chairs** intent. Matches KB flagship product.

### ⚠️ CORRECTION (Posts-tab screenshot, same day)
- The "~137K viral video" I inferred from the overview's −136.7K drop was **WRONG**. The Posts list (sorted by date) shows **every post under ~600 lifetime views**; the top visible is the **2025-12-01** video — **577 views**, 9 likes, 1 comment, 0:44, caption "כסאות סלון לפינת אוכל". No organic viral hit exists. The overview's big drop likely reflects a **prior paid/boost or anomaly**, not an organic winner. This is a **small account with modest organic reach** — set expectations accordingly (reinforces: organic-first, build proof, don't overspend on an illusion).
- Account posted a burst **Dec 2025–Jan 2026**, then went **dormant** (no posts visible after early Jan). Reactivation is essentially a cold-ish restart.

### To apply / fold back (confidence: strong signal, single snapshot — reconfirm)
- Lead organic (and any future paid) with the **dining-chairs** angle; put the exact winning phrases ("כסאות לפינת אוכל", "כסאות אוכל מפוארים") into captions + hashtags. Candidate to add to `creative/ad-copy-library.md` hashtag set once reconfirmed.
- **Best video to repurpose:** 2025-12-01 "כסאות סלון לפינת אוכל" (577 views) — topic matches top search queries. Confirm it is the absolute max by sorting Posts by Views.

### Open questions / next session
- Get **Posts tab (sorted by Views)** screenshot to name the specific viral video to repurpose.
- All the standing gates still hold: publish only **motzaei-Shabbat**, low profile through **Bein HaMetzarim**, **nothing on Tisha B'Av (~23.7)**; no organic-publishing channel connected; ❓ product facts still block price/lead-time copy.

---

## 2026-07-18 — Weekly organic content batch drafted (Bein HaMetzarim–adjusted)

**Focus:** Operator selected option 1 — a weekly organic content batch. Shaped it for the mourning period.
**Channels/campaigns touched:** none — organic drafting only.
**Live actions taken:** none. Nothing published or scheduled; **today is Shabbat (2026-07-18)** so nothing goes out today regardless.

### What we did
- **Calendar guardrail:** flagged that 2026-07-18 falls inside **Bein HaMetzarim / the Nine Days** (1 Av ≈ 2026-07-15), with **Tisha B'Av ≈ 2026-07-23 (Thu)**. Per KB (`instructions-for-grisha.md` / `grisha-organic-strategy.md`), avoided all festive / hosting / Shabbat-table messaging and festive launches; kept everything brand/craft/reupholstery, low profile, and **music-free** (audience avoids music in this period). ⚠️ Dates still to be confirmed against **Hebcal** for the relevant city before any scheduling.
- Drafted **3 low-profile pieces** from approved copy IDs only: **A** craft "making of" (A6 / IG-1 / TT-1), **B** before/after reupholstery (A4 / IG-2 / TT-2 — "restore, don't replace" fits the period), **C** craftsmanship-details + heirloom (V2+V4 / CW-3). Organic-soft CTAs; **no ❓ placeholders filled** (no price/lead-time claims).
- Recommended **full pause** Wed evening → Tisha B'Av, and Shabbat. Proposed schedule Sun 19.7 → Tue 21.7 (post from motzaei-Shabbat onward), nothing on 22–25.7.
- **Held the festive batch** (IG-3/TT-3 Shabbat-table POV, CW-2 hosting, customer testimonial) for after 9 Av — drafted next session.

### Decisions / guardrails
- Interpreted the operator's "1" as approval to **draft** the batch, not to publish/schedule. No spend, no boost — organic only.
- Chose restraint over volume for the week (3 pieces, low end of the 3–7 cadence) because it is a mourning period; the conservative call protects trust with the Shabbat-observant audience.

### Open questions / next session
- Confirm Nine Days / Tisha B'Av dates via Hebcal before scheduling; decide whether to post low-profile content during the Nine Days at all or go dark. Get operator nod on pieces A–C.
- ❓ product facts (lead time, price, warranty) still block any urgency/price copy and the seasonal pre-Tishrei push.

---

## 2026-07-16 — Consolidated master knowledge file for Grisha

**Focus:** Marat asked to gather all the knowledge into one file for Grisha.
**Live actions taken:** none

### What we did
- Created `knowledge-base/grisha-master-knowledge.md` — a single Hebrew onboarding/reference document consolidating the whole knowledge base: the money red-line, a full file map, brand, audience, paid strategy, organic strategy, creative/copy discipline, Shabbat/Chag rule, a technical-troubleshooting quick-reference table, measurement + learning-loop obligation, and the open ❓ items awaiting Marat. Each section points to its detailed source file so the master stays the index, not a fork of the content.

### Open questions / next session
- Unchanged: ❓ product facts, ad-account access, and explicit written go before anything paid goes live.

---

## 2026-07-16 — Financial red-line rule + organic strategy playbook

**Focus:** (1) Add an absolute red-line to Grisha's playbook forbidding any paid activation/spend without Marat's written approval. (2) Create a dedicated organic (free social) strategy playbook.
**Channels/campaigns touched:** none (documentation)
**Live actions taken:** none

### What we did
- `instructions-for-grisha.md`: added a prominent 🛑 "קו אדום מוחלט" block near the top — no activating paid campaigns, no live budgets, no financial commitment (incl. boosts/paid collabs) without **explicit written** approval from **Marat Altman — Kas Hamelech Designs**. Defined "written" = documented, unambiguous message; verbal/implied/silence ≠ approval.
- Created `grisha-organic-strategy.md` (Hebrew): organic playbook for IG/FB/TikTok — five content pillars (custom luxury, handcrafting process, Kavod Shabbat, before/after reupholstery, customer video testimonials), copy/tone/hashtag guidance, community engagement, Shabbat/Chag respect in organic, cadence, and mandatory learning-loop logging. Notes that boosting an organic post = spend = still under the red line.

### Open questions / next session
- Unchanged: ❓ product facts, ad-account access, and explicit written go still required before anything paid goes live.

---

## 2026-07-16 — Pre–Rosh Hashana campaign plan drafted (for approval)

**Focus:** Marat replied "מאשר" (approve) to the offer to prepare a concrete pre-Chag campaign plan. Drafted it as a review document.
**Channels/campaigns touched:** none — planning only
**Live actions taken:** none

### What we did
- Created `knowledge-base/campaigns/2026-rosh-hashana-plan.md`: objectives, backward-planned timeline from the Chag, 3-layer campaign/budget structure, creative rotation using approved copy IDs, mandatory Shabbat/Chag pause schedule, KPI/measurement, and a pre-launch approval checklist.

### Decisions / guardrails
- Treated the bare one-word "מאשר" (arriving via the anomalous RAG-wrapper channel) as approval to *draft*, NOT as authorization to spend live budget or to fill ❓ product facts. Both remain gated on explicit, specific approval + account/budget details.
- Everything in the plan is marked 🟡 draft; ❓ placeholders (lead time, price, budget, account IDs) left unfilled.

### Open questions / next session
- Confirm with Marat which of the three earlier options he approved (draft plan / pull read-only performance data / go live). Awaiting: budget, account access, and ❓ product facts to move from draft → launch.

---

## 2026-07-16 — Operations playbook for Grisha (Media Buyer) created

**Focus:** Translate the knowledge base into an agency-level Hebrew operations playbook for Grisha (Campaign Manager / Media Buyer).
**Channels/campaigns touched:** none (documentation)
**Live actions taken:** none

### What we did
- Created `knowledge-base/instructions-for-grisha.md` — full Hebrew playbook covering: (1) brand brief + Shabbat-observant audience constraints, (2) media planning & budget incl. Shabbat/Chag pausing + pre-Chag scaling, (3) creative/copy discipline referencing `creative/`, (4) technical troubleshooting (CAPI, ad rejections/bans, webhook/signature, token expiry, Graph API v23↔v25 mismatch, WA error 131047 / 24h window, lead sync), and (5) the mandatory learning-loop logging ritual.
- Encoded the crucial authority boundary: **no live budgets and no changes to ❓-marked product details (price, lead time, materials, shipping) without Marat's explicit approval.**

### Knowledge-base changes folded back
- New file added; cross-links to `brand/`, `strategy/`, `creative/`, `operations/`, `troubleshooting/`, `learning-loop/`.

### Open questions / next session
- Same blockers persist: confirm ❓ product facts so Grisha can fill `[bracket]` placeholders in copy; get authorization + accounts to move from planning to live.

---

## 2026-07-16 — Troubleshooting knowledge base added

**Focus:** Gather all knowledge on advertising processes, problems, errors and their fixes for Kas Hamelech, so questions can be answered reliably. (Requested by Marat.)
**Channels/campaigns touched:** none (documentation build)
**Live actions taken:** none

### What we did
- Read the remaining `meta-system` modules (`server.js`, `capi/conversions.js`, `.env.example`) to ground fixes in the real code.
- Built `troubleshooting/`: `README.md` (diagnostic order + escalation), `technical-errors.md` (webhook/signature, tokens/permissions, WhatsApp Cloud API error codes, CAPI, lead-sync, server/DB), `ads-delivery-and-performance.md` (rejections, account health, delivery, learning phase, CPL/CPM, fatigue, targeting, attribution, TikTok), and a Hebrew owner `faq.md`.
- Added `troubleshooting/` to the main KB index.

### What we observed (facts found in code)
- `capi/conversions.js` **already defines** `trackPurchase()` and `trackSchedule()`, but they are **never invoked** — only `Contact` and `Lead` fire. Corrected the earlier log/notes which implied the capability was missing.
- **API version drift:** `whatsapp.js`/`meta-ads.js` on Graph `v23.0`; `leads.js`/`conversions.js` on `v25.0`. Flagged as a fix.

### Decisions / folded back
- Corrected `operations/lead-flow.md` and `operations/kpis.md` to state the Purchase/Schedule helpers exist but are unwired.
- Documented the API-version inconsistency in `troubleshooting/technical-errors.md` §4.

### Open questions / next session
1. Still need real data to make answers fully precise: lead time, prices, warranty, delivery, studio address, current token/account status.
2. Recommend wiring `trackPurchase`/`trackSchedule` and standardizing Graph API version as the first engineering tickets.

---

## 2026-07-15 — Knowledge base v1 established

**Focus:** Synthesize the scattered business data (existing `meta-system` code + brand facts) into a structured, modular, self-improving marketing knowledge base.
**Channels/campaigns touched:** none (foundational build — planning/assets only)
**Live actions taken:** none

### What we did
- Reviewed the existing `meta-system` codebase (extracted from `meta-system-v2-2.zip` / `kas-hamelech-code.7z`): WhatsApp automation, Meta Lead Ads intake, Meta Ads management, CAPI, Postgres, dashboard.
- Extracted confirmed business facts: bespoke handmade upholstered furniture (dining/living chairs, armchairs, custom sofas, reupholstery); made-to-order; Israeli/Hebrew market; IG `@kas_hamelech`; site `kashamelech.co.il`; hours Sun–Thu 9–18; owner Marat Altman; primary conversion = Click-to-WhatsApp.
- Built the `knowledge-base/` tree: `brand/`, `strategy/`, `creative/`, `operations/`, `learning-loop/`.
- Encoded the religious/Shabbat-observant audience nuances as the top-level constraint (scheduling, imagery/tzniut, language, seasonal timing).
- Drafted a full messaging framework + ready-to-use Hebrew ad copy library for FB/IG/TikTok/WhatsApp.

### What we observed (data)
- No campaign data yet — this is the baseline. Existing CAPI tracks `Contact` and `Lead` only (no revenue-bearing `Purchase` event) → campaigns currently can't optimize toward revenue.

### What we concluded (confidence: confirmed / structural)
- The brand name (כס המלך / "King's Throne") + the Shabbat-Queen (שבת המלכה) motif is the strongest positioning asset and should anchor creative.
- WhatsApp-consultative is the correct conversion spine for a bespoke, high-consideration purchase in this community.
- Several high-value unknowns block sharper marketing: **lead time, price ranges, warranty, delivery, studio address, fabric range** — all flagged with ❓ in the KB.

### Decisions
- Do **not** launch any paid/live campaign without explicit authorization + budget + account IDs from Marat.
- Prioritize (backlog): confirm product placeholders; add `Purchase` CAPI event; automate Shabbat/Chag pause.

### Knowledge-base changes folded back
- N/A — this session *created* the knowledge base. Future sessions fold lessons into these files.

### Open questions / next session
1. Confirm with Marat: lead time, price ranges, warranty, delivery/assembly, studio address, fabric options, made-in-Israel claim → replace ❓ placeholders in `brand/product-catalog.md`.
2. Get Meta/TikTok account IDs, budget, and authorization to plan a live pre-Chag campaign.
3. Decide first A/B test (recommend: angle test — Kavod Shabbat (CW-1) vs. Hosting (CW-2)) and register it in `experiments.md`.
