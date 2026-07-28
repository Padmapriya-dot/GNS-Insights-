from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.bom import BillOfMaterial
from app.models.product import Product
from app.schemas.product import BomItemCreate, ProductCreate, ProductUpdate


def list_products(db: Session, tenant_id: int) -> list[Product]:
    stmt = select(Product).where(Product.tenant_id == tenant_id).order_by(Product.id.desc())
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


def delete_product(db: Session, tenant_id: int, product_id: int) -> bool:
    product = get_product(db, tenant_id, product_id)
    if not product:
        return False
    db.delete(product)
    db.commit()
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
