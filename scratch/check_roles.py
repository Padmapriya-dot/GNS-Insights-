import sqlite3
from pathlib import Path

p = Path(r"c:\Users\satee\OneDrive\Desktop\GNS Insights\backend\smrt.db")
con = sqlite3.connect(p)
cur = con.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print("role-ish tables:", [t for t in tables if "role" in t.lower() or "user" in t.lower()])
for t in tables:
    if "role" in t.lower():
        print("---", t)
        print(cur.execute(f"pragma table_info({t})").fetchall())
        try:
            print(cur.execute(f"select * from {t} limit 20").fetchall())
        except Exception as e:
            print(e)
