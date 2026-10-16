# SEO module (offline foundation)

Isolated from the Meta Ads/lead system (`server.js`, `meta-system-v2-2.zip`) — nothing
here is imported by or wired into that app. No live provider/network calls, no
installs beyond Node built-ins (`node:test`, `node:assert`).

## Implemented (offline, unit-tested)
- `lib/hebrewNormalize.js` — NFC + whitespace/punctuation normalization, preserving
  word order and distinct queries (location/intent not collapsed).
- `lib/priceParser.js` — Israeli price parsing (₪ / ש"ח, comma vs. ambiguous dot
  thousands grouping). Returns `ambiguous`/`null` instead of guessing.
- `lib/capabilityRegistry.js` — versioned provider capability registry. Empty by
  design: no SEO provider has been selected/verified. Unsupported ≠ absent/zero.
- `lib/scoring.js` — `opp-v1`, `priority-v1`, `omni-v1`, `sov-v1` formulas: versioned,
  deterministic, missing components excluded with coverage-gated `null` fallback.
- `lib/runGovernor.js` — budget reservation/settlement. **Prototype only**: in-memory,
  single-process, not durable or atomic across workers.
- `lib/competitorDiscovery.js` — candidate threshold (≥3 observations, ≥2 distinct
  queries, ≥2 distinct dates within 30 days) so one SERP appearance ≠ a competitor.
- `knowledge/seed-queries.json` + `lib/seedQueries.js` — the only real first-party
  search signal currently on file: TikTok Studio's own search-traffic breakdown
  (26.9% of traffic from search; top phrases below), read live via Claude-in-Chrome
  on 2026-07-19 and logged in `knowledge-base/learning-loop/LEARNING_LOG.md` /
  `grisha-memory.md`. Tagged `sourceType: observed` — it's platform analytics, not
  Google/Ahrefs SERP data, so don't treat it as such.

Run: `npm test` (`node --test` — default recursive `*.test.js` discovery; `node --test seo/__tests__` fails to resolve the directory on this Windows/Node v26 setup, so don't use that form).

## SEO data provider status (checked live, 2026-10-08)
A real Ahrefs API v3 MCP connector **is** connected this session (auth works, its
OpenAPI docs were fetched live). But every endpoint tried — `site-explorer-domain-rating`,
`site-explorer-organic-keywords`, and even the ones Ahrefs documents as free/unit-less
(`public-domain-rating-free`, `subscription-info-limits-and-usage`) — returned
`{"error":"Insufficient plan"}` for `kingchairs.co.il`. Recorded in
`lib/capabilityRegistry.js` as `ahrefs` → `unsupported` / `insufficient_plan` with the
exact evidence, so this isn't re-probed blindly next time. **To unblock:** the
Ahrefs account tied to this connector needs a plan upgrade (or a different SEO
provider needs to be selected) — that's a billing decision only the owner can make.

## Free-first competitor scanning (added — zero paid dependency)
Core principle: **the agent must work for free.** No paid provider is a required
dependency; `lib/providers.js` reports paid adapters (e.g. `ahrefs`) as
`available:false` without disabling the free ones. Built entirely on Node
built-ins (`http`/`https`/`dns`/`net`/`fs`/`crypto`) — no new npm installs.
- `lib/ssrfGuard.js` — blocks loopback/private/link-local/metadata/multicast
  addresses and IP literals; rejects non-http(s) schemes and embedded credentials.
- `lib/safeFetch.js` — SSRF-safe GET built on `ssrfGuard`: re-resolves DNS and
  re-validates on every redirect hop, caps redirects, rejects https→http
  downgrade, caps response size/time. DNS resolution and the HTTP transport are
  dependency-injected so tests exercise the logic without any live network call.
- `lib/robotsPolicy.js` — parses robots.txt groups/Disallow/Allow/Crawl-delay;
  longest-match wins; empty `Disallow:` correctly means allow-all, not block-all.
- `lib/sitemapDiscovery.js` — extracts `<loc>` entries from a sitemap XML string
  and `Sitemap:` directives from robots.txt.
- `lib/htmlSignals.js` — regex-based (not a full HTML parser) extraction of
  title, meta description, robots meta, canonical, OpenGraph, H1/H2, and
  JSON-LD (malformed JSON-LD blocks are skipped, not fatal).
- `lib/snapshotStore.js` — flat-file JSON history per target URL. **Prototype**,
  like `runGovernor`: no locking, single-process only.
- `lib/snapshotDiff.js` — compares two signal snapshots; a first observation is
  a `baseline`, not a "change."
- `lib/changeAlerts.js` — turns a diff into severity-tagged alerts (title/canonical/
  robots = high; description/JSON-LD/H1 = medium; H2/OpenGraph = low).
- `lib/keywordCandidates.js` — free keyword-candidate extraction from a page's own
  title/description/headings (Hebrew-normalized, stopword-filtered) — not search
  volume or rankings, just on-page term frequency.
- `lib/report.js` — assembles signals + diff + alerts + scores into one report object.
- `lib/providers.js` — the free/paid provider status directory
  (`{name, available, free, reason}`), merging the always-on free list with
  whatever `capabilityRegistry` has verified about paid adapters.

## Scheduler (added — `node-cron`, local disk storage)
Owner decision: use `node-cron` for scheduling, persist data on this machine
(not a cloud service). Added `node-cron` as a real `dependencies` entry in the
repo's `package.json` (ran `npm install node-cron`, created `package-lock.json`;
both are new, nothing existing was touched).
- `lib/scheduler.js` — `scanTarget` (fetch → signals → diff → alert → persist,
  for one URL; never throws on a single target's failure), `runScanJob` (loops
  targets, keeps going past individual failures), `startScheduler` (wraps
  `node-cron`; the cron library and the scan function are both injectable, so
  the tests capture the scheduled callback and invoke it manually instead of
  registering a real timer — no sleeping/flaky tests).
