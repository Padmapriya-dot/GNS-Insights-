from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.bom import BillOfMaterial
from app.models.inventory import VendorProduct
from app.models.product import Product, ProductStockEvent
from app.models.production import Batch, DailyProductionReport, ProductionOrder, WorkOrder
from app.models.sales import SalesOrderLine
from app.schemas.product import BomItemCreate, ProductCreate, ProductUpdate


def list_products(db: Session, tenant_id: int) -> list[Product]:
    stmt = select(Product).where(Product.tenant_id == tenant_id).order_by(Product.name)
    return list(db.scalars(stmt).all())


def get_product(db: Session, tenant_id: int, product_id: int) -> Product | None:
    return db.scalars(
        select(Product).where(Product.id == product_id, Product.tenant_id == tenant_id)
    ).first()


def create_product(db: Session, payload: ProductCreate) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(
    db: Session, tenant_id: int, product_id: int, payload: ProductUpdate
) -> Product | None:
    product = get_product(db, tenant_id, product_id)
    if not product:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def _delete_related_for_product(db: Session, tenant_id: int, product_id: int) -> None:
    """Remove FK dependents so a product row can be deleted (SQLite has no ON DELETE CASCADE)."""
    for event in db.scalars(
        select(ProductStockEvent).where(
            ProductStockEvent.product_id == product_id,
            ProductStockEvent.tenant_id == tenant_id,
        )
    ).all():
        db.delete(event)

    for bom in db.scalars(
        select(BillOfMaterial).where(
            BillOfMaterial.tenant_id == tenant_id,
            or_(
                BillOfMaterial.product_id == product_id,
                BillOfMaterial.component_product_id == product_id,
            ),
        )
    ).all():
        db.delete(bom)

    for vp in db.scalars(
        select(VendorProduct).where(
            VendorProduct.product_id == product_id,
            VendorProduct.tenant_id == tenant_id,
        )
    ).all():
        db.delete(vp)

    for line in db.scalars(
        select(SalesOrderLine).where(SalesOrderLine.product_id == product_id)
    ).all():
        line.product_id = None

    for report in db.scalars(
        select(DailyProductionReport).where(
            DailyProductionReport.product_id == product_id,
            DailyProductionReport.tenant_id == tenant_id,
        )
    ).all():
        db.delete(report)

    production_orders = list(
        db.scalars(
            select(ProductionOrder).where(
                ProductionOrder.product_id == product_id,
                ProductionOrder.tenant_id == tenant_id,
            )
        ).all()
    )
    for po in production_orders:
        work_orders = list(
            db.scalars(
                select(WorkOrder).where(WorkOrder.production_order_id == po.id)
            ).all()
        )
        for wo in work_orders:
            for batch in db.scalars(
                select(Batch).where(Batch.work_order_id == wo.id)
            ).all():
                db.delete(batch)
            for report in db.scalars(
                select(DailyProductionReport).where(
                    DailyProductionReport.work_order_id == wo.id
                )
            ).all():
                db.delete(report)
            db.delete(wo)
        db.delete(po)

    db.flush()


def delete_product(db: Session, tenant_id: int, product_id: int) -> bool:
    product = get_product(db, tenant_id, product_id)
    if not product:
        return False
    try:
        _delete_related_for_product(db, tenant_id, product_id)
        db.delete(product)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "Product is linked to other records and cannot be deleted."
        ) from exc
    return True


def list_bom(db: Session, tenant_id: int, product_id: int) -> list[BillOfMaterial]:
    stmt = select(BillOfMaterial).where(
        BillOfMaterial.tenant_id == tenant_id,
        BillOfMaterial.product_id == product_id,
    )
    return list(db.scalars(stmt).all())


def add_bom_item(db: Session, payload: BomItemCreate) -> BillOfMaterial:
    item = BillOfMaterial(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_bom_item(db: Session, tenant_id: int, bom_id: int) -> bool:
    item = db.scalars(
        select(BillOfMaterial).where(
            BillOfMaterial.id == bom_id, BillOfMaterial.tenant_id == tenant_id
        )
    ).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True
