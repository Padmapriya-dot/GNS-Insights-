from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.hr import Employee, HrAsset, SafetyIncident
from app.schemas.hr import (
    EmployeeCreate,
    HrAssetCreate,
    HrAssetUpdate,
    SafetyIncidentCreate,
    SafetyIncidentUpdate,
)
from app.schemas.hr_extended import EmployeeListRead, EmployeeSummaryRead


def _initials(name: str) -> str:
    parts = (name or "").split()
    return "".join(p[0].upper() for p in parts[:2]) if parts else "?"


def get_employee_summary(db: Session, tenant_id: int) -> EmployeeSummaryRead:
    emps = list(db.scalars(select(Employee).where(Employee.tenant_id == tenant_id, Employee.is_active)).all())
    today = date.today()
    depts = len({e.department for e in emps if e.department})
    contract = sum(1 for e in emps if getattr(e, "employment_type", None) == "contract")
    new_joiners = sum(1 for e in emps if e.hire_date and e.hire_date >= today - timedelta(days=30))
    return EmployeeSummaryRead(
        total_employees=len(emps),
        present_today=0,
        absent=0,
        on_leave=0,
        overtime=0,
        departments=depts,
        contract_employees=contract,
        new_joiners=new_joiners,
    )


def list_employees_enriched(db: Session, tenant_id: int) -> list[EmployeeListRead]:
    emps = list(
        db.scalars(
            select(Employee)
            .where(Employee.tenant_id == tenant_id, Employee.is_active)
            .order_by(Employee.id.desc())
        ).all()
    )
    if not emps:
        return []
    return [
        EmployeeListRead(
            id=e.id,
            employee_id=e.employee_code,
            employee_code=e.employee_code,
            full_name=e.full_name,
            department=e.department,
            designation=getattr(e, "designation", None) or "—",
            shift=getattr(e, "shift_name", None) or "—",
            reporting_manager=getattr(e, "reporting_manager", None),
            employment_type=getattr(e, "employment_type", None) or "permanent",
            status="active" if e.is_active else "inactive",
            phone=getattr(e, "phone", None),
            email=e.email,
            joining_date=e.hire_date.isoformat() if e.hire_date else None,
            salary=float(e.salary) if getattr(e, "salary", None) else (float(e.hourly_rate or 0) * 176),
            initials=_initials(e.full_name),
        )
        for e in emps
    ]


def create_employee(db: Session, payload: EmployeeCreate) -> Employee:
    emp = Employee(**payload.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


def list_employees(db: Session, tenant_id: int) -> list[Employee]:
    stmt = select(Employee).where(Employee.tenant_id == tenant_id, Employee.is_active)
    return list(db.scalars(stmt).all())


def list_hr_assets(db: Session, tenant_id: int) -> list[HrAsset]:
    return list(
        db.scalars(
            select(HrAsset)
            .where(HrAsset.tenant_id == tenant_id)
            .order_by(HrAsset.id.desc())
        ).all()
    )


def create_hr_asset(db: Session, tenant_id: int, payload: HrAssetCreate) -> HrAsset:
    row = HrAsset(tenant_id=tenant_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_hr_asset(
    db: Session, tenant_id: int, asset_id: int, payload: HrAssetUpdate
) -> HrAsset | None:
    row = db.scalars(
        select(HrAsset).where(HrAsset.id == asset_id, HrAsset.tenant_id == tenant_id)
    ).first()
    if not row:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return row


def delete_hr_asset(db: Session, tenant_id: int, asset_id: int) -> bool:
    row = db.scalars(
        select(HrAsset).where(HrAsset.id == asset_id, HrAsset.tenant_id == tenant_id)
    ).first()
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


def list_safety_incidents(db: Session, tenant_id: int) -> list[SafetyIncident]:
    return list(
        db.scalars(
            select(SafetyIncident)
            .where(SafetyIncident.tenant_id == tenant_id)
            .order_by(SafetyIncident.id.desc())
        ).all()
    )


def create_safety_incident(
    db: Session, tenant_id: int, payload: SafetyIncidentCreate
) -> SafetyIncident:
    row = SafetyIncident(tenant_id=tenant_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_safety_incident(
    db: Session, tenant_id: int, incident_id: int, payload: SafetyIncidentUpdate
) -> SafetyIncident | None:
    row = db.scalars(
        select(SafetyIncident).where(
            SafetyIncident.id == incident_id, SafetyIncident.tenant_id == tenant_id
        )
    ).first()
    if not row:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return row


def delete_safety_incident(db: Session, tenant_id: int, incident_id: int) -> bool:
    row = db.scalars(
        select(SafetyIncident).where(
            SafetyIncident.id == incident_id, SafetyIncident.tenant_id == tenant_id
        )
    ).first()
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True