- `run-scheduler.js` — the actual runnable entry point: `npm run seo:schedule`.
  Reads target URLs from `seo/config/targets.json` (starts empty — **no
  competitor URLs are invented here**; add them once they're identified, e.g.
  via `lib/competitorDiscovery.js`). Logs a clear message and exits if that
  list is empty, rather than starting a cron job with nothing to scan. Cron
  expression via `SEO_SCAN_CRON` env var, default `0 6 * * *` (daily, 06:00).
- Snapshots land in `seo/data/snapshots/` on disk (gitignored — scraped data,
  not source) via the existing `lib/snapshotStore.js`.
- `npm audit` flagged 1 pre-existing high-severity advisory in `nodemailer`
  (part of the unrelated Meta Ads system's dependency tree, not introduced by
  `node-cron`). Left untouched — out of scope for the isolated SEO module, and
  fixing it requires a breaking nodemailer upgrade that could affect the Meta
  system's email sending. Flagging it for a separate decision.

## Designer/competitor watchlist (added — separate metadata store, same scanner)
`lib/designerWatchlist.js` + `config/designers.json`: a structured record per
designer/competitor (`classification`, `priority`, `verificationStatus`,
`evidence[]`, `sourceUrls[]`, `social`), dedup'd by **name OR canonical URL**
(`upsertDesigner` — pure, unit-tested) so re-adding never creates a duplicate
or silently downgrades a field a later partial update didn't supply. This is
metadata, not a second scanner: a designer's `canonicalWebsite` is also added
to `config/targets.json` so the existing free website-change pipeline
(`safeFetch` → `htmlSignals` → `snapshotDiff` → `changeAlerts`) covers it too.

**Classification policy:** `HAREDI_CORE` / `HAREDI_RELEVANT` / `HAREDI_INSTITUTIONAL`
are assigned only on **explicit public self-presentation** (the business's own
site says so), never inferred from a name, appearance, or location. Current
entries, both independently confirmed by fetching the live site myself before
writing `VERIFIED` (not taken on request text alone):
- אלישבע קובי (`elishevakobi.co.il`) — `HAREDI_CORE`: an image `alt` attribute on
  her own site reads "עיצוב פנים חרדית | אדריכלות חרדית".
- ריקי גרוזמן (`rikigruzman.co.il`) — `HAREDI_INSTITUTIONAL`: her own site's
  title/meta description state she specializes in "אדריכלות ועיצוב פנים לבתי
  כנסת, ישיבות ומבני ציבור" (synagogues, yeshivas, public buildings).

**Not implemented for designers specifically:** Instagram/Facebook/TikTok/Google
public-presence monitoring — no free, credential-free, ToS-compliant way to pull
that exists yet (it would need each platform's official API and app review, or
a paid aggregator). Only the website-change signal is live today.

