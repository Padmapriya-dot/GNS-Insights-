"""Product data access."""

from sqlalchemy import or_, select

from app.models.product import Product
from app.repositories.base_repository import BaseRepository


class ProductRepository(BaseRepository):
    def list_all(self) -> list[Product]:
        return list(
            self.db.scalars(
                select(Product)
                .where(Product.tenant_id == self.tenant_id)
                .order_by(Product.id.desc())
            ).all()
        )

    def get_by_id(self, product_id: int) -> Product | None:
        return self.db.scalars(
            select(Product).where(
                Product.id == product_id,
                Product.tenant_id == self.tenant_id,
            )
        ).first()

    def search(self, query: str, limit: int = 50) -> list[Product]:
        pattern = f"%{query.strip()}%"
        return list(
            self.db.scalars(
                select(Product)
                .where(
                    Product.tenant_id == self.tenant_id,
                    or_(
                        Product.name.ilike(pattern),
                        Product.sku.ilike(pattern),
                        Product.description.ilike(pattern),
                    ),
                )
                .limit(limit)
            ).all()
        )
