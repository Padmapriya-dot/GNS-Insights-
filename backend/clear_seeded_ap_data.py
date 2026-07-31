"""
Remove all seeded/dummy Accounts Payable data:
  - VendorBills with bill_number starting with VB-5
  - SupplierPayments referencing those bills
  - Dummy suppliers created by seed_finance.py
  - Dummy Invoices/Payments/Customers/Expenses/Income created by seed scripts
"""

from app.core.database import SessionLocal
from app.models.procurement import VendorBill, SupplierPayment
from app.models.inventory import Supplier
from app.models.sales import Customer, Invoice, Payment
from app.models.accounts import Income, Expense

DUMMY_SUPPLIER_NAMES = [
    "Raw Materials Ltd", "Components Inc", "Quality Suppliers",
    "Bulk Distributors", "Premium Sources", "Industrial Supplies Co"
]

DUMMY_CUSTOMER_NAMES = [
    "Acme Corp", "Global Industries", "Tech Solutions", "Prime Manufacturing",
    "Apex Industries", "Elite Enterprises", "Unity Corp", "Nexus Systems"
]

db = SessionLocal()
try:
    total_deleted = {}

    # 1. Delete seeded VendorBills (bill_number starts with 'VB-5')
    seeded_bills = db.query(VendorBill).filter(VendorBill.bill_number.like("VB-5%")).all()
    seeded_bill_numbers = [b.bill_number for b in seeded_bills]
    bill_count = len(seeded_bills)
    for b in seeded_bills:
        db.delete(b)
    db.flush()
    total_deleted["VendorBills"] = bill_count

    # 2. Delete seeded SupplierPayments whose reference is a seeded bill number
    sp_count = 0
    if seeded_bill_numbers:
        seeded_payments = db.query(SupplierPayment).filter(
            SupplierPayment.reference.in_(seeded_bill_numbers)
        ).all()
        sp_count = len(seeded_payments)
        for p in seeded_payments:
            db.delete(p)
        db.flush()
    total_deleted["SupplierPayments"] = sp_count

    # 3. Delete dummy Suppliers
    dummy_suppliers = db.query(Supplier).filter(Supplier.name.in_(DUMMY_SUPPLIER_NAMES)).all()
    sup_count = len(dummy_suppliers)
    for s in dummy_suppliers:
        db.delete(s)
    db.flush()
    total_deleted["Suppliers"] = sup_count

    # 4. Delete seeded Invoices (invoice_number starts with 'INV-1')
    seeded_invoices = db.query(Invoice).filter(Invoice.invoice_number.like("INV-1%")).all()
    inv_ids = [i.id for i in seeded_invoices]
    inv_count = len(seeded_invoices)

    # Delete related Payments first
    pay_count = 0
    if inv_ids:
        related_payments = db.query(Payment).filter(Payment.invoice_id.in_(inv_ids)).all()
        pay_count = len(related_payments)
        for p in related_payments:
            db.delete(p)
        db.flush()

    for inv in seeded_invoices:
        db.delete(inv)
    db.flush()
    total_deleted["Invoices"] = inv_count
    total_deleted["InvoicePayments"] = pay_count

    # 5. Delete dummy Customers
    dummy_customers = db.query(Customer).filter(Customer.name.in_(DUMMY_CUSTOMER_NAMES)).all()
    cust_count = len(dummy_customers)
    for c in dummy_customers:
        db.delete(c)
    db.flush()
    total_deleted["Customers"] = cust_count

    # 6. Delete seeded Expenses (description contains 'expense on')
    seeded_expenses = db.query(Expense).filter(Expense.description.like("% expense on %")).all()
    exp_count = len(seeded_expenses)
    for e in seeded_expenses:
        db.delete(e)
    db.flush()
    total_deleted["Expenses"] = exp_count

    # 7. Delete seeded Income (description matches seed pattern)
    seeded_income = db.query(Income).filter(Income.description.like("% on 20%")).all()
    inc_count = len(seeded_income)
    for i in seeded_income:
        db.delete(i)
    db.flush()
    total_deleted["Income"] = inc_count

    db.commit()
    print("Seeded/dummy data deleted successfully!")
    for k, v in total_deleted.items():
        print(f"  {k}: {v} records removed")

finally:
    db.close()
