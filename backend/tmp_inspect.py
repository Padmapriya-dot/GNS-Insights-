import sqlite3
conn = sqlite3.connect('smrt.db')
cur = conn.cursor()
print('machine count', cur.execute('select count(*) from machine').fetchone()[0])
print('work_order count', cur.execute('select count(*) from work_order').fetchone()[0])
print('machine rows', cur.execute('select id, code, name, status, tenant_id from machine order by id limit 20').fetchall())
print('work_order rows', cur.execute('select id, work_order_number, status, tenant_id from work_order order by id limit 20').fetchall())
conn.close()
