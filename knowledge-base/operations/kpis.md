# KPIs, Benchmarks & How to Read Them

Set real targets with Marat and revise them from actual data. The numbers below are **structure and starting hypotheses**, not promises.

## The funnel metrics that matter

| Stage | Metric | What it tells you | Lever if it's off |
|---|---|---|---|
| Reach/awareness | CPM, reach, frequency | Cost to be seen; frequency > ~3–4 = fatigue | Refresh creative; widen audience |
| Engagement | Video retention (25/50/75%), CTR, engagement rate | Is the creative earning attention? | Better hook; better first 1s |
| Click/lead | CPC, **cost per WhatsApp conversation**, **cost per lead (CPL)** | Cost to start a conversation | Offer/angle test; audience; landing/first-reply |
| Qualify | Lead→qualified rate, response time | Are leads real & are we fast? | SLA on first reply; qualification questions |
| Close | Qualified→order rate, **CAC**, avg order value, **ROAS** | The money truth | Sales process; pricing; product mix |
| Retain | Review rate, referral rate, repeat/reupholstery rate | Compounding, cheapest growth | Post-purchase automation |

## North-star & guardrail metrics

- **North star:** **ROAS** (revenue ÷ ad spend) and **CAC** (fully-loaded cost per closed order).
- **Guardrails:** cost per WhatsApp conversation / CPL (leading indicator), and lead→sale rate (quality indicator). Cheap leads that never close are a trap — always read CPL *with* close rate.

## Why we can't optimize on `Purchase` yet

The flow currently fires `Contact` and `Lead` only. `capi/conversions.js` already defines `trackPurchase()`/`trackSchedule()` — they're just never called. Until a value-bearing `Purchase` event is wired in, Meta optimizes toward *conversations*, not *revenue*. Closing this gap (backlog #1 in `operations/lead-flow.md`) is the single biggest measurement upgrade available.

## Reading results without fooling yourself

- **Give it time & volume.** Don't judge an ad set before it exits the learning phase (~50 events/week) or on <100 clicks. Small numbers lie.
- **Segment before concluding.** Break results by channel, audience, creative, and *season* — a "bad week" may just be pre-Chag vs. low-season, or a Shabbat/Chag pause skewing daily averages.
- **Leading vs. lagging.** CPL is fast but shallow; ROAS is slow but true. Watch CPL daily, judge on ROAS.
- **Attribution humility.** In a word-of-mouth religious community, many "direct"/organic WhatsApp messages were actually *seeded* by ads. Don't under-credit awareness spend.

## Weekly review checklist

1. Pull `getDashboardSummary()` (`ads/meta-ads.js`) → spend, leads, cost-per-lead (7-day).
2. Best & worst creative by retention/CTR/CPL → scale winners ~20%, pause losers.
3. Frequency check → refresh fatigued creative.
4. Response-time / SLA check → are we replying within the promised hour?
5. Log the numbers + one decision + one lesson in `learning-loop/LEARNING_LOG.md`.

## Targets to fill in (with real data)

| KPI | Current | Target | Notes |
|---|---|---|---|
| Cost per WhatsApp conversation | ❓ | ❓ | Primary leading indicator |
| CPL (Lead Ads) | ❓ | ❓ | Read with close rate |
| Lead → qualified | ❓ | ❓ | |
| Qualified → order | ❓ | ❓ | |
| Avg order value | ❓ | ❓ | Needed for ROAS/CAC |
| CAC | ❓ | ❓ | North star |
| ROAS | ❓ | ❓ | North star |
| First-reply time | ❓ | ≤ 1 hour | Promised in welcome msg |
| Review rate / referral rate | ❓ | ❓ | Retention engine |
