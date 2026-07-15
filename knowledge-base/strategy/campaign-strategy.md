# Campaign Strategy

## Objective & primary conversion

The business already runs on **Click-to-WhatsApp** (Meta objective `MESSAGES`) and **Meta Lead Ads**, feeding a WhatsApp automation + CRM (`meta-system`). That is the right spine, because this audience lives on WhatsApp and the sale is **consultative** (custom fabric, size, price) — it closes in conversation, not in a cart.

**Primary conversion event:** a qualified WhatsApp conversation → studio visit / quote → order.
**Tracked events (via CAPI):** `Contact` (inbound WhatsApp), `Lead` (form submit), and — to be added — `Purchase`/`Quote` when a deal closes, so campaigns optimize toward *revenue*, not just chatter.

## Funnel

```
        AWARENESS                CONSIDERATION              CONVERSION            RETENTION / REFERRAL
   ┌──────────────────┐    ┌──────────────────────┐   ┌──────────────────┐   ┌────────────────────┐
   │ Reels / TikTok   │    │ Carousel: before/    │   │ Click-to-WhatsApp│   │ Post-purchase care │
   │ "the making of"  │ →  │ after, fabric range, │ → │ Lead form        │ → │ Ask for review +   │
   │ craft + Shabbat  │    │ testimonials, studio │   │ Retargeting warm │   │ referral, reuphol- │
   │ table storytelling│   │ visit invite         │   │ audiences        │   │ stery reminder     │
   └──────────────────┘    └──────────────────────┘   └──────────────────┘   └────────────────────┘
```

- **Top (cold):** cheap, high-retention video that teaches and delights — the *craft* and the *Shabbat table story*. Goal: reach + video views + IG/TikTok follows + pixel/engagement audiences.
- **Middle (warm):** proof and reassurance — before/after reupholstery, fabric selection, studio, testimonials. Goal: get the click / start the chat.
- **Bottom (hot):** Click-to-WhatsApp + Lead Ads to people who watched ≥50% of a video, engaged with IG/FB, or visited the site. This is where budget efficiency lives.
- **Retention:** happy customers are the highest-ROI channel in a tight-knit religious community. Systematize reviews & referrals.

## Audiences

**Cold prospecting**
- Geo: Israel; refine to areas with high religious/observant populations as data allows.
- Interest/behavior proxies (Meta): interior design, home décor, Judaica/Jewish holidays, hosting/entertaining, newly engaged/married, homeowners. Layer with Hebrew-language.
- **Lookalikes** from the best source: past purchasers / high-value WhatsApp leads (build once there's enough seed data).

**Warm retargeting**
- Video viewers (25% / 50% / 75%), IG & FB engagers (365d), website visitors, Lead-form openers who didn't submit.
- WhatsApp/CAPI `Contact` and `Lead` audiences for exclusion (don't re-prospect existing leads) and for lookalike seeds.

**Exclusions:** existing leads/customers from prospecting sets; keep them for a separate nurture/upsell (reupholstery, additional rooms) flow.

## Budget framework (structure, not a promise)

Set the *real* numbers with Marat. Structure to start:

- **~60% Consideration+Conversion / ~30% Awareness / ~10% Retargeting** once retargeting audiences are large enough (early on, retargeting audiences are too small — put that budget into awareness to build them).
- Start each new ad set at a budget that can realistically exit the Meta "learning phase" (~50 optimization events/week). For MESSAGES/Lead objectives that means enough budget to generate ~7 conversations/day per ad set — otherwise consolidate ad sets.
- **Concentrate, don't scatter:** few audiences, few strong creatives, meaningful budget each. Fragmented ₪-per-ad-set is the #1 small-advertiser mistake.
- **Seasonality-weighted:** heavy up before Chagim, throttle down in low season. See `strategy/annual-calendar-jewish.md`.

## Offers & angles (test these against each other)

- **Bespoke consultation** — "Book a free studio visit / consultation" (low-commitment, high-intent).
- **Chag readiness** — "Order now, ready in time for [Chag]" (urgency tied to a real deadline; requires confirmed lead time).
- **Reupholstery / restore** — "Give your chairs a second life" (before/after; lower ticket entry point).
- **Heirloom quality** — "Furniture that stays in the family, for generations" (emotional, brand-building).
- **Made-for-your-table** — "Chairs built to the exact size of your table and room."

Do **not** lead with discounts — it's off-brand and attracts the wrong (price-driven) customer. If an incentive is ever needed, prefer *added value* (free fabric upgrade, free delivery) over price cuts.

## Operating cadence

- **Weekly:** review KPIs (`operations/kpis.md`), pause losers, scale winners ~20% at a time, refresh fatigued creative, log to `learning-loop/LEARNING_LOG.md`.
- **Before every Shabbat/Chag:** pause; reactivate after. (`annual-calendar-jewish.md`.)
- **Monthly:** review the offer/angle test board (`creative/`), refresh the winning-creative library, plan the next Chag push.
