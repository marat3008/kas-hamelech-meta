# 🔁 Learning Log

Append-only. Most-recent entry on top. Use `session-template.md` for the format. See `README.md` for the loop.

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
