"""Seed base infrastructure (warehouses, machines) only — no fake operational data."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tenant import Tenant
from app.models.machine import Machine
from app.models.inventory import Warehouse


def seed_dashboard_data(db: Session, tenant_id: int = 1):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        return

    warehouses_data = [
        {"code": "WH-MAIN", "name": "Main Store", "is_primary": True},
        {"code": "WH-PROD", "name": "Production Store", "is_primary": False},
        {"code": "WH-FG", "name": "FG Warehouse", "is_primary": False},
        {"code": "WH-OTH", "name": "Others Warehouse", "is_primary": False},
    ]
    for w_info in warehouses_data:
        exists = db.scalars(
            select(Warehouse).where(Warehouse.tenant_id == tenant_id, Warehouse.code == w_info["code"])
        ).first()
        if not exists:
            db.add(Warehouse(
                tenant_id=tenant_id,
                code=w_info["code"],
                name=w_info["name"],
                is_primary=w_info["is_primary"],
                status="active",
            ))

    machines_data = [
        {"code": "CNC-01", "name": "CNC Milling – Line 1"},
        {"code": "VMC-02", "name": "VMC Center – Line 2"},
        {"code": "LATHE-03", "name": "CNC Lathe – Line 3"},
        {"code": "PRESS-04", "name": "Hydraulic Press"},
        {"code": "WELD-05", "name": "Robotic Welding Cell"},
        {"code": "ASSY-06", "name": "Assembly Station"},
    ]
    for m_info in machines_data:
        exists = db.scalars(
            select(Machine).where(Machine.tenant_id == tenant_id, Machine.code == m_info["code"])
        ).first()
        if not exists:
            db.add(Machine(
                tenant_id=tenant_id,
                code=m_info["code"],
                name=m_info["name"],
                status="idle",
                plant_code="plant-1",
            ))

    db.commit()


if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_dashboard_data(db)
    finally:
        db.close()
