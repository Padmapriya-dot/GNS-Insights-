import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.models.maintenance import (
    BreakdownReport,
    MaintenanceRecord,
    MaintenanceSchedule,
    PreventiveMaintenance,
)
from app.schemas.maintenance import (
    VALID_BREAKDOWN_STATUSES,
    BreakdownReportCreate,
    MaintenanceRecordCreate,
    MaintenanceScheduleCreate,
    PreventiveMaintenanceCreate,
)


def create_maintenance_record(db: Session, payload: MaintenanceRecordCreate) -> MaintenanceRecord:
    try:
        mr = MaintenanceRecord(**payload.model_dump())
        db.add(mr)
        db.commit()
        db.refresh(mr)
    except Exception as exc:
        logger.exception("Database error creating maintenance record: %s", exc)
        try:
            db.rollback()
        except Exception:
            pass
        raise

    try:
        from app.services.alert_event_service import emit_alert

        emit_alert(
            db,
            tenant_id=mr.tenant_id,
            alert_type="machine_service_completed",
            title="Machine service recorded",
            message=getattr(mr, "notes", None) or f"Maintenance record #{mr.id}",
            severity="low",
            link="/maintenance",
            reference_type="maintenance_record",
            reference_id=mr.id,
            created_by="Maintenance",
        )
    except Exception as exc:
        logger.exception("Failed to emit alert for maintenance record id=%s: %s", mr.id, exc)
        try:
            db.rollback()
        except Exception:
            pass
    return mr


def list_maintenance_records(db: Session, tenant_id: int) -> list[MaintenanceRecord]:
    stmt = select(MaintenanceRecord).where(MaintenanceRecord.tenant_id == tenant_id)
    return list(db.scalars(stmt).all())


def create_preventive_maintenance(db: Session, payload: PreventiveMaintenanceCreate) -> PreventiveMaintenance:
    try:
        pm = PreventiveMaintenance(**payload.model_dump())
        db.add(pm)
        db.commit()
        db.refresh(pm)
    except Exception as exc:
        logger.exception("Database error creating preventive maintenance: %s", exc)
        try:
            db.rollback()
        except Exception:
            pass
        raise

    try:
        from app.services.alert_event_service import emit_alert

        emit_alert(
            db,
            tenant_id=pm.tenant_id,
            alert_type="preventive_maintenance_due",
            title="Preventive maintenance scheduled",
            message=getattr(pm, "description", None) or f"PM record #{pm.id}",
            severity="medium",
            link="/maintenance/preventive",
            reference_type="preventive_maintenance",
            reference_id=pm.id,
            created_by="Maintenance",
        )
    except Exception as exc:
        logger.exception("Failed to emit alert for preventive maintenance id=%s: %s", pm.id, exc)
        try:
            db.rollback()
        except Exception:
            pass
    return pm


def list_preventive_maintenance(db: Session, tenant_id: int) -> list[PreventiveMaintenance]:
    stmt = select(PreventiveMaintenance).where(PreventiveMaintenance.tenant_id == tenant_id)
    return list(db.scalars(stmt).all())


def create_breakdown_report(db: Session, payload: BreakdownReportCreate) -> BreakdownReport:
    try:
        br = BreakdownReport(**payload.model_dump())
        db.add(br)
        db.commit()
        db.refresh(br)
    except Exception as exc:
        logger.exception("Database error creating breakdown report: %s", exc)
        try:
            db.rollback()
        except Exception:
            pass
        raise

    try:
        from app.services.alert_event_service import emit_alert

        emit_alert(
            db,
            tenant_id=br.tenant_id,
            alert_type="machine_breakdown",
            title="Machine breakdown reported",
            message=getattr(br, "description", None) or f"Breakdown report #{br.id}",
            severity="critical",
            link="/alerts/machine-failure",
            reference_type="breakdown_report",
            reference_id=br.id,
            created_by="Maintenance",
        )
    except Exception as exc:
        logger.exception("Failed to emit alert for breakdown report id=%s: %s", br.id, exc)
        try:
            db.rollback()
        except Exception:
            pass
    return br


def list_breakdown_reports(db: Session, tenant_id: int) -> list[BreakdownReport]:
    stmt = select(BreakdownReport).where(BreakdownReport.tenant_id == tenant_id)
    return list(db.scalars(stmt).all())


def update_breakdown_status(
    db: Session, tenant_id: int, breakdown_id: int, status: str
) -> BreakdownReport | None:
    s = (status or "").strip().lower()
    if s not in VALID_BREAKDOWN_STATUSES:
        raise ValueError(f"Invalid breakdown status '{status}'. Must be one of {', '.join(sorted(VALID_BREAKDOWN_STATUSES))}.")
    try:
        br = db.scalars(
            select(BreakdownReport).where(
                BreakdownReport.id == breakdown_id,
                BreakdownReport.tenant_id == tenant_id,
            )
        ).first()
        if not br:
            return None
        br.status = s
        db.commit()
        db.refresh(br)
        return br
    except Exception as exc:
        logger.exception("Database error updating breakdown status id=%s: %s", breakdown_id, exc)
        try:
            db.rollback()
        except Exception:
            pass
        raise


def create_maintenance_schedule(db: Session, payload: MaintenanceScheduleCreate) -> MaintenanceSchedule:
    try:
        ms = MaintenanceSchedule(**payload.model_dump())
        db.add(ms)
        db.commit()
        db.refresh(ms)
        return ms
    except Exception as exc:
        logger.exception("Database error creating maintenance schedule: %s", exc)
        try:
            db.rollback()
        except Exception:
            pass
        raise


def list_maintenance_schedules(db: Session, tenant_id: int) -> list[MaintenanceSchedule]:
    stmt = select(MaintenanceSchedule).where(MaintenanceSchedule.tenant_id == tenant_id)
    return list(db.scalars(stmt).all())
