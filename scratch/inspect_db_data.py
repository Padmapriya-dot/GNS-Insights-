import sqlite3
import os

db_path = "backend/smrt.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- MACHINES IN DB ---")
for row in cursor.execute("SELECT id, code, name, status, efficiency_pct, oee_pct FROM machines"):
    print(row)

print("\n--- TODAY'S PRODUCTION REPORTS IN DB ---")
for row in cursor.execute("SELECT id, report_date, produced_quantity, scrap_quantity, machine_id FROM daily_production_reports ORDER BY id DESC LIMIT 10"):
    print(row)

print("\n--- INVENTORY STOCK SUMMARY IN DB ---")
for row in cursor.execute("""
    SELECT i.item_type, SUM(sl.quantity) 
    FROM stock_levels sl 
    JOIN inventory_items i ON sl.item_id = i.id 
    GROUP BY i.item_type
"""):
    print(row)

conn.close()
