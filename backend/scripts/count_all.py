import os
import sqlite3

db_path = 'smrt.db' if os.path.exists('smrt.db') else 'backend/smrt.db'
con = sqlite3.connect(db_path)
tables = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall() if not r[0].startswith('sqlite_')]
print(f"--- DB TABLE COUNTS ({len(tables)} tables total) ---")
for t in sorted(tables):
    cnt = con.execute(f"SELECT COUNT(1) FROM {t}").fetchone()[0]
    print(f"{t}: {cnt}")
con.close()
