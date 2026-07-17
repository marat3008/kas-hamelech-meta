# Annual Calendar — Jewish Seasons & Shabbat/Chag Scheduling

Two jobs for this file:
1. **Operational rule:** when to pause and reactivate ads (Shabbat + Chagim).
2. **Strategic rule:** when to spend heavily (pre-Chag high seasons) and when to throttle.

> ⚠️ **Always verify exact dates and candle-lighting / *tzeit* times from a reliable Jewish calendar (e.g. Hebcal) for the specific year and city.** Hebrew dates shift on the Gregorian calendar every year, and candle-lighting times are location-specific. Never hard-code times — look them up each cycle.

---

## Rule 1 — Shabbat & Chag pause (every week, every Chag)

**Pause all paid campaigns and scheduled organic posts** from before candle-lighting until after nightfall.

- **Weekly Shabbat:** pause **Friday**, ~1–2 hours before candle-lighting (candle-lighting is ~18–40 min before sunset). Reactivate **Saturday night** after *tzeit hakochavim* (~40–72 min after sunset).
- **Chagim (Yom Tov) — treat exactly like Shabbat**, pausing the full duration:
  - Rosh Hashana (2 days)
  - Yom Kippur (1 day)
  - Sukkot (first day[s]) + Shmini Atzeret / Simchat Torah
  - Pesach (first day[s] and last day[s])
  - Shavuot
  - (In Israel: one day of Yom Tov for Sukkot 1st, Pesach 1st, Pesach 7th, Shavuot; Rosh Hashana is 2 days.)

**Why this matters (both reasons):**
- **Respect / trust:** the audience is Shabbat-observant; an advertiser who runs on Shabbat signals cultural distance. Pausing signals belonging.
- **Performance:** the audience is offline — Shabbat/Chag impressions are largely wasted spend and depressed conversion. Pausing *improves* efficiency.

**Implementation options**
- Manual: pause ad sets Friday morning, reactivate Saturday night (add a recurring reminder).
- Automated: Meta **ad scheduling / dayparting** on lifetime-budget ad sets, OR a scheduled job in `meta-system` that calls `updateCampaignStatus(id, 'PAUSED'|'ACTIVE')` (`ads/meta-ads.js`) around dynamically-fetched candle-lighting times. **Automating this is a high-value backlog item** — see `learning-loop/experiments.md`.

---

## Rule 2 — High seasons (spend up) & low seasons (throttle)

Furniture demand for this audience spikes **before major Chagim**, when families refresh the home and prepare to host large meals. The buying decision must happen **early enough that a custom order can be delivered before the Chag** — so campaigns must start *ahead* of the holiday by at least the production lead time (confirm lead time in `brand/product-catalog.md`).

| Season | Hebrew month(s) | ~Gregorian | Demand | Marketing move |
|---|---|---|---|---|
| **Pre–Rosh Hashana / Tishrei chagim** | Elul → Tishrei | Aug–Oct | 🔥 Peak | Biggest push of the year. "Ready in time for the Chagim" — start early (Elul) so custom orders can ship before Rosh Hashana/Sukkot. Hosting angle is strongest here. |
| **Pre-Pesach** | Adar → Nisan | Feb–Apr | 🔥 Peak | Second big push. Pesach = deep-cleaning + refreshing the home + huge seder table. "New chairs for the seder table." |
| **Pre-Sukkot** | early Tishrei | Sep–Oct | High | Hosting in the sukkah; comfortable, dignified seating for guests. |
| **Pre-Shavuot** | Iyar → Sivan | May–Jun | Moderate | Dairy meals, hosting; lighter push. |
| **Wedding / simcha season** | year-round, peaks post-Pesach & summer | — | Steady | Newly married couples furnishing first homes; target "newly engaged/married." |
| **Deep winter / mid-summer lulls** | Cheshvan; Tammuz–Av | Nov, Jul–Aug | Low | Throttle spend; run brand-building & retargeting; build content library; nurture past leads (reupholstery upsell). |

**The Three Weeks / Nine Av (Bein HaMetzarim, Tammuz–Av):** a mourning period — **avoid celebratory "host a joyous meal" messaging and avoid launching festive campaigns.** Keep it low-key (brand/craft content, reupholstery/utility angle). Verify dates yearly.

---

## Planning workflow each cycle

1. Pull the exact upcoming Chag date + the studio's city candle-lighting/tzeit times (Hebcal).
2. Count backward by the confirmed production lead time → set the "order by" date → that's your campaign urgency deadline.
3. Schedule spend to ramp ~4–6 weeks before the Chag, peak ~2–3 weeks out, and taper once the "order by" date passes (switch messaging to "reserve your slot for after the Chag").
4. Load the Shabbat/Chag pauses for the period into the calendar/automation.
5. Log the plan and, afterward, the results in `learning-loop/`.
