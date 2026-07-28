from datetime import date, datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.machine import Machine, MachineStatusEvent
from app.models.product import Product
from app.models.production import (
    Batch,
    DailyProductionReport,
    ProductionOrder,
    WorkOrder,
)
from app.models.quality import BatchQualityReport
from app.models.user import User
from app.services.data_scope import (
    operator_can_access_work_order,
    production_manager_plant,
    scope_daily_reports,
    scope_work_orders,
)
from app.schemas.production import (
    BatchCreate,
    DailyProductionReportCreate,
    MachineCreate,
    MachineStatusEventCreate,
    ProductionOrderCreate,
    WorkOrderCreate,
    WorkOrderQuickCreate,
)


def list_products(db: Session, tenant_id: int) -> list[Product]:
    stmt = select(Product).where(Product.tenant_id == tenant_id).order_by(Product.name)
    return list(db.scalars(stmt).all())


def create_production_order(db: Session, payload: ProductionOrderCreate) -> ProductionOrder:
    order_num = payload.order_number.strip() if payload.order_number else ""
    stmt = select(ProductionOrder).where(
        ProductionOrder.tenant_id == payload.tenant_id,
        (ProductionOrder.order_number == order_num) | (ProductionOrder.product_id == payload.product_id),
    )
    existing = db.scalars(stmt).first()
    if existing:
        existing.planned_quantity = payload.planned_quantity
        if payload.priority:
            existing.priority = payload.priority
        if payload.start_date:
            existing.start_date = payload.start_date
        if payload.due_date:
            existing.due_date = payload.due_date
        if payload.customer_name:
            existing.customer_name = payload.customer_name
        if payload.bom_version:
            existing.bom_version = payload.bom_version
        if payload.shift:
            existing.shift = payload.shift
        if payload.machine_id:
            existing.machine_id = payload.machine_id
            wo = db.scalars(select(WorkOrder).where(WorkOrder.production_order_id == existing.id, WorkOrder.tenant_id == existing.tenant_id)).first()
            if wo:
                wo.machine_id = payload.machine_id
        db.commit()
        db.refresh(existing)
        return existing

    data = payload.model_dump()
    actual_qty = data.get("actual_quantity") if data.get("actual_quantity") is not None else data.get("produced_quantity")
    if "produced_quantity" in data:
        data.pop("produced_quantity", None)
    if actual_qty is not None:
        data["actual_quantity"] = actual_qty
    order = ProductionOrder(**data)
    db.add(order)
    db.commit()
    db.refresh(order)
    if payload.machine_id:
        wo = WorkOrder(
            tenant_id=order.tenant_id,
            production_order_id=order.id,
            work_order_number=f"WO-{order.order_number}",
            planned_quantity=order.planned_quantity,
            actual_quantity=actual_qty,
            machine_id=payload.machine_id,
            status="in_progress" if (actual_qty and actual_qty > 0) else "planned"
        )
        db.add(wo)
        db.commit()
    return order


def list_production_orders(db: Session, tenant_id: int) -> list[ProductionOrder]:
    stmt = select(ProductionOrder).where(ProductionOrder.tenant_id == tenant_id)
    return list(db.scalars(stmt).all())


def update_work_order_status(
    db: Session, wo_id: int, tenant_id: int, status: str
) -> WorkOrder | None:
    wo = db.scalars(
        select(WorkOrder).where(WorkOrder.id == wo_id, WorkOrder.tenant_id == tenant_id)
    ).first()
    if not wo:
        return None
    wo.status = status
    db.commit()
    db.refresh(wo)
    return wo


def update_production_order_status(
    db: Session, order_id: int, tenant_id: int, status: str
) -> ProductionOrder | None:
    order = db.scalars(
        select(ProductionOrder).where(
            ProductionOrder.id == order_id, ProductionOrder.tenant_id == tenant_id
        )
    ).first()
    if not order:
        return None
    previous_status = order.status
    order.status = status
    if status == "completed" and previous_status != "completed":
        _receive_finished_goods_on_completion(db, order)
    db.commit()
    db.refresh(order)
    return order


