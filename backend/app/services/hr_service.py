from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.hr import (
    AttendanceRecord,
    Employee,
    HrAsset,
    LeaveRequest,
    PayrollRecord,
    PerformanceReview,
    SafetyIncident,
    Shift,
)
from app.schemas.hr import (
    AttendanceRecordCreate,
    EmployeeCreate,
    HrAssetCreate,
    HrAssetUpdate,
    LeaveRequestCreate,
    LeaveRequestUpdate,
    PayrollRecordCreate,
    PerformanceReviewCreate,
    SafetyIncidentCreate,
    SafetyIncidentUpdate,
    ShiftCreate,
)


def _calc_work_overtime(work_hours: float, capacity_hours: float) -> tuple[float, float]:
    if work_hours <= capacity_hours:
        return work_hours, 0.0
    return float(capacity_hours), work_hours - capacity_hours


def create_employee(db: Session, payload: EmployeeCreate) -> Employee:
    emp = Employee(**payload.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


def list_employees(db: Session, tenant_id: int) -> list[Employee]:
    stmt = select(Employee).where(Employee.tenant_id == tenant_id, Employee.is_active)
    return list(db.scalars(stmt).all())


def create_shift(db: Session, payload: ShiftCreate) -> Shift:
    shift = Shift(**payload.model_dump())
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


def list_shifts(db: Session, tenant_id: int) -> list[Shift]:
    stmt = select(Shift).where(Shift.tenant_id == tenant_id)
    return list(db.scalars(stmt).all())


def create_attendance_record(
    db: Session, payload: AttendanceRecordCreate
) -> AttendanceRecord:
    rec = AttendanceRecord(**payload.model_dump())
    capacity = payload.capacity_hours
    if payload.work_hours is not None:
        reg, ot = _calc_work_overtime(payload.work_hours, capacity)
        rec.work_hours = payload.work_hours
        rec.overtime_hours = ot
        rec.capacity_hours = capacity
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def record_clock_in(db: Session, tenant_id: int, employee_id: int, record_date: date) -> AttendanceRecord:
    existing = db.scalars(
        select(AttendanceRecord).where(
            AttendanceRecord.tenant_id == tenant_id,
            AttendanceRecord.employee_id == employee_id,
            AttendanceRecord.record_date == record_date,
        )
    ).first()
    if existing:
        existing.clock_in = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    rec = AttendanceRecord(
        tenant_id=tenant_id,
        employee_id=employee_id,
        record_date=record_date,
        clock_in=datetime.utcnow(),
        capacity_hours=8.0,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def record_clock_out(
    db: Session, tenant_id: int, employee_id: int, record_date: date
) -> AttendanceRecord | None:
    rec = db.scalars(
        select(AttendanceRecord).where(
            AttendanceRecord.tenant_id == tenant_id,
            AttendanceRecord.employee_id == employee_id,
            AttendanceRecord.record_date == record_date,
        )
    ).first()
    if not rec or not rec.clock_in:
        return None
    rec.clock_out = datetime.utcnow()
    if rec.clock_in and rec.clock_out:
        delta = rec.clock_out - rec.clock_in
        work_hours = max(0, delta.total_seconds() / 3600 - rec.break_minutes / 60)
        cap = rec.capacity_hours
        reg, ot = _calc_work_overtime(work_hours, cap)
        rec.work_hours = work_hours
        rec.overtime_hours = ot
    db.commit()
    db.refresh(rec)
    return rec


def list_attendance(
    db: Session,
    tenant_id: int,
    date_from: date | None = None,
    date_to: date | None = None,
    employee_id: int | None = None,
) -> list[AttendanceRecord]:
    stmt = select(AttendanceRecord).where(AttendanceRecord.tenant_id == tenant_id)
    if date_from:
        stmt = stmt.where(AttendanceRecord.record_date >= date_from)
    if date_to:
        stmt = stmt.where(AttendanceRecord.record_date <= date_to)
    if employee_id:
        stmt = stmt.where(AttendanceRecord.employee_id == employee_id)
    stmt = stmt.order_by(AttendanceRecord.record_date.desc())
    return list(db.scalars(stmt).all())


def create_payroll_record(db: Session, payload: PayrollRecordCreate) -> PayrollRecord:
    pr = PayrollRecord(**payload.model_dump())
    db.add(pr)
    db.commit()
    db.refresh(pr)
    return pr


def update_payroll_status(db: Session, tenant_id: int, payroll_id: int, new_status: str) -> PayrollRecord | None:
    pr = db.scalar(
        select(PayrollRecord).where(
            PayrollRecord.tenant_id == tenant_id, PayrollRecord.id == payroll_id
        )
    )
    if not pr:
        return None
    pr.status = new_status
    db.commit()
    db.refresh(pr)
    return pr


def list_payroll(
    db: Session,
    tenant_id: int,
    employee_id: int | None = None,
    period_start: date | None = None,
    period_end: date | None = None,
) -> list[PayrollRecord]:
    stmt = select(PayrollRecord).where(PayrollRecord.tenant_id == tenant_id)
    if employee_id:
        stmt = stmt.where(PayrollRecord.employee_id == employee_id)
    if period_start:
        stmt = stmt.where(PayrollRecord.period_end >= period_start)
    if period_end:
        stmt = stmt.where(PayrollRecord.period_start <= period_end)
    stmt = stmt.order_by(PayrollRecord.period_end.desc())
    return list(db.scalars(stmt).all())


def create_performance_review(
    db: Session, payload: PerformanceReviewCreate
) -> PerformanceReview:
    pr = PerformanceReview(**payload.model_dump())
    db.add(pr)
    db.commit()
    db.refresh(pr)
    return pr


def list_performance_reviews(
    db: Session, tenant_id: int, employee_id: int | None = None
) -> list[PerformanceReview]:
    stmt = select(PerformanceReview).where(PerformanceReview.tenant_id == tenant_id)
    if employee_id:
        stmt = stmt.where(PerformanceReview.employee_id == employee_id)
    stmt = stmt.order_by(PerformanceReview.review_period.desc())
    return list(db.scalars(stmt).all())


def get_hr_dashboard(db: Session, tenant_id: int) -> dict:
    emp_count = db.scalar(select(func.count(Employee.id)).where(
        Employee.tenant_id == tenant_id, Employee.is_active
    )) or 0
    attendance_today = db.scalar(
        select(func.count(AttendanceRecord.id)).where(
            AttendanceRecord.tenant_id == tenant_id,
            AttendanceRecord.record_date == date.today(),
        )
    ) or 0
    total_overtime = db.scalar(
        select(func.coalesce(func.sum(AttendanceRecord.overtime_hours), 0)).where(
            AttendanceRecord.tenant_id == tenant_id,
            AttendanceRecord.record_date >= date.today() - timedelta(days=30),
        )
    ) or 0
    payroll_pending = db.scalar(
        select(func.count(PayrollRecord.id)).where(
            PayrollRecord.tenant_id == tenant_id, PayrollRecord.status == "draft"
        )
    ) or 0
    leave_pending = db.scalar(
        select(func.count(LeaveRequest.id)).where(
            LeaveRequest.tenant_id == tenant_id, LeaveRequest.status == "pending"
        )
    ) or 0
    return {
        "headcount": emp_count,
        "attendance_today": attendance_today,
        "total_overtime_30d": float(total_overtime),
        "payroll_pending": payroll_pending,
        "leave_pending": leave_pending,
    }


def _leave_days(start: date, end: date) -> float:
    return float((end - start).days + 1)


def create_leave_request(db: Session, payload: LeaveRequestCreate) -> LeaveRequest:
    data = payload.model_dump()
    if payload.end_date < payload.start_date:
        raise ValueError("end_date must be on or after start_date")
    data["days"] = _leave_days(payload.start_date, payload.end_date)
    leave = LeaveRequest(**data)
    db.add(leave)
    db.commit()
    db.refresh(leave)
    try:
        from app.services.alert_event_service import emit_alert

        emit_alert(
            db,
            tenant_id=leave.tenant_id,
            alert_type="leave_request",
            title="Leave request submitted",
            message=f"Leave request #{leave.id} — {leave.days} day(s)",
            severity="medium",
            link="/hr/leave",
            reference_type="leave_request",
            reference_id=leave.id,
            created_by="HR",
        )
    except Exception:
        pass
    return leave


def list_leave_requests(
    db: Session,
    tenant_id: int,
    employee_id: int | None = None,
    status: str | None = None,
) -> list[LeaveRequest]:
    stmt = select(LeaveRequest).where(LeaveRequest.tenant_id == tenant_id)
    if employee_id:
        stmt = stmt.where(LeaveRequest.employee_id == employee_id)
    if status:
        stmt = stmt.where(LeaveRequest.status == status)
    stmt = stmt.order_by(LeaveRequest.start_date.desc())
    return list(db.scalars(stmt).all())


def update_leave_request(
    db: Session, tenant_id: int, leave_id: int, payload: LeaveRequestUpdate
) -> LeaveRequest | None:
    leave = db.scalars(
        select(LeaveRequest).where(
            LeaveRequest.id == leave_id, LeaveRequest.tenant_id == tenant_id
        )
    ).first()
    if not leave:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(leave, field, value)
    db.commit()
    db.refresh(leave)
    return leave


# ── HR Assets ──────────────────────────────────────────────────────────────


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


# ── Safety Incidents ───────────────────────────────────────────────────────


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
