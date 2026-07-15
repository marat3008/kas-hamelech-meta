# -*- coding: utf-8 -*-
"""בדיקת תקינות (HTTP) של כל הקישורים בקובץ ה-Excel + הפקת דוח."""
import openpyxl, urllib.request, ssl, socket, time, json
from urllib.error import HTTPError, URLError

SRC = "/home/user/kas-hamelech-meta/KingChairs_LinkBuilding_Opportunities.xlsx"
wb = openpyxl.load_workbook(SRC)
ws = wb["הזדמנויות לינקים"]

# איסוף כל הקישורים הייחודיים מעמודה C (יחד עם שם מעמודה B)
seen = {}
order = []
for row in ws.iter_rows(min_row=4):
    name_cell = row[1] if len(row) > 1 else None
    url_cell = row[2] if len(row) > 2 else None
    if url_cell is None:
        continue
    url = url_cell.hyperlink.target if url_cell.hyperlink else (
        url_cell.value if isinstance(url_cell.value, str) and url_cell.value.startswith("http") else None)
    if not url:
        continue
    name = name_cell.value if name_cell and name_cell.value else ""
    if url not in seen:
        seen[url] = name
        order.append(url)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"

def check(url, timeout=20):
    """מנסה GET (חלקי). מחזיר (status_code, final_url, note)."""
    req = urllib.request.Request(url, method="GET", headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "he,en;q=0.8",
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            code = r.getcode()
            final = r.geturl()
            r.read(2048)  # קצת תוכן בלבד
            return code, final, ""
    except HTTPError as e:
        return e.code, url, e.reason
    except URLError as e:
        return None, url, f"URLError: {e.reason}"
    except socket.timeout:
        return None, url, "timeout"
    except Exception as e:
        return None, url, f"{type(e).__name__}: {e}"

results = []
for i, url in enumerate(order, 1):
    code, final, note = check(url)
    redirected = (final and final.rstrip("/") != url.rstrip("/"))
    if code and 200 <= code < 400:
        status = "OK"
    elif code in (401, 403, 405, 429):
        status = "BLOCKED"   # קיים אך חוסם בוטים
    elif code and 400 <= code < 500:
        status = "CLIENT_ERR"
    elif code and code >= 500:
        status = "SERVER_ERR"
    else:
        status = "FAIL"
    results.append({
        "n": i, "name": seen[url], "url": url, "code": code,
        "status": status, "redirected": redirected, "final": final, "note": note,
    })
    print(f"[{i:2}] {status:10} {str(code):5} {url}  {('-> '+final) if redirected else ''} {note}")
    time.sleep(0.3)

with open("/home/user/kas-hamelech-meta/link_check_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

# סיכום
from collections import Counter
c = Counter(r["status"] for r in results)
print("\n===== SUMMARY =====")
print("total unique URLs:", len(results))
for k, v in c.most_common():
    print(f"{k}: {v}")