def _completed_quantity(order: ProductionOrder, work_orders: list[WorkOrder]) -> int:
    if work_orders:
        total = sum(float(wo.actual_quantity or 0) for wo in work_orders)
        if total > 0:
            return int(total)
    return int(float(order.planned_quantity or 0))


def _receive_finished_goods_on_completion(db: Session, order: ProductionOrder) -> None:
    """Post finished goods into inventory when a production order is marked completed."""
    from app.services.manufacturing_workflow_service import receive_finished_goods

    product = db.get(Product, order.product_id)
    if not product:
        return
    work_orders = list(
        db.scalars(
            select(WorkOrder).where(WorkOrder.production_order_id == order.id)
        ).all()
    )
    qty = _completed_quantity(order, work_orders)
    receive_finished_goods(
        db,
        order.tenant_id,
        product,
        qty,
        reference=order.order_number,
        commit=False,
    )


def create_work_order(db: Session, payload: WorkOrderCreate, assigned_user_id: int | None = None) -> WorkOrder:
    data = payload.model_dump()
    if not data.get("work_order_number"):
        ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        po = db.get(ProductionOrder, payload.production_order_id) if payload.production_order_id else None
        data["work_order_number"] = f"WO-{po.order_number}" if (po and po.order_number) else f"WO-{ts}"
    if assigned_user_id is not None:
        data["assigned_user_id"] = assigned_user_id
    work_order = WorkOrder(**data)
    db.add(work_order)
    db.commit()
    db.refresh(work_order)
    try:
        from app.services.alert_event_service import emit_alert

        emit_alert(
            db,
            tenant_id=work_order.tenant_id,
            alert_type="work_order_created",
            title=f"Work order created: {work_order.work_order_number}",
            message=f"WO {work_order.work_order_number} planned qty {work_order.planned_quantity}",
            severity="medium",
            link=f"/production/work-orders?id={work_order.id}",
            reference_type="work_order",
            reference_id=work_order.id,
            created_by="Production",
        )
    except Exception:
        pass
    return work_order


def quick_create_work_order(db: Session, payload: WorkOrderQuickCreate) -> WorkOrder:
    """Create production order + work order in one call or allocate machine to existing order in-place without duplicating."""
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    wo_num = payload.work_order_number.strip() if payload.work_order_number else f"WO-{ts}"
    actual_qty = payload.actual_quantity if payload.actual_quantity is not None else payload.produced_quantity
    status_val = "in_progress" if (actual_qty and float(actual_qty) > 0) else "planned"

    prod_order = None
    if getattr(payload, "production_order_id", None):
        prod_order = db.get(ProductionOrder, payload.production_order_id)
        if prod_order:
            if payload.machine_id:
                prod_order.machine_id = payload.machine_id
            if payload.shift:
                prod_order.shift = payload.shift
            if payload.customer_name:
                prod_order.customer_name = payload.customer_name

            # Check if a work order already exists for this production order
            existing_wo = db.scalars(
                select(WorkOrder).where(
                    WorkOrder.production_order_id == prod_order.id,
                    WorkOrder.tenant_id == payload.tenant_id,
                )
            ).first()

            if existing_wo:
                if payload.machine_id:
                    existing_wo.machine_id = payload.machine_id
                if payload.operator_name:
                    existing_wo.operator_name = payload.operator_name
                if payload.shift:
                    existing_wo.shift = payload.shift
                if payload.customer_name:
                    existing_wo.customer_name = payload.customer_name
                if payload.priority:
                    existing_wo.priority = payload.priority
                db.commit()
                db.refresh(existing_wo)
                return existing_wo

    if not prod_order:
        po_num = f"PO-{wo_num}"
        prod_order = ProductionOrder(
            tenant_id=payload.tenant_id,
            product_id=payload.product_id,
            order_number=po_num,
            planned_quantity=payload.planned_quantity,
            actual_quantity=actual_qty,
            customer_name=payload.customer_name,
            priority=payload.priority or "medium",
            shift=payload.shift,
            start_date=payload.planned_start,
            due_date=payload.planned_end,
            machine_id=payload.machine_id,
            status=status_val,
        )
        db.add(prod_order)
        db.flush()

    work_order = WorkOrder(
        tenant_id=payload.tenant_id,
        production_order_id=prod_order.id,
        machine_id=payload.machine_id,
        assigned_user_id=payload.assigned_user_id,
        operator_name=payload.operator_name,
        work_order_number=wo_num,
        planned_quantity=payload.planned_quantity,
        actual_quantity=actual_qty,
        priority=payload.priority or "medium",
        shift=payload.shift,
        planned_start=payload.planned_start,
        planned_end=payload.planned_end,
        status=status_val,
        plant_code=getattr(payload, "plant_code", None),
    )
    db.add(work_order)
    db.commit()
    db.refresh(work_order)
    return work_order


