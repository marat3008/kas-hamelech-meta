# 🛠️ Troubleshooting Knowledge Base — Kas Hamelech

The complete "problems, errors, and how to fix them" library for the Kas Hamelech marketing & lead system. When something breaks — an ad is rejected, WhatsApp won't send, leads stop arriving, CPL spikes — start here.

## How to use it

1. **Identify the layer** the problem lives in:
   - **Technical / system / API** → `technical-errors.md` (webhook, tokens, WhatsApp Cloud API, CAPI, lead sync, server, DB).
   - **Ads delivery & performance** → `ads-delivery-and-performance.md` (rejections, account restrictions, delivery, learning phase, CPL/CPM, fatigue, TikTok).
   - **Quick owner questions** → `faq.md` (plain-language Q&A in Hebrew).
2. **Match the symptom** to a row (symptom → likely cause → fix).
3. **Apply the fix**, then **log it** in `../learning-loop/LEARNING_LOG.md` — every new problem+fix you encounter that isn't here should be *added* here so the KB keeps getting smarter.

## Diagnostic order (always work outside-in)

```
1. Is it live at all?      → /health endpoint, server running, DB connected (server.js)
2. Is Meta reaching us?    → webhook verified + signature valid (server.js verifyMetaSignature)
3. Are we authorized?      → tokens valid + permissions granted (System User)
4. Is the data flowing?    → leads saved, CAPI events sent, WhatsApp replies going out
5. Is the money working?   → ads approved, delivering, converting at target CPL
```

Fix in that order — a token problem masquerades as "leads stopped"; a webhook problem masquerades as "WhatsApp is broken."

## An honest note on "100% correct answers"

This KB aims to cover the real, recurring problems of *this* system thoroughly — but some answers depend on **live facts only Marat/Meta can confirm** (current token validity, exact ad-account status, real lead times/prices). Those are marked with ❓ or "confirm". When an answer needs a live fact, the correct response is to say what to check and where — not to guess. Honesty about the unknown *is* the accurate answer. Every real incident you resolve should be written back here so coverage approaches completeness over time.

## Escalation

- **Meta ad account disabled / policy appeal** → Meta Business Support / Account Quality (in Business Manager). Time-sensitive.
- **WhatsApp number quality flagged / restricted** → WhatsApp Manager → Phone number quality.
- **Anything that would spend money, go live, or change account settings** → confirm with Marat first. Never self-authorize.
