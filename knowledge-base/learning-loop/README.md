# 🔁 Continual Learning Loop

This is the mechanism that makes the knowledge base get **smarter every session** instead of going stale. It's a lightweight, file-based loop — no infrastructure required.

## The loop

```
   ┌─────────────────────────────────────────────────────────────┐
   │                                                             │
   ▼                                                             │
1. READ        →  2. ACT        →  3. MEASURE      →  4. LEARN ──┘
knowledge-base    plan/draft/       pull results,      log it, then
(brand→strategy   analyze (live      read against       FOLD durable
→creative)        actions need       kpis.md            lessons back into
                  authorization)                        the source files
```

**The critical step is #4 — folding lessons back into the source files.** A log nobody re-reads is just a diary. When a lesson is durable, *edit the knowledge base itself*:
- A hook that consistently wins → add/upgrade it in `creative/ad-copy-library.md` and `messaging-framework.md`.
- An audience that outperforms → update `strategy/campaign-strategy.md`.
- A timing insight → update `strategy/annual-calendar-jewish.md`.
- A product fact confirmed with Marat → update `brand/product-catalog.md` and remove the ❓ placeholder.

## Files in this loop

| File | Purpose | Cadence |
|---|---|---|
| `LEARNING_LOG.md` | Append-only journal of every session: what we did, saw, decided, learned | Every session |
| `experiments.md` | Registry of A/B tests / creative & audience experiments and their verdicts | When a test starts and when it concludes |
| `session-template.md` | Copy-paste block for a consistent log entry | Reference |

## Rules for good entries

1. **Append, don't overwrite** `LEARNING_LOG.md` — history is the value.
2. **Be specific and quantitative** where possible ("CW-2 beat CW-1 on CPL by 28% over 6 days, ₪X spend") — vague notes teach nothing.
3. **Separate observation from conclusion.** One good week isn't a law. Mark low-confidence lessons as hypotheses to re-test.
4. **Always name what changed in the source files** as a result (or "no change — needs more data").
5. **Respect the guardrails** every time: Shabbat/Chag pause, no unauthorized live/paid actions, reverent + modest creative.

## Session ritual (do this each time)

1. Skim the last 2–3 `LEARNING_LOG.md` entries and any open experiments.
2. Read the relevant KB files for today's task.
3. Do the work.
4. Append a `session-template.md` entry.
5. Update `experiments.md` if a test started/ended.
6. **Fold durable lessons back into the source KB files** and note that in the log entry.