**Bug fixed 2026-10-09:** dedup originally matched on name OR canonical URL,
which would silently merge two different people into one record if they shared
a studio site (losing the second person's name). Fixed to match on name only;
`social`/`sourceUrls` stay per-person even when `canonicalWebsite` is identical.

**Batch add 2026-10-09:** 98 more designers added as `UNCLASSIFIED`/`UNVERIFIED`
(a general Israeli-interior-designer list, no Haredi-relevance claim attached —
the classification rule above still applies: nothing here gets `HAREDI_*`
without explicit public evidence). Of the 100 URLs supplied, I fetched every
one myself first rather than trusting the "I checked" claim in the request:
88 unique domains resolved and loaded fine (2 needed a larger byte cap for a
heavy page — not a real failure), and exactly 2 don't resolve in DNS at all
(איריס מור → `irismor.co.il`, עינת אבני → `einatavni.co.il`) — skipped, not
added, pending a corrected URL. These 98 were **not** added to
`config/targets.json` (the live recurring-scan list) — going from ~8 scan
targets to ~106 is a real jump in scope/resource use that deserves an explicit
yes, not a silent default. They're captured in `designers.json` either way, so
no data is lost by waiting on that decision.

## Incremental designer scanning engine (added — small batches, resumable, locked)
Ported from a TypeScript scaffold you supplied into this repo's existing plain
CommonJS style (no TypeScript toolchain added — consistent with the original
build prompt's "don't force TypeScript on this repo" rule).
- `lib/designerScanState.js` — pure: `designerKey` (id → site hostname,
  www-stripped → normalized name), `indexDesigners` (dedupes by that key,
  skips unidentifiable rows instead of throwing), `selectEligible`
  (pending/in_progress/under-attempt-limit-failed; excludes completed and
  exhausted failures).
- `lib/scanStateStore.js` — pure I/O: `saveStateAtomic` (temp file + rename,
  so a crash mid-write can't corrupt the state file), `acquireLock`/`releaseLock`
  (exclusive-create lockfile — a second concurrent run exits immediately
  instead of double-reserving a batch; verified for real, not just unit-tested).
- `run-designer-scan.js` — the runnable entry point (`npm run seo:scan-designers`).
  Reuses the **existing** scan function (`scanTarget` from `lib/scheduler.js`)
  and the **existing** storage (`SnapshotStore` writing into `data/snapshots/`)
  — no second scanning engine, no simulated results. Reserves a batch (status
  → `in_progress`, persisted) *before* scanning anything, then persists each
  designer's real outcome (`completed` or `failed` + `lastError`) immediately
  after that designer's real scan — never marks done speculatively.
  State lives in `data/designer-scan-state.json` (gitignored, like the snapshots).

Ran it for real against the actual 100-designer watchlist: batch 1 scanned 3
designers (all new baselines), batch 2 advanced to the next 3 (not a repeat),
and a held lock file correctly made a third concurrent attempt exit immediately.
94 unique scan keys from 100 watchlist records — a few pairs of co-founders
share one studio URL, so they collapse to one scan key (no point fetching the
same page twice), though each still has their own separate `designers.json` entry.

## Scheduler hardening — normalization, staleness, caching, concurrency (2026-10-09)
Closed the gaps from the free-first/token-optimized master task, without a second
scanning system, a new database, or TypeScript:
- `lib/urlCanonical.js` — strips tracking params (`utm_*`, `fbclid`, `gclid`, ...),
  fragments, `www.`, and trailing-slash differences for *comparing* scan targets.
  **Not** used to re-key existing scan state or SnapshotStore entries — 72 of the
  94 real designer URLs have a `www.` prefix, so re-keying on it would have
  orphaned already-completed scan history. It's used only in the new,
  read-only `buildScanTargetAssociations`.
- `designerScanState.js` additions: `buildScanTargetAssociations` (which
  designer names share a scan key — read-only, doesn't change how state is
  keyed), `selectEligible` now also reselects a `completed` target once it's
  older than `cacheTtlMs` (default 24h) — **this was the most important gap**:
  previously a completed target was never rescanned, so there was no ongoing
  monitoring at all. `startNewCampaign` resets every key to pending under a
  fresh campaignId without touching snapshot history (opt-in only).
- `safeFetch.js` + `scheduler.js`: conditional requests — `scanTarget` sends
  `If-None-Match`/`If-Modified-Since` from the last stored snapshot's
  etag/lastModified; a `304` reuses the previous signals instead of being
  mis-read as "everything changed to empty." **Verified against real sites**:
  of the first 6 freshly-scanned designers, `ronapistol.com` sends an ETag and
  `dordesign.co.il` sends Last-Modified (both honored); the rest send neither,
  so they fall back to a normal full fetch + content-hash diff — real-world
  savings exist but aren't universal, and I'm not claiming otherwise.
- `run-designer-scan.js`: bounded concurrency (`SEO_DESIGNER_CONCURRENCY`,
  default 2), in-run retry with backoff for transient failures only
  (`SEO_DESIGNER_RETRY_LIMIT`, default 3 — dead domains aren't retried, only
  `request_failed`), `SEO_DESIGNER_CACHE_TTL_MS` (default 24h),
  `SEO_DESIGNER_NEW_CAMPAIGN=1` to reset, and shared-target log lines now name
  every designer behind a shared URL.

Ran it for real after these changes: picked up the existing campaign (same
campaignId as before), correctly skipped the 6 already-completed targets
(fresh, not yet past the 24h TTL), and advanced to the next 3.

## Windows launcher + Grisha handoff (2026-10-09)
- `../start-grisha-intelligence.ps1` (repo root) — real Windows launcher. Validates
  `designers.json`/the engine file/Node exist, then runs `seo/run-designer-scan.js`
  (`-Mode once`, default) or loops it every `-IntervalSeconds` (`-Mode continuous`,
  stop via Ctrl+C or by creating `seo/data/STOP`). `-NewCampaign` resets scan
  status without touching snapshot history. **Verified by actually running it**
  twice — first run hit a real PowerShell bug (non-ASCII em-dash broke parsing
  under Windows PowerShell 5.1's default encoding; fixed by using plain `-`),
  second run hit a real bug where node's own console output leaked into the
  function's return value alongside the exit code (fixed with `| Out-Host`).
  Third run: clean, correct exit code, correct batch.
- `lib/grishaHandoff.js` — **important correction**: there is no "Grisha Google
  Ads agent" process or API in this repository (checked: no Google Ads
  integration anywhere in the repo or the knowledge base). Grisha is a Claude
  operating persona defined by `knowledge-base/grisha-master-knowledge.md` /
  `instructions-for-grisha.md` — a markdown knowledge base read each session,
  not code with inputs/outputs to connect to. The real, existing hand-off
  mechanism is therefore: write to that knowledge base. `grishaHandoff.js`
  builds a report (only verified, changed-or-new findings — never a failure,
  never a no-op scan), saves the full JSON to `data/grisha-handoff/<reportId>.json`,
  appends a short Markdown summary to `knowledge-base/intelligence/grisha-intelligence-feed.md`,
  and is idempotent (a reportId already delivered is skipped, not duplicated).
  Wired into `run-designer-scan.js`'s batch flow automatically.
- `npm run agent:intelligence` — alias for `seo:scan-designers` (same engine,
  not a second one), matching the name used in this task.
- `seo/postinstall-first-run.js` + `package.json`'s `"postinstall"` script —
  **by explicit request, `npm install` now runs one real scan batch
  automatically** right after installing. Verified for real: ran `npm install`,
  it scanned 3 more designers and updated the knowledge-base feed, exactly
  like a manual run. Never fails `npm install` itself (catches its own
  errors). Skip on any given install with `SEO_SKIP_POSTINSTALL_SCAN=1` —
  also verified for real.

## Agent-system audit fix (2026-10-16)
- **Bug:** `grishaHandoff.deliverReport` delivered (wrote a JSON file + appended a
  knowledge-base entry for) every batch, including ones with zero findings, because
  `reportId`'s hash basis includes `generatedAt` — so a repeat empty report never
  matched `hasBeenDelivered` and was never skipped. The hourly "Grisha Designer Intel
  Scan" Windows task had been producing a new unique empty report almost every run
  since 2026-10-09: 114 of 154 entries (74%) in `knowledge-base/intelligence/grisha-intelligence-feed.md`
  were "No new or changed competitor/designer signals" noise. Fixed: `deliverReport`
  now returns early (`{delivered:false, reason:'no_findings'}`) without writing anything
  when `findingsCount === 0`. Regression test added; `npm test` is 95/95.
- **Separately found, not fixed here (needs an operator decision, not code):** a second
  Windows Scheduled Task, "Grisha Strategy Engine" (daily 05:00), runs
  `node seo/grisha-strategy-engine.js` — that file does not exist in this repo or its
  git history and the task has been failing (`MODULE_NOT_FOUND`, exit code 1) every day
  since 2026-10-10. Logged in `knowledge-base/learning-loop/LEARNING_LOG.md` (2026-10-16
  entry) rather than touched here, since modifying Task Scheduler is outside this
  module's — and this session's — remit.
- Corrected a stale claim below: `targets.json` is no longer empty (8 URLs, added
  alongside the designer watchlist work below) — kept for history, marked superseded.

## Not implemented — BLOCKED (needs a scope/infra decision, not a provider)
- Durable multi-worker locking/idempotency/resume, migrations/DB-backed storage
  (vs. the flat-file prototype above), anomaly detection/trend baselines, and the
  REST API surface — real infra decisions, not offline code.
- Any *paid* SEO provider's actual data (Ahrefs stays `unsupported`/`insufficient_plan`
  until the account's plan changes) — by design, nothing here depends on it.
- ~~Real competitor target URLs — `seo/config/targets.json` is intentionally empty.~~
  **Superseded 2026-10-16:** it now holds 8 URLs (added with the designer-watchlist
  work above). `lib/runGovernor.js` (budget reservation, fully tested) is still
  unwired into the scanner — dead code unless/until something calls it.

## Owned site
`kingchairs.co.il` — confirmed by the owner 2026-10-08. (An earlier note citing
`kashamelech.co.il` was stale and has been corrected.)
