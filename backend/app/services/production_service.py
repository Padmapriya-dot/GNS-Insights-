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

    order = ProductionOrder(**payload.model_dump())
    db.add(order)
    db.commit()
    db.refresh(order)
    if payload.machine_id:
        wo = WorkOrder(
            tenant_id=order.tenant_id,
            production_order_id=order.id,
            work_order_number=f"WO-{order.order_number}",
            planned_quantity=order.planned_quantity,
            machine_id=payload.machine_id,
            status="planned"
        )
        db.add(wo)
        db.commit()
    return order


def list_production_orders(db: Session, tenant_id: int) -> list[ProductionOrder]:
    stmt = select(ProductionOrder).where(ProductionOrder.tenant_id == tenant_id)
    return list(db.scalars(stmt).all())


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
    """Create production order + work order in one call with full field support."""
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    wo_num = payload.work_order_number.strip() if payload.work_order_number else f"WO-{ts}"
    po_num = f"PO-{wo_num}"

    prod_order = ProductionOrder(
        tenant_id=payload.tenant_id,
        product_id=payload.product_id,
        order_number=po_num,
        planned_quantity=payload.planned_quantity,
        customer_name=payload.customer_name,
        priority=payload.priority or "medium",
        start_date=payload.planned_start,
        due_date=payload.planned_end,
        machine_id=payload.machine_id,
        status="planned",
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
        planned_start=payload.planned_start,
        planned_end=payload.planned_end,
        status="planned",
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
) -> list[DailyProductionReport]:
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
    return list(db.scalars(stmt).all())