def list_work_orders(
    db: Session,
    tenant_id: int,
    production_order_id: int | None = None,
    user: User | None = None,
) -> list[WorkOrder]:
    stmt = select(WorkOrder).where(WorkOrder.tenant_id == tenant_id)
    if production_order_id is not None:
        stmt = stmt.where(WorkOrder.production_order_id == production_order_id)
    if user is not None:
        stmt = scope_work_orders(stmt, user)
    return list(db.scalars(stmt).all())


def get_work_order(db: Session, work_order_id: int, tenant_id: int) -> WorkOrder | None:
    return db.scalars(
        select(WorkOrder).where(WorkOrder.id == work_order_id, WorkOrder.tenant_id == tenant_id)
    ).first()


def update_work_order(
    db: Session, work_order_id: int, tenant_id: int, user: User | None = None, **kwargs
) -> WorkOrder | None:
    wo = get_work_order(db, work_order_id, tenant_id)
    if not wo:
        return None
    if user is not None and not operator_can_access_work_order(user, wo):
        raise HTTPException(status_code=403, detail="You cannot modify this work order")
    for k, v in kwargs.items():
        if v is not None and hasattr(wo, k):
            setattr(wo, k, v)
    db.commit()
    db.refresh(wo)
    return wo


def create_batch(db: Session, payload: BatchCreate) -> Batch:
    batch = Batch(**payload.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def list_batches(
    db: Session, tenant_id: int, work_order_id: int | None = None
) -> list[Batch]:
    stmt = select(Batch).where(Batch.tenant_id == tenant_id)
    if work_order_id is not None:
        stmt = stmt.where(Batch.work_order_id == work_order_id)
    return list(db.scalars(stmt).all())


def create_machine(db: Session, payload: MachineCreate) -> Machine:
    machine = Machine(**payload.model_dump())
    db.add(machine)
    db.commit()
    db.refresh(machine)
    return machine


def list_machines(db: Session, tenant_id: int, user: User | None = None) -> list[Machine]:
    stmt = select(Machine).where(Machine.tenant_id == tenant_id)
    if user is not None and user.assigned_machine_id and "Operator" in {
        r.name for r in user.roles
    }:
        stmt = stmt.where(Machine.id == user.assigned_machine_id)
    elif user is not None and user.plant_code and "Production Manager" in {r.name for r in user.roles}:
        stmt = stmt.where(
            (Machine.plant_code == user.plant_code) | (Machine.plant_code.is_(None))
        )
    return list(db.scalars(stmt).all())


def update_machine_status(
    db: Session, machine_id: int, tenant_id: int, status: str, user: User | None = None
) -> Machine | None:
    stmt = select(Machine).where(Machine.id == machine_id, Machine.tenant_id == tenant_id)
    if user is not None and user.assigned_machine_id and "Operator" in {r.name for r in user.roles}:
        stmt = stmt.where(Machine.id == user.assigned_machine_id)
    m = db.scalars(stmt).first()
    if not m:
        return None
    m.status = status
    db.commit()
    db.refresh(m)
    return m


def create_machine_status_event(
    db: Session, payload: MachineStatusEventCreate
) -> MachineStatusEvent:
    event = MachineStatusEvent(**payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def list_machine_status_events(
    db: Session, tenant_id: int, machine_id: int | None = None
) -> list[MachineStatusEvent]:
    stmt = select(MachineStatusEvent).where(MachineStatusEvent.tenant_id == tenant_id)
    if machine_id is not None:
        stmt = stmt.where(MachineStatusEvent.machine_id == machine_id)
    return list(db.scalars(stmt).all())


def create_daily_production_report(
    db: Session, payload: DailyProductionReportCreate, created_by_user_id: int | None = None
) -> DailyProductionReport:
    data = payload.model_dump()
    if created_by_user_id is not None:
        data["created_by_user_id"] = created_by_user_id
    report = DailyProductionReport(**data)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def list_daily_production_reports(
    db: Session,
    tenant_id: int,
    date_from: date | None = None,
    date_to: date | None = None,
    work_order_id: int | None = None,
    machine_id: int | None = None,
    user: User | None = None,
) -> list[dict]:
    stmt = select(DailyProductionReport).where(
        DailyProductionReport.tenant_id == tenant_id
    )
    if date_from is not None:
        stmt = stmt.where(DailyProductionReport.report_date >= date_from)
    if date_to is not None:
        stmt = stmt.where(DailyProductionReport.report_date <= date_to)
    if work_order_id is not None:
        stmt = stmt.where(DailyProductionReport.work_order_id == work_order_id)
    if machine_id is not None:
        stmt = stmt.where(DailyProductionReport.machine_id == machine_id)
    if user is not None:
        stmt = scope_daily_reports(stmt, user)
    
    explicit_reports = list(db.scalars(stmt).all())
    results = []
    seen_keys = set()

    for r in explicit_reports:
        product = db.get(Product, r.product_id) if r.product_id else None
        wo = db.get(WorkOrder, r.work_order_id) if r.work_order_id else None
        m = db.get(Machine, r.machine_id) if r.machine_id else None

        key = (r.report_date, r.work_order_id, r.machine_id)
        seen_keys.add(key)

        results.append({
            "id": r.id,
            "tenant_id": r.tenant_id,
            "report_date": r.report_date.isoformat() if isinstance(r.report_date, date) else str(r.report_date),
            "product_id": r.product_id,
            "product_name": product.name if product else (f"Product #{r.product_id}" if r.product_id else "—"),
            "work_order_id": r.work_order_id,
            "work_order_number": wo.work_order_number if wo else (f"WO #{r.work_order_id}" if r.work_order_id else "—"),
            "machine_id": r.machine_id,
            "machine_name": m.name if m else (f"Machine #{r.machine_id}" if r.machine_id else "—"),
            "shift": (wo.shift if wo else None) or (m.current_shift if m else None) or "Shift A",
            "operator_name": (wo.operator_name if wo else None) or (m.assigned_operator if m else None) or "—",
            "planned_quantity": float(r.planned_quantity or 0),
            "produced_quantity": float(r.produced_quantity or 0),
            "scrap_quantity": float(r.scrap_quantity or 0),
            "downtime_minutes": int(r.downtime_minutes or 0),
            "notes": r.notes or "",
        })

    # 1. Auto-sync Work Orders
    wo_stmt = select(WorkOrder).where(WorkOrder.tenant_id == tenant_id)
    if work_order_id is not None:
        wo_stmt = wo_stmt.where(WorkOrder.id == work_order_id)
    if machine_id is not None:
        wo_stmt = wo_stmt.where(WorkOrder.machine_id == machine_id)
    
    work_orders = list(db.scalars(wo_stmt).all())
    linked_po_ids = set()

    for wo in work_orders:
        po = db.get(ProductionOrder, wo.production_order_id)
        if po:
            linked_po_ids.add(po.id)
        product = db.get(Product, po.product_id) if po else None
        m = db.get(Machine, wo.machine_id) if wo.machine_id else None
        
        rep_date = wo.planned_start.date() if wo.planned_start else (wo.created_at.date() if getattr(wo, 'created_at', None) else date.today())
        
        if date_from and rep_date < date_from:
            continue
        if date_to and rep_date > date_to:
            continue

        key = (rep_date, wo.id, wo.machine_id)
        if key in seen_keys:
            continue
        seen_keys.add(key)

        planned_q = float(getattr(wo, "planned_quantity", 0) or 0)
        prod_q = float(getattr(wo, "actual_quantity", 0) or 0)
        good_q = float(getattr(wo, "good_quantity", 0) or getattr(wo, "good_qty", 0) or 0)
        scrap_q = float(getattr(wo, "scrap_quantity", 0) or getattr(wo, "reject_qty", 0) or 0)
        if prod_q <= 0 and (good_q > 0 or scrap_q > 0):
            prod_q = good_q + scrap_q
        elif prod_q <= 0 and po:
            from app.services.production_planning_service import _order_context
            ctx = _order_context(db, tenant_id, po)
            prod_q = float(ctx.get("produced_quantity") or 0)
            if prod_q <= 0 and wo.status in ("completed", "closed", "done"):
                prod_q = planned_q

        results.append({
            "id": f"wo-{wo.id}",
            "tenant_id": wo.tenant_id,
            "report_date": rep_date.isoformat(),
            "product_id": po.product_id if po else None,
            "product_name": product.name if product else "—",
            "work_order_id": wo.id,
            "work_order_number": wo.work_order_number,
            "machine_id": wo.machine_id,
            "machine_name": m.name if m else "Unassigned",
            "shift": wo.shift or (m.current_shift if m else None) or "Shift A",
            "operator_name": wo.operator_name or (m.assigned_operator if m else None) or "—",
            "planned_quantity": planned_q,
            "produced_quantity": prod_q,
            "scrap_quantity": float(getattr(wo, "scrap_quantity", 0) or 0),
            "downtime_minutes": 0,
            "notes": f"Auto-synced from Work Order {wo.work_order_number}",
        })

    # 2. Auto-sync unlinked Production Orders
    po_stmt = select(ProductionOrder).where(ProductionOrder.tenant_id == tenant_id)
    if machine_id is not None:
        po_stmt = po_stmt.where(ProductionOrder.machine_id == machine_id)
    
    prod_orders = list(db.scalars(po_stmt).all())
    for po in prod_orders:
        if po.id in linked_po_ids:
            continue
        product = db.get(Product, po.product_id) if po.product_id else None
        m = db.get(Machine, po.machine_id) if po.machine_id else None
        rep_date = po.start_date.date() if po.start_date else (po.created_at.date() if getattr(po, 'created_at', None) else date.today())

        if date_from and rep_date < date_from:
            continue
        if date_to and rep_date > date_to:
            continue

        key = (rep_date, f"po-{po.id}", po.machine_id)
        if key in seen_keys:
            continue
        seen_keys.add(key)

        from app.services.production_planning_service import _order_context
        ctx = _order_context(db, tenant_id, po)
        planned_q = float(po.planned_quantity or 0)
        prod_q = float(ctx.get("produced_quantity") or 0)

        results.append({
            "id": f"po-{po.id}",
            "tenant_id": po.tenant_id,
            "report_date": rep_date.isoformat(),
            "product_id": po.product_id,
            "product_name": product.name if product else "—",
            "work_order_id": None,
            "work_order_number": po.order_number,
            "machine_id": po.machine_id,
            "machine_name": m.name if m else "Unassigned",
            "shift": po.shift or (m.current_shift if m else None) or "Shift A",
            "operator_name": (m.assigned_operator if m else None) or "—",
            "planned_quantity": planned_q,
            "produced_quantity": prod_q,
            "scrap_quantity": 0.0,
            "downtime_minutes": 0,
            "notes": f"Auto-synced from Production Order {po.order_number}",
        })

    # 3. Auto-sync Batches
    batch_stmt = select(Batch).where(Batch.tenant_id == tenant_id)
    if work_order_id is not None:
        batch_stmt = batch_stmt.where(Batch.work_order_id == work_order_id)
    
    batches = list(db.scalars(batch_stmt).all())
    for b in batches:
        wo = db.get(WorkOrder, b.work_order_id) if b.work_order_id else None
        po = db.get(ProductionOrder, wo.production_order_id) if wo else None
        product = db.get(Product, po.product_id) if po else None
        m = db.get(Machine, wo.machine_id) if (wo and wo.machine_id) else None
        rep_date = b.produced_at.date() if b.produced_at else (b.created_at.date() if getattr(b, 'created_at', None) else date.today())

        if date_from and rep_date < date_from:
            continue
        if date_to and rep_date > date_to:
            continue

        key = (rep_date, f"batch-{b.id}", wo.machine_id if wo else None)
        if key in seen_keys:
            continue
        seen_keys.add(key)

        results.append({
            "id": f"batch-{b.id}",
            "tenant_id": b.tenant_id,
            "report_date": rep_date.isoformat(),
            "product_id": po.product_id if po else None,
            "product_name": product.name if product else "—",
            "work_order_id": b.work_order_id,
            "work_order_number": wo.work_order_number if wo else b.batch_code,
            "machine_id": wo.machine_id if wo else None,
            "machine_name": m.name if m else "Unassigned",
            "shift": (wo.shift if wo else None) or (m.current_shift if m else None) or "Shift A",
            "operator_name": (wo.operator_name if wo else None) or (m.assigned_operator if m else None) or "—",
            "planned_quantity": float(b.quantity or 0),
            "produced_quantity": float(b.quantity or 0),
            "scrap_quantity": 0.0,
            "downtime_minutes": 0,
            "notes": f"Auto-synced Batch {b.batch_code}",
        })

    # 4. Auto-sync Batch Quality Reports
    bqr_stmt = select(BatchQualityReport).where(BatchQualityReport.tenant_id == tenant_id)
    bqr_list = list(db.scalars(bqr_stmt).all())
    for bqr in bqr_list:
        rep_date = bqr.report_date if bqr.report_date else (bqr.created_at.date() if getattr(bqr, 'created_at', None) else date.today())
        if date_from and rep_date < date_from:
            continue
        if date_to and rep_date > date_to:
            continue

        key = (rep_date, f"bqr-{bqr.id}", None)
        if key in seen_keys:
            continue
        seen_keys.add(key)

        results.append({
            "id": f"bqr-{bqr.id}",
            "tenant_id": bqr.tenant_id,
            "report_date": rep_date.isoformat(),
            "product_id": None,
            "product_name": bqr.product_name or "—",
            "work_order_id": None,
            "work_order_number": bqr.batch_code or f"Batch #{bqr.batch_id}",
            "machine_id": None,
            "machine_name": "QC Station",
            "shift": bqr.shift or "Shift A",
            "operator_name": bqr.inspector or "—",
            "planned_quantity": float(bqr.production_qty or 0),
            "produced_quantity": float(bqr.production_qty or 0),
            "scrap_quantity": float(bqr.reject_qty or 0),
            "downtime_minutes": 0,
            "notes": bqr.summary or f"QC Report Batch {bqr.batch_code or bqr.batch_id}",
        })

    results.sort(key=lambda x: str(x["report_date"]), reverse=True)
    return results
