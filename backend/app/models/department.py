from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    department_type: Mapped[str] = mapped_column(String(64), default="production", nullable=False)
    plant: Mapped[str | None] = mapped_column(String(128))
    branch: Mapped[str | None] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    manager_name: Mapped[str | None] = mapped_column(String(255))
    manager_mobile: Mapped[str | None] = mapped_column(String(64))
    manager_email: Mapped[str | None] = mapped_column(String(255))
    manager_designation: Mapped[str | None] = mapped_column(String(128))
    employee_count: Mapped[int | None] = mapped_column(Integer, default=0)
    machine_count: Mapped[int | None] = mapped_column(Integer, default=0)
    work_center_count: Mapped[int | None] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
