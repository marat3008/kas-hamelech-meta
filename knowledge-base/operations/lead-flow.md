# Lead Flow & Automation

How a stranger becomes a customer, and where the existing `meta-system` code plugs in. This connects the marketing knowledge base to the technical system shipped in the repo archives (`meta-system-v2-2.zip` / `kas-hamelech-code.7z`).

## End-to-end flow

```
 Ad (FB/IG/TikTok)
      │
      ├─ Click-to-WhatsApp ─────────────► WhatsApp inbound
      │                                     │
      │                                     ▼
      │                              channels/whatsapp.js
      │                              • saveMessage()  (DB)
      │                              • markAsRead()
      │                              • CAPI "Contact" event
      │                              • autoRespond(): greeting → welcome,
      │                                price → catalog, appointment → studio,
      │                                else → human handoff + team alert
      │
      └─ Lead Ad form ─────────────────► Meta Lead webhook
                                            │
                                            ▼
                                     leads/leads.js → handleNewLead()
                                     • fetchLeadDetails() from Meta
                                     • saveLead() (DB)
                                     • CAPI "Lead" event  (optimizes campaigns)
                                     • auto WhatsApp welcome to the lead
                                     • notifier alert to the team
                                            │
                                            ▼
                              Human follow-up (Sun–Thu 9–18) → quote →
                              studio visit → order → delivery
                                            │
                                            ▼
                              Retention: review request + referral ask +
                              future reupholstery / next-room upsell
```

## Existing components (from the archives)

| File | Role |
|---|---|
| `server.js` | Express app, Meta webhook verify + receiver |
| `channels/whatsapp.js` | WhatsApp Cloud API: inbound handling, smart auto-replies, templates, images, buttons |
| `channels/instagram.js`, `channels/messenger.js` | Additional inbound channels |
| `leads/leads.js` | Meta Lead Ads intake → DB → CAPI → auto-WhatsApp → team alert |
| `ads/meta-ads.js` | Create campaigns, pull insights, pause/activate, dashboard summary |
| `capi/conversions.js` | Conversions API (server-side `Contact`/`Lead` events) |
| `db/database.js` | Postgres persistence (leads, messages, conversations) |
| `dashboard/` | Ops dashboard (index.html + routes) |
| `utils/notifier.js` | Team notifications |

> The archives are not yet extracted into the repo tree. If/when we want to run or evolve the system, extract `meta-system-v2-2.zip` into the repo and wire `server.js` to it. That's a separate engineering task from this knowledge base.

## Gaps & high-value improvements (backlog)

1. **`Purchase`/`Quote` CAPI event** — today only `Contact` and `Lead` are tracked. Sending a value-bearing conversion when a deal closes lets Meta optimize toward *revenue*, not just conversations. High impact.
2. **Automated Shabbat/Chag pause** — schedule `updateCampaignStatus()` around fetched candle-lighting/tzeit times so no one has to remember. (`strategy/annual-calendar-jewish.md`.)
3. **Lead qualification & routing** — capture budget/room/Chag-deadline in the first WhatsApp exchange; prioritize hot leads for the team.
4. **Response-time SLA** — the welcome promises "within an hour." Track and alert if breached; speed is the #1 lever on lead→sale for consultative sales.
5. **Review & referral automation** — post-delivery template asking for a review + a friend referral (highest-ROI channel in a tight community).
6. **Reupholstery reminder** — long-cycle nurture to past customers.

## Human handoff & hours

- Auto-replies cover greeting / price / appointment; everything else is flagged for a human.
- Studio hours **Sun–Thu 9:00–18:00**; closed Shabbat, adjust around Chagim.
- The 24-hour WhatsApp window matters: to message a lead after 24h of silence, a **template** (`sendTemplate`) is required — keep approved Hebrew templates ready for follow-ups.
