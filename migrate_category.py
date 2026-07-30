import sqlite3

conn = sqlite3.connect("backend/smrt.db")
cur = conn.cursor()

# Check if column already exists
cur.execute("PRAGMA table_info(products)")
columns = [row[1] for row in cur.fetchall()]
print("Existing columns:", columns)

if "category" not in columns:
    cur.execute("ALTER TABLE products ADD COLUMN category VARCHAR(128) DEFAULT 'Finished Goods'")
    conn.commit()
    print("category column added successfully to products table")
else:
    print("ℹ️  category column already exists")

conn.close()
