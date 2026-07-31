from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Income(Base, TimestampMixin):
    """Revenue from non-invoice sources (e.g. Website Sales, Consulting)."""
    __tablename__ = "income"

    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(128), nullable=False)  # e.g. "Website Sales"
    source: Mapped[str | None] = mapped_column(String(255))  # e.g. customer/vendor name
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    income_date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


class Expense(Base, TimestampMixin):
    """Cost/expense tracking for P&L."""
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(128), nullable=False)  # e.g. "Store Rental"
    vendor: Mapped[str | None] = mapped_column(String(255))  # e.g. "Supplier #1"
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

class JournalEntry(Base, TimestampMixin):
    """General Journal Entry."""
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id"), nullable=False, index=True
    )
    entry_number: Mapped[str] = mapped_column(String(64), nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    reference: Mapped[str | None] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="Posted", nullable=False)  # Posted, Draft
    branch: Mapped[str | None] = mapped_column(String(128))

    legs = relationship("JournalLeg", back_populates="entry", cascade="all, delete-orphan")


class JournalLeg(Base, TimestampMixin):
    """Single debit/credit leg of a Journal Entry."""
    __tablename__ = "journal_legs"

    id: Mapped[int] = mapped_column(primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey("journal_entries.id"), nullable=False)
    account: Mapped[str] = mapped_column(String(255), nullable=False)
    debit: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    credit: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)

    entry = relationship("JournalEntry", back_populates="legs")


class GLAccount(Base, TimestampMixin):
    """General Ledger Account (Chart of Accounts)."""
    __tablename__ = "gl_accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent: Mapped[str] = mapped_column(String(255), default="Current Assets", nullable=False)
    type: Mapped[str] = mapped_column(String(64), default="Assets", nullable=False)  # Assets, Liabilities, Equity, Revenue, Expenses
    balance: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False)
    meta: Mapped[str | None] = mapped_column(Text)


class FixedAsset(Base, TimestampMixin):
    """Fixed Asset Tracking & Depreciation."""
    __tablename__ = "fixed_assets"

    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    purchase_date: Mapped[date] = mapped_column(Date, nullable=False)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    salvage: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    life: Mapped[int] = mapped_column(Integer, nullable=False)
    method: Mapped[str] = mapped_column(String(64), default="Straight Line", nullable=False)
    accum_dep: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)



