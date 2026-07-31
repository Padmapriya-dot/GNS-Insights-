"""Seed database with realistic operational data for testing the dashboard."""

import random
from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tenant import Tenant
from app.models.product import Product
from app.models.machine import Machine
from app.models.production import ProductionOrder, WorkOrder, DailyProductionReport
from app.models.inventory import Warehouse, Supplier, InventoryItem, StockLevel


def seed_dashboard_data(db: Session, tenant_id: int = 1):
    # Ensure tenant exists
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        print("Tenant 1 does not exist, skipping dashboard seeding.")
        return

    print("Seeding dashboard data...")

    # 1. Seed Warehouses
    warehouses_data = [
        {"code": "WH-MAIN", "name": "Main Store", "is_primary": True},
        {"code": "WH-PROD", "name": "Production Store", "is_primary": False},
        {"code": "WH-FG", "name": "FG Warehouse", "is_primary": False},
        {"code": "WH-OTH", "name": "Others Warehouse", "is_primary": False},
    ]
    warehouses = {}
    for w_info in warehouses_data:
        w = db.scalars(
            select(Warehouse).where(
                Warehouse.tenant_id == tenant_id, Warehouse.code == w_info["code"]
            )
        ).first()
        if not w:
            w = Warehouse(
                tenant_id=tenant_id,
                code=w_info["code"],
                name=w_info["name"],
                is_primary=w_info["is_primary"],
                status="active"
            )
            db.add(w)
            db.flush()
        warehouses[w_info["code"]] = w

    # 2. Seed Suppliers
    suppliers_data = [
        {"vendor_code": "SUP-TATA", "name": "Tata AutoComp", "email": "tata@autocomp.com"},
        {"vendor_code": "SUP-BOSCH", "name": "Bosch India", "email": "bosch@india.com"},
        {"vendor_code": "SUP-MAH", "name": "Mahindra Parts", "email": "mahindra@parts.com"},
    ]
    suppliers = {}
    for s_info in suppliers_data:
        s = db.scalars(
            select(Supplier).where(
                Supplier.tenant_id == tenant_id, Supplier.vendor_code == s_info["vendor_code"]
            )
        ).first()
        if not s:
            s = Supplier(
                tenant_id=tenant_id,
                vendor_code=s_info["vendor_code"],
                name=s_info["name"],
                email=s_info["email"],
                status="active"
            )
            db.add(s)
            db.flush()
        suppliers[s_info["vendor_code"]] = s

    # 3. Seed Products
    products_data = [
        {"sku": "PGA-4401", "name": "Precision Gear Assembly", "description": "High precision gears"},
        {"sku": "HVB-2208", "name": "Hydraulic Valve Block", "description": "Hydraulic flow controls"},
        {"sku": "MHC-1180", "name": "Motor Housing Casting", "description": "Cast iron motor casing"},
        {"sku": "CPE-3302", "name": "Control Panel Enclosure", "description": "Metal panel casing"},
        {"sku": "BRR-9901", "name": "Bearing Retainer Ring", "description": "Steel ring components"},
    ]
    products = {}
    for p_info in products_data:
        p = db.scalars(
            select(Product).where(
                Product.tenant_id == tenant_id, Product.sku == p_info["sku"]
            )
        ).first()
        if not p:
            p = Product(
                tenant_id=tenant_id,
                sku=p_info["sku"],
                name=p_info["name"],
                description=p_info["description"]
            )
            db.add(p)
            db.flush()
        products[p_info["sku"]] = p

    # 4. Seed Inventory Items (Materials & Finished Goods)
    items_data = [
        # Raw materials
        {"sku": "RM-SS304-2", "name": "SS Sheet 304 – 2mm", "item_type": "raw_material", "unit_cost": 2500.0, "reorder_level": 100, "category": "Metals"},
        {"sku": "RM-HO-046", "name": "Hydraulic Oil ISO 46", "item_type": "raw_material", "unit_cost": 450.0, "reorder_level": 50, "category": "Liquids"},
        {"sku": "RM-BLT-M8", "name": "M8 Hex Bolt Grade 8.8", "item_type": "raw_material", "unit_cost": 15.0, "reorder_level": 500, "category": "Hardware"},
        # Finished goods (matching top products)
        {"sku": "PGA-4401-FG", "name": "Precision Gear Assembly (FG)", "item_type": "finished_good", "unit_cost": 5000.0, "reorder_level": 20, "category": "Finished Goods"},
        {"sku": "HVB-2208-FG", "name": "Hydraulic Valve Block (FG)", "item_type": "finished_good", "unit_cost": 8500.0, "reorder_level": 15, "category": "Finished Goods"},
        {"sku": "MHC-1180-FG", "name": "Motor Housing Casting (FG)", "item_type": "finished_good", "unit_cost": 3000.0, "reorder_level": 30, "category": "Finished Goods"},
    ]
    items = {}
    for i_info in items_data:
        item = db.scalars(
            select(InventoryItem).where(
                InventoryItem.tenant_id == tenant_id, InventoryItem.sku == i_info["sku"]
            )
        ).first()
        if not item:
            item = InventoryItem(
                tenant_id=tenant_id,
                sku=i_info["sku"],
                name=i_info["name"],
                item_type=i_info["item_type"],
                unit_cost=i_info["unit_cost"],
                reorder_level=i_info["reorder_level"],
                category=i_info["category"],
                is_active=True,
                unit="pcs" if "Bolt" in i_info["name"] else "kg" if "Sheet" in i_info["name"] else "liters" if "Oil" in i_info["name"] else "pcs",
                supplier_id=suppliers["SUP-TATA"].id if "SS" in i_info["sku"] else suppliers["SUP-BOSCH"].id
            )
            db.add(item)
            db.flush()
        items[i_info["sku"]] = item

    # 5. Seed Stock Levels
    for item in items.values():
        existing_sl = db.scalars(
            select(StockLevel).where(StockLevel.item_id == item.id)
        ).first()
        if not existing_sl:
            # Main Store
            sl1 = StockLevel(
                warehouse_id=warehouses["WH-MAIN"].id,
                item_id=item.id,
                quantity=random.choice([10, 42, 85, 120, 320, 600])
            )
            db.add(sl1)
            # Production Store
            sl2 = StockLevel(
                warehouse_id=warehouses["WH-PROD"].id,
                item_id=item.id,
                quantity=random.choice([5, 12, 18, 25, 60])
            )
            db.add(sl2)

    # 6. Seed Machines
    machines_data = [
        {"code": "CNC-01", "name": "CNC Milling – Line 1", "status": "running", "efficiency_pct": 92.5, "oee_pct": 89.2},
        {"code": "VMC-02", "name": "VMC Center – Line 2", "status": "running", "efficiency_pct": 87.0, "oee_pct": 85.5},
        {"code": "LATHE-03", "name": "CNC Lathe – Line 3", "status": "idle", "efficiency_pct": 78.4, "oee_pct": 74.0},
        {"code": "PRESS-04", "name": "Hydraulic Press", "status": "setup", "efficiency_pct": 71.2, "oee_pct": 68.0},
        {"code": "WELD-05", "name": "Robotic Welding Cell", "status": "running", "efficiency_pct": 78.8, "oee_pct": 76.5},
        {"code": "ASSY-06", "name": "Assembly Station", "status": "maintenance", "efficiency_pct": 58.0, "oee_pct": 55.0},
    ]
    machines = {}
    for m_info in machines_data:
        m = db.scalars(
            select(Machine).where(
                Machine.tenant_id == tenant_id, Machine.code == m_info["code"]
            )
        ).first()
        if not m:
            m = Machine(
                tenant_id=tenant_id,
                code=m_info["code"],
                name=m_info["name"],
                status=m_info["status"],
                plant_code="plant-1",
                efficiency_pct=m_info["efficiency_pct"],
                oee_pct=m_info["oee_pct"],
                health_score=random.randint(70, 98),
                temperature_c=random.uniform(35.0, 55.0),
                rpm=random.uniform(1000.0, 3000.0)
            )
            db.add(m)
            db.flush()
        machines[m_info["code"]] = m

    # 7. Seed Production Orders & Work Orders
    for idx, (sku, p) in enumerate(list(products.items())[:3]):
        po_num = f"PO-2026-{idx+1:04d}"
        po = db.scalars(
            select(ProductionOrder).where(
                ProductionOrder.tenant_id == tenant_id, ProductionOrder.order_number == po_num
            )
        ).first()
        if not po:
            po = ProductionOrder(
                tenant_id=tenant_id,
                product_id=p.id,
                order_number=po_num,
                planned_quantity=random.choice([100, 200, 300, 500]),
                status="in_progress",
                customer_name=random.choice(["Tata AutoComp", "Bosch India", "Mahindra Parts"]),
                start_date=date.today(),
                due_date=date.today() + timedelta(days=2)
            )
            db.add(po)
            db.flush()
        else:
            po.start_date = date.today()
            po.due_date = date.today() + timedelta(days=2)
            db.flush()

        # Add corresponding Work Order
        wo_num = f"WO-2026-{idx+1:04d}"
        wo = db.scalars(
            select(WorkOrder).where(
                WorkOrder.tenant_id == tenant_id, WorkOrder.work_order_number == wo_num
            )
        ).first()
        if not wo:
            wo = WorkOrder(
                tenant_id=tenant_id,
                production_order_id=po.id,
                work_order_number=wo_num,
                planned_quantity=po.planned_quantity,
                actual_quantity=po.planned_quantity * 0.9,
                status="in_progress" if idx % 2 == 0 else "completed",
                machine_id=machines[f"CNC-01" if idx % 2 == 0 else "VMC-02"].id,
                plant_code="plant-1",
                planned_start=date.today(),
                planned_end=date.today() + timedelta(days=2)
            )
            db.add(wo)
            db.flush()
        else:
            wo.planned_start = date.today()
            wo.planned_end = date.today() + timedelta(days=2)
            db.flush()

    # 8. Seed Daily Production Reports for the past 7 days
    today = date.today()
    product_keys = list(products.values())
    machine_keys = list(machines.values())
    work_orders = list(db.scalars(select(WorkOrder).where(WorkOrder.tenant_id == tenant_id)).all())

    # Always delete and re-seed to align with the current date
    db.query(DailyProductionReport).filter(DailyProductionReport.tenant_id == tenant_id).delete()
    db.flush()

    for i in range(7, -1, -1):
        r_date = today - timedelta(days=i)
        # Seed 2 reports per day
        for j in range(2):
            p_item = product_keys[j % len(product_keys)]
            m_item = machine_keys[j % len(machine_keys)]
            wo_item = work_orders[j % len(work_orders)] if work_orders else None
            
            planned = random.choice([2000, 2200, 2400, 2500])
            produced = planned - random.randint(50, 150)
            scrap = random.randint(10, 30)

            report = DailyProductionReport(
                tenant_id=tenant_id,
                report_date=r_date,
                product_id=p_item.id,
                work_order_id=wo_item.id if wo_item else None,
                machine_id=m_item.id,
                planned_quantity=planned,
                produced_quantity=produced,
                scrap_quantity=scrap,
                downtime_minutes=random.randint(10, 45)
            )
            db.add(report)

    from app.core.seed_finance import seed_finance_data
    seed_finance_data(db, tenant_id)

    db.commit()
    print("Database seeding completed successfully.")


if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_dashboard_data(db)
    finally:
        db.close()
