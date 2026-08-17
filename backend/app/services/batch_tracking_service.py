"""Batch tracking — summary, enriched list, traceability detail."""

import logging
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.machine import Machine
from app.models.product import Product
from app.models.production import Batch, ProductionOrder, WorkOrder
from app.models.user import User
from app.schemas.batch_tracking import (
    BatchDetailRead,
    BatchListRead,
    BatchSummaryRead,
    BatchTraceStepRead,
)

logger = logging.getLogger(__name__)


def get_batch_summary(db: Session, tenant_id: int) -> BatchSummaryRead:
    try:
        batches = list(db.scalars(select(Batch).where(Batch.tenant_id == tenant_id)).all())
        counts = {"in_process": 0, "running": 0, "completed": 0, "hold": 0, "rejected": 0, "expired": 0}
        for b in batches:
            s = (b.status or "in_process").lower()
            if s in ("in_process", "running"):
                counts["running"] += 1
            elif s in ("hold", "on_hold"):
                counts["hold"] += 1
            elif s in counts:
                counts[s] += 1
            else:
                counts["running"] += 1
        return BatchSummaryRead(
            total_batches=len(batches),
            running=counts.get("running", 0),
            completed=counts.get("completed", 0),
            hold=counts.get("hold", 0),
            rejected=counts.get("rejected", 0),
            expired=counts.get("expired", 0),
        )
    except SQLAlchemyError as exc:
        logger.exception("Database error retrieving batch summary for tenant_id=%s: %s", tenant_id, exc)
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=503, detail="Database connection unavailable. Unable to retrieve batch summary.") from exc
    except Exception as exc:
        logger.exception("Unexpected error retrieving batch summary for tenant_id=%s: %s", tenant_id, exc)
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Failed to retrieve batch summary.") from exc


def list_batches_enriched(db: Session, tenant_id: int) -> list[BatchListRead]:
    try:
        batches = list(
            db.scalars(
                select(Batch).where(Batch.tenant_id == tenant_id).order_by(Batch.id.desc())
            ).all()
        )
        result = []
        for b in batches:
            wo = db.get(WorkOrder, b.work_order_id)
            product_name = "—"
            wo_num = None
            qty = float(b.quantity or 0)
            from app.models.production import DailyProductionReport
            scrap_from_report = float(db.scalar(
                select(func.coalesce(func.sum(DailyProductionReport.scrap_quantity), 0)).where(
                    DailyProductionReport.tenant_id == tenant_id,
                    DailyProductionReport.work_order_id == b.work_order_id,
                )
            ) or 0) if b.work_order_id else 0.0

            raw_scrap = getattr(b, "scrap_quantity", None) or getattr(b, "scrap_qty", None) or scrap_from_report or (getattr(wo, "scrap_quantity", None) if wo else None)
            scrap = round(float(raw_scrap or 0.0), 2)
            raw_good = getattr(b, "good_quantity", None) or getattr(b, "good_qty", None)
            good = round(float(raw_good), 2) if raw_good is not None else round(max(0.0, qty - scrap), 2)
            if wo:
                wo_num = wo.work_order_number
                po = db.get(ProductionOrder, wo.production_order_id)
                if po:
                    product = db.get(Product, po.product_id)
                    product_name = product.name if product else "—"
            result.append(
                BatchListRead(
                    id=b.id,
                    batch_code=b.batch_code,
                    product_name=product_name,
                    work_order_number=wo_num,
                    production_date=b.produced_at.isoformat() if b.produced_at else None,
                    quantity=float(b.quantity or 0),
                    good_qty=round(good, 2),
                    scrap_qty=round(scrap, 2),
                    status=b.status,
                )
            )
        return result
    except SQLAlchemyError as exc:
        logger.exception("Database error listing enriched batches for tenant_id=%s: %s", tenant_id, exc)
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=503, detail="Database connection unavailable. Unable to list batches.") from exc
    except Exception as exc:
        logger.exception("Unexpected error listing enriched batches for tenant_id=%s: %s", tenant_id, exc)
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Failed to list batches.") from exc


