# Ads Delivery & Performance Problems — Symptom → Cause → Fix

Business-side advertising problems on Meta (Facebook/Instagram) and TikTok: rejections, account restrictions, delivery, learning phase, cost spikes, fatigue, and audience issues. Pair with `../strategy/campaign-strategy.md` and `../operations/kpis.md`.

---

## 1. Approvals, policy & account health

| Symptom | Likely cause | Fix |
|---|---|---|
| Ad **rejected** ("does not comply") | Policy issue: unverified claims, "before/after" personal-attributes rules, restricted wording, low-quality assets, landing mismatch | Read the exact policy reason in Ads Manager. Edit & resubmit, or **request review/appeal**. For furniture, before/after is generally fine — keep claims factual (avoid "guaranteed"). |
| Whole **ad account disabled / restricted** | Payment issue, policy strikes, sudden behavior change, unverified business | Go to **Account Quality** → request review. Verify the business. Don't create a second account to evade — that compounds the ban. Escalate to Marat immediately (revenue-blocking). |
| **Page/Business** restricted | Repeated policy violations / impersonation flags | Account Quality appeal; ensure Page info is accurate and consistent with the site. |
| Special ad category warning | Furniture is **not** a special category (housing/credit/employment/politics) | Leave `special_ad_categories: []` (as in `ads/meta-ads.js`). Only set it if legally required. |
| WhatsApp/Click-to-WhatsApp ad disapproved | Number not connected, or messaging policy | Confirm the WhatsApp number is linked to the Page/asset and messaging is set up. |

---

## 2. Delivery: "not spending / not delivering"

| Symptom | Likely cause | Fix |
|---|---|---|
| Ad set spends ₪0 / barely delivers | **Audience too small**, bid/budget too low, still "In review", or scheduled off | Widen audience; ensure it's Active & approved; check schedule (did a Shabbat/Chag pause not reactivate?); raise budget above the learning threshold. |
| "Learning Limited" | Ad set can't get **~50 optimization events/week** | **Consolidate** ad sets/budgets; broaden audience; use a higher-volume event (optimize for `Contact`/`Lead`, not a rare event); avoid frequent edits (each significant edit **resets learning**). |
| Delivery collapses after an edit | Any significant edit re-enters **learning phase** | Batch edits; avoid tweaking winners mid-flight; duplicate to test instead of editing the original. |
| Nothing delivers right after launch | Still in review (can take hours) | Wait; launch **well before** a Chag deadline, not the night before. |
| Suddenly no delivery Friday/holiday | Correct behavior **if** the Shabbat/Chag pause fired | Confirm it's the intended pause; reactivate after (see `../strategy/annual-calendar-jewish.md`). |

---

## 3. Cost problems (CPM / CPC / CPL too high)

| Symptom | Likely cause | Fix |
|---|---|---|
| **CPM** rising | Auction competition (esp. pre-Chag high season), narrow audience, low ad quality/relevance | Improve creative (raises relevance → lowers CPM); broaden audience; expect higher CPM in peak season — budget for it. |
| **CTR low / CPC high** | Weak hook, wrong audience, tired creative | New hook/first-second; test angles (`../creative/messaging-framework.md`); refresh creative. |
| **Cost per conversation / CPL** too high | Weak offer, friction after click, poor targeting, optimizing wrong event | Test offers (studio visit vs quote); speed up first WhatsApp reply; retarget warm audiences (cheaper); ensure CAPI events fire so optimization has signal. |
| Cheap leads that **never close** | Optimizing for volume over quality; wrong audience; bargain-seekers | Add qualifying questions; exclude bargain intent; **read CPL together with close rate** — a slightly higher CPL that closes is cheaper. Never lead with discounts (attracts wrong buyer). |
| Results great then decay | **Creative fatigue** (frequency ↑, CTR ↓) | Rotate 3–5 creatives; refresh weekly; frequency > ~3–4 = refresh. |

---

## 4. Targeting & audience problems

| Symptom | Likely cause | Fix |
|---|---|---|
| Reaching the wrong people (secular / out-of-market) | Broad interest targeting without refinement | Layer Hebrew-language + relevant interests (interior design, Judaica, hosting, homeowners); refine geo to observant-heavy areas as data allows. |
| Lookalikes weak/unavailable | Seed audience too small | Build seed from real purchasers/high-value leads first; needs a few hundred quality records. Early on, use interest targeting + engagement audiences. |
| Retargeting not delivering | Audiences too small early on | Build them first via awareness spend (video viewers, engagers); retarget once sizeable. |
| Re-prospecting existing leads | No exclusions | Exclude `Contact`/`Lead`/customer audiences from prospecting; nurture them separately (reupholstery/upsell). |
| Haredi-segment ads underperform on TikTok | Channel mismatch | Weight Haredi to WhatsApp/Facebook + word-of-mouth; keep TikTok for Dati Leumi/awareness (see `../strategy/channels-fb-ig-tiktok.md`). |

---

## 5. Measurement & attribution confusion

| Symptom | Likely cause | Fix |
|---|---|---|
| "Ads look unprofitable" but sales are up | Optimizing on conversations, not revenue; word-of-mouth conversions credited as organic | Wire `Purchase` CAPI (see `technical-errors.md` §4); don't under-credit awareness in a referral-driven community. |
| iOS / signal loss undercounts | Browser-only pixel | Server-side **CAPI** already helps; keep events firing with good match data (hashed phone/email, `fbc`/`fbp`). |
| Daily numbers look erratic | Shabbat/Chag pauses skew daily averages | Compare like-for-like periods; judge on ROAS over a full cycle, not one day. |

---

## 6. TikTok-specific

| Symptom | Fix |
|---|---|
| Ad rejected | TikTok has stricter music/claims rules; use licensed/commercial audio, factual claims, native vertical format. |
| Low results converting | Keep TikTok as **awareness**; convert on Meta/WhatsApp. Use Spark Ads on best organic clips. |
| Content feels off-brand/immodest | Enforce tzniut + dignity; process/before-after content performs and stays on-brand. |

---

## Quick triage flow

```
Rejected?      → policy reason → edit/appeal (§1)
Not spending?  → approved? audience size? paused? learning? (§2)
Too expensive? → creative? offer? audience? event signal? (§3)
Wrong people?  → targeting layers + exclusions (§4)
"Not working"? → check measurement before killing it (§5)
```

Log every new incident + fix back into this file and `../learning-loop/LEARNING_LOG.md`.
