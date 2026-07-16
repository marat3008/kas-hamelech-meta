# 👑 Kas Hamelech — Marketing Knowledge Base

**Business:** Kiseh Hamelech Designs / "King Chairs" (כס המלך עיצובים)
**Owner:** Marat Altman
**Product:** Bespoke, handmade upholstered furniture — custom dining & living-room chairs, designer armchairs, made-to-order sofas, and reupholstery.
**Market:** Israel (Hebrew-speaking), with a strategic focus on the religious, Shabbat-observant demographic.
**Channels:** Instagram `@kas_hamelech` · Facebook · TikTok · WhatsApp Business · `www.kashamelech.co.il`

---

## Purpose of this knowledge base

This directory is the **single source of truth** for how Kas Hamelech markets itself. It is designed to be *modular* and *self-improving*: every marketing session should read the relevant files, act, and then write back what was learned into `learning-loop/`. Over time the knowledge base becomes sharper, more professional, and more precisely aligned with the brand.

This is a **content & strategy knowledge base**, not a live campaign controller. Nothing here spends ad budget or publishes content by itself. Going live (paid campaigns, scheduled posts, automated DMs) is always a deliberate, human-authorized step — see `operations/lead-flow.md`.

## Structure

```
knowledge-base/
├── brand/
│   ├── brand-identity.md            Brand story, positioning, voice, visual identity
│   ├── product-catalog.md           Products, materials, craftsmanship proof points
│   └── audience-shabbat-observant.md  ICP + the religious-market nuances that must guide everything
├── strategy/
│   ├── campaign-strategy.md         Funnel, objectives, budget framework, offer strategy
│   ├── channels-fb-ig-tiktok.md     Per-channel playbooks
│   └── annual-calendar-jewish.md    High/low seasons, Shabbat & Chag scheduling rules
├── creative/
│   ├── messaging-framework.md       Value props, hooks, angles, objection handling
│   └── ad-copy-library.md           Ready-to-use Hebrew ad copy + captions by channel
├── operations/
│   ├── lead-flow.md                 How a click becomes a lead becomes a sale (uses meta-system)
│   └── kpis.md                      Metrics, targets, and how to read them
├── troubleshooting/                 Problems, errors & fixes (symptom → cause → fix)
│   ├── README.md                    Index + diagnostic order + escalation
│   ├── technical-errors.md          Webhook, tokens, WhatsApp API, CAPI, lead sync, server/DB
│   ├── ads-delivery-and-performance.md  Rejections, account health, delivery, CPL, fatigue, TikTok
│   └── faq.md                       Plain-language owner Q&A (Hebrew)
└── learning-loop/
    ├── README.md                    How the continual-learning loop works
    ├── LEARNING_LOG.md              Append-only log of sessions, results, decisions
    ├── experiments.md               Registry of A/B tests and their outcomes
    └── session-template.md          Copy-paste template for logging a session
```

## How to use it (every session)

1. **Read** `brand/audience-shabbat-observant.md` first — it constrains everything else.
2. **Read** the relevant `strategy/` and `creative/` files for the task at hand.
3. **Act** — draft copy, plan a campaign, analyze results. (Live actions require authorization.)
4. **Learn** — append a dated entry to `learning-loop/LEARNING_LOG.md` using `session-template.md`, register any test in `experiments.md`, and if a durable lesson emerged, edit the source file (e.g. tighten a hook in `ad-copy-library.md`).

## Non-negotiable guardrails

- **Never run ads, schedule posts, or send automated messages during Shabbat or a Chag (Yom Tov).** See `strategy/annual-calendar-jewish.md`.
- **Never publish or launch anything that spends money or reaches the public without explicit human authorization.**
- **Respect the religious audience authentically** — terminology and imagery must be correct and reverent, never a caricature. When unsure, ask.
- **All customer-facing copy is Hebrew-first.** English in this KB is for internal clarity only.