def get_batch_detail(db: Session, tenant_id: int, batch_id: int) -> BatchDetailRead | None:
    try:
        b = db.scalars(
            select(Batch).where(Batch.id == batch_id, Batch.tenant_id == tenant_id)
        ).first()
        if not b:
            return None
        wo = db.get(WorkOrder, b.work_order_id)
        po = db.get(ProductionOrder, wo.production_order_id) if wo else None
        product = db.get(Product, po.product_id) if po else None
        machine = db.get(Machine, wo.machine_id) if wo and wo.machine_id else None
        operator = db.get(User, wo.assigned_user_id) if wo and wo.assigned_user_id else None
        qty = float(b.quantity or 0)
        from app.models.production import DailyProductionReport
        scrap_from_report = float(db.scalar(
            select(func.coalesce(func.sum(DailyProductionReport.scrap_quantity), 0)).where(
                DailyProductionReport.tenant_id == tenant_id,
                DailyProductionReport.work_order_id == b.work_order_id,
            )
        ) or 0) if b.work_order_id else 0.0

        raw_scrap = getattr(b, "scrap_quantity", None) or getattr(b, "scrap_qty", None) or scrap_from_report or (getattr(wo, "scrap_quantity", None) if wo else None)
        scrap = round(float(raw_scrap or 0.0), 2)
        raw_good = getattr(b, "good_quantity", None) or getattr(b, "good_qty", None)
        good = round(float(raw_good), 2) if raw_good is not None else round(max(0.0, qty - scrap), 2)
        ts = b.produced_at.isoformat() if b.produced_at else datetime.now(timezone.utc).isoformat()
        mat_lot = (
            getattr(b, "material_lot", None)
            or getattr(b, "raw_material_lot", None)
            or getattr(b, "lot_number", None)
            or (getattr(wo, "material_lot", None) if wo else None)
        )
        if not mat_lot and b.batch_code:
            from app.models.inventory import StockMovement
            sm = db.scalars(
                select(StockMovement).where(
                    StockMovement.tenant_id == tenant_id,
                    StockMovement.batch_number == b.batch_code,
                )
            ).first()
            if sm:
                mat_lot = sm.reference or sm.batch_number

        from app.models.quality import QualityInspection
        qi_rec = db.scalars(
            select(QualityInspection).where(
                QualityInspection.tenant_id == tenant_id,
                (QualityInspection.batch_id == b.id) | (QualityInspection.batch_code == b.batch_code),
            ).order_by(QualityInspection.id.desc())
        ).first()

        if qi_rec:
            res = (qi_rec.result or qi_rec.status or "").lower()
            if res in ("pass", "passed", "approved"):
                qc_status = "passed"
            elif res in ("fail", "failed", "rejected"):
                qc_status = "failed"
            elif res:
                qc_status = res
            else:
                qc_status = "pending"
        else:
            raw_qc = getattr(b, "qc_status", None)
            qc_status = raw_qc if raw_qc else ("passed" if b.status in ("completed", "closed", "approved") else "pending")

        from app.models.sales import SalesOrder
        dispatch_sm = db.scalars(
            select(StockMovement).where(
                StockMovement.tenant_id == tenant_id,
                StockMovement.batch_number == b.batch_code,
                StockMovement.movement_type.in_(("out", "sales", "dispatch", "shipment")),
            )
        ).first()

        so = None
        if po and getattr(po, "sales_order_id", None):
            so = db.get(SalesOrder, po.sales_order_id)

        if dispatch_sm or (so and getattr(so, "shipped", False)) or getattr(b, "dispatched", False):
            dispatch_status = "dispatched"
        elif so and getattr(so, "status", None):
            dispatch_status = so.status
        elif getattr(b, "dispatch_status", None):
            dispatch_status = getattr(b, "dispatch_status")
        else:
            dispatch_status = "pending"

        trace = [
            BatchTraceStepRead(step="Raw Material", status="completed", detail=mat_lot or "—", timestamp=ts),
            BatchTraceStepRead(step="BOM", status="completed", detail=po.bom_version if po else "BOM-v1", timestamp=ts),
            BatchTraceStepRead(step="Production", status="completed" if b.status == "completed" else "running", detail=machine.name if machine else "—", timestamp=ts),
            BatchTraceStepRead(step="QC", status=qc_status, detail=qi_rec.inspection_number if qi_rec else "—", timestamp=ts),
            BatchTraceStepRead(step="Packing", status="completed" if so and getattr(so, "packed", False) else "pending", detail=None, timestamp=None),
            BatchTraceStepRead(step="Dispatch", status=dispatch_status, detail=so.order_number if so else None, timestamp=None),
            BatchTraceStepRead(step="Customer", status="completed" if dispatch_status == "dispatched" else "pending", detail=po.customer_name if po else None, timestamp=None),
        ]
        return BatchDetailRead(
            id=b.id,
            batch_code=b.batch_code,
            product_name=product.name if product else "—",
            customer_name=po.customer_name if po else None,
            production_order_number=po.order_number if po else None,
            work_order_number=wo.work_order_number if wo else None,
            machine_name=machine.name if machine else None,
            operator_name=operator.full_name if operator else None,
            shift=wo.shift if wo else None,
            material_lot=mat_lot,
            qc_status=qc_status,
            dispatch_status=dispatch_status,
            invoice_number=None,
            quantity=float(b.quantity or 0),
            good_qty=round(good, 2),
            scrap_qty=round(scrap, 2),
            status=b.status,
            produced_at=b.produced_at,
            traceability=trace,
        )
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        logger.exception(
            "Database error retrieving batch_id=%s for tenant_id=%s: %s",
            batch_id, tenant_id, exc,
        )
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable. Unable to retrieve batch detail.",
        ) from exc
    except Exception as exc:
        logger.exception(
            "Unexpected error retrieving batch_id=%s for tenant_id=%s: %s",
            batch_id, tenant_id, exc,
        )
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve batch detail.",
        ) from exc
