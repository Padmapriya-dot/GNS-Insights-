from app.core.database import SessionLocal
from app.models.tenant import Tenant
from app.core.seed_dashboard import seed_dashboard_data
from app.core.seed_finance import seed_finance_data

db = SessionLocal()
try:
    tenants = db.query(Tenant).all()
    for tenant in tenants:
        print(f"Seeding data for tenant {tenant.id} ({tenant.name})...")
        seed_dashboard_data(db, tenant.id)
        seed_finance_data(db, tenant.id)
    print("Dashboard and Finance seeding completed for all tenants successfully.")
finally:
    db.close()
