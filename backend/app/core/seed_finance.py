"""Seed realistic finance data for testing the finance dashboard."""

import random
from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tenant import Tenant
from app.models.sales import Customer, Invoice, Payment
from app.models.procurement import SupplierPayment, VendorBill
from app.models.inventory import Supplier
from app.models.accounts import Income, Expense


def seed_finance_data(db: Session, tenant_id: int = 1):
    """Seed invoices, payments, vendors, expenses and income for finance dashboard."""
    # Ensure tenant exists
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        print("Tenant 1 does not exist, skipping finance seeding.")
        return

    print("Seeding finance data...")

    # 1. Seed Customers if they don't exist
    customer_names = [
        "Acme Corp", "Global Industries", "Tech Solutions", "Prime Manufacturing",
        "Apex Industries", "Elite Enterprises", "Unity Corp", "Nexus Systems"
    ]
    customers = []
    for name in customer_names:
        existing = db.scalars(
            select(Customer).where(Customer.tenant_id == tenant_id, Customer.name == name)
        ).first()
        if not existing:
            customer = Customer(
                tenant_id=tenant_id,
                name=name,
                email=f"{name.lower().replace(' ', '')}@example.com",
                phone="9876543210",
                status="active"
            )
            db.add(customer)
            db.flush()
            customers.append(customer)
        else:
            customers.append(existing)

    # 2. Seed Suppliers if they don't exist
    supplier_names = [
        "Raw Materials Ltd", "Components Inc", "Quality Suppliers",
        "Bulk Distributors", "Premium Sources", "Industrial Supplies Co"
    ]
    suppliers = []
    for name in supplier_names:
        existing = db.scalars(
            select(Supplier).where(Supplier.tenant_id == tenant_id, Supplier.name == name)
        ).first()
        if not existing:
            supplier = Supplier(
                tenant_id=tenant_id,
                name=name,
                email=f"{name.lower().replace(' ', '')}@supplier.com",
                phone="9123456789",
                status="active"
            )
            db.add(supplier)
            db.flush()
            suppliers.append(supplier)
        else:
            suppliers.append(existing)

    # 3. Seed Invoices (last 6 months)
    today = date.today()
    for i in range(30):  # Create 30 invoices
        days_ago = random.randint(0, 180)
        issue_date = today - timedelta(days=days_ago)
        due_date = issue_date + timedelta(days=random.randint(15, 45))
        
        subtotal = random.choice([50000, 75000, 100000, 150000, 200000, 250000, 300000])
        sgst_amount = subtotal * 0.09
        cgst_amount = subtotal * 0.09
        igst_amount = 0  # Using SGST+CGST for within-state
        grand_total = subtotal + sgst_amount + cgst_amount + igst_amount
        
        # Randomly mark some as paid
        status = random.choice(["paid", "paid", "pending", "sent"])
        amount_paid = grand_total if status == "paid" else 0
        
        invoice = Invoice(
            tenant_id=tenant_id,
            customer_id=random.choice(customers).id,
            invoice_number=f"INV-{1000 + i}",
            issue_date=issue_date,
            due_date=due_date,
            subtotal=subtotal,
            discount=0,
            sgst_pct=9,
            cgst_pct=9,
            igst_pct=0,
            sgst_amount=sgst_amount,
            cgst_amount=cgst_amount,
            igst_amount=igst_amount,
            round_off=0,
            grand_total=grand_total,
            amount_paid=amount_paid,
            status=status
        )
        db.add(invoice)
        db.flush()

        # 4. Seed Payments for paid invoices
        if status == "paid" and random.random() > 0.2:
            payment_date = issue_date + timedelta(days=random.randint(0, 20))
            payment = Payment(
                tenant_id=tenant_id,
                invoice_id=invoice.id,
                amount=grand_total,
                payment_date=payment_date,
                method=random.choice(["online", "bank", "upi", "cheque", "cash"])
            )
            db.add(payment)

    # 5. Seed Vendor Bills (last 6 months)
    for i in range(20):  # Create 20 vendor bills
        days_ago = random.randint(0, 180)
        bill_date = today - timedelta(days=days_ago)
        due_date = bill_date + timedelta(days=random.randint(15, 45))
        
        amount = random.choice([30000, 50000, 75000, 100000, 150000])
        gst_amount = amount * 0.18
        
        status = random.choice(["paid", "paid", "pending", "due"])
        
        vendor_bill = VendorBill(
            tenant_id=tenant_id,
            supplier_id=random.choice(suppliers).id,
            bill_number=f"VB-{5000 + i}",
            bill_date=bill_date,
            due_date=due_date,
            amount=amount,
            gst_amount=gst_amount,
            status=status
        )
        db.add(vendor_bill)
        db.flush()

        # 6. Seed Supplier Payments for paid bills
        if status == "paid" and random.random() > 0.2:
            payment_date = bill_date + timedelta(days=random.randint(0, 20))
            supplier_payment = SupplierPayment(
                tenant_id=tenant_id,
                supplier_id=vendor_bill.supplier_id,
                amount=amount + gst_amount,
                payment_date=payment_date,
                payment_method=random.choice(["bank", "neft", "rtgs", "cheque"]),
                reference=vendor_bill.bill_number
            )
            db.add(supplier_payment)

    # 7. Seed Expenses
    expense_categories = ["Salary", "Utilities", "Maintenance", "Marketing", "Logistics", "Office Supplies"]
    for i in range(25):
        days_ago = random.randint(0, 180)
        expense_date = today - timedelta(days=days_ago)
        
        amount = random.choice([5000, 10000, 15000, 20000, 25000, 50000])
        category = random.choice(expense_categories)
        
        expense = Expense(
            tenant_id=tenant_id,
            category=category,
            vendor=f"Vendor-{random.randint(1, 10)}",
            amount=amount,
            expense_date=expense_date,
            description=f"{category} expense on {expense_date}"
        )
        db.add(expense)

    # 8. Seed Income
    income_categories = ["Service Revenue", "Consulting", "Royalties", "Interest", "Other Income"]
    for i in range(15):
        days_ago = random.randint(0, 180)
        income_date = today - timedelta(days=days_ago)
        
        amount = random.choice([10000, 25000, 50000, 75000, 100000])
        category = random.choice(income_categories)
        
        income = Income(
            tenant_id=tenant_id,
            category=category,
            source=f"Source-{random.randint(1, 5)}",
            amount=amount,
            income_date=income_date,
            description=f"{category} on {income_date}"
        )
        db.add(income)

    db.commit()
    print("Finance data seeded successfully!")
