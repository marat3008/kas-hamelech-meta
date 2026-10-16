# Competitor target directory

Human-readable names for the URLs in `targets.json`. The scanner itself only
needs the URLs; this file is for the person reading `npm run seo:schedule`'s
output.

| Business (Hebrew) | URL | Verified 2026-10-08 |
|---|---|---|
| לוסו רהיטים | https://www.lusso.co.il/ | live, 200 |
| פורמט דיזיין | https://formatt.co.il/ | live, 200 |
| רהיטי קיבוץ השלושה | https://3furniture.com/ | live, 200 |
| זה השולחן | https://zehashulchan.com/ | live, 200 |
| שפיצר רהיטים | https://shpitzer.co.il/ | live, 200 |
| ליזרוביץ רהיטים | https://leizerovits.co.il/ | live, 200 |

## Checked and intentionally left out

**Domain does not exist (DNS resolution failed) — not added.** These were
supplied as URLs but the domains don't resolve at all, so they can't be the
business's real site as given:
- מחסני הנמל — `port-warehouses.co.il`
- רהיטי שוהם (בני ברק) — `shoham-furniture.co.il`
- דיבאני סנטר — `divanicentertlv.co.il`
- מילנו רהיטים — `milano-furniture.co.il`
- מודלית שאטו דאקס — `chateaudax.co.il`
- אריק דייוין (ראשון לציון) — `arik-divin.co.il`
- למור רהיטים (ראשון לציון) — `lemor-furniture.co.il`
- אסף רהיטים — `assaf-furniture.co.il`

**Inconclusive — not added.** `www.ysrihut.co.il` (יופי של ריהוט?) returns
HTTP 200 but only a 1.6KB interstitial page titled "עבור לדף המבוקש" ("go to
the requested page"), even with a Referer header — looks like a parked/forwarding
page, not the real site. Needs the correct URL confirmed before adding.
