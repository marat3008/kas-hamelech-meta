# 🔁 Learning Log

Append-only. Most-recent entry on top. Use `session-template.md` for the format. See `README.md` for the loop.

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
