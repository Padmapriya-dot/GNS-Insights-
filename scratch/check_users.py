import sys
import os

sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

from app.core.database import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password

db = SessionLocal()
users = db.query(User).all()

print("Registered Users:")
teju_user = None
for u in users:
    print(f"ID: {u.id} | Name: {u.full_name} | Email: {u.email}")
    if "teju" in u.email.lower() or "tejaswi" in u.full_name.lower():
        teju_user = u

if teju_user:
    print(f"\nFound Tejaswi: ID={teju_user.id}, Email={teju_user.email}")
