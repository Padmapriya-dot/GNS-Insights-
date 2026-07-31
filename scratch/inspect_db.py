import sys, os
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "smrt.db"))
engine = create_engine(f"sqlite:///{db_path}")
SessionLocal = sessionmaker(bind=engine)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.models.inventory import StockLevel, InventoryItem
from app.models.machine import Machine
from app.models.production import DailyProductionReport, WorkOrder

db = SessionLocal()

items = db.scalars(select(InventoryItem)).all()
levels = db.scalars(select(StockLevel)).all()
machines = db.scalars(select(Machine)).all()
reports = db.scalars(select(DailyProductionReport)).all()
work_orders = db.scalars(select(WorkOrder)).all()

print(f"Database Path: {db_path}")
print(f"Total Inventory Items: {len(items)}")
print(f"Total Stock Levels: {sum(float(sl.quantity or 0) for sl in levels)}")
print(f"Total Machines: {len(machines)}")
for m in machines:
    print(f"  Machine {m.code} ({m.name}): status={m.status}, efficiency={m.efficiency_pct}%, oee={m.oee_pct}%")

print(f"Total Daily Reports: {len(reports)}")
good_sum = sum(float(r.produced_quantity or 0) for r in reports)
scrap_sum = sum(float(r.scrap_quantity or 0) for r in reports)
print(f"  Good Qty Sum: {good_sum}, Scrap Qty Sum: {scrap_sum}")

print(f"Total Work Orders: {len(work_orders)}")
for wo in work_orders:
    print(f"  WO {wo.work_order_number}: status={wo.status}, qty={wo.planned_quantity}")

db.close()
