"""Production batch data access."""

import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.models.production import Batch
from app.repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class BatchRepository(BaseRepository):
    def list_all(self) -> list[Batch]:
        try:
            return list(
                self.db.scalars(
                    select(Batch)
                    .where(Batch.tenant_id == self.tenant_id)
                    .order_by(Batch.id.desc())
                ).all()
            )
        except HTTPException:
            raise
        except SQLAlchemyError as exc:
            logger.exception("Database error during list_all: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable",
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected error during list_all: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database operation failed",
            ) from exc

    def get_by_id(self, batch_id: int) -> Batch | None:
        if not isinstance(batch_id, int) or isinstance(batch_id, bool) or batch_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid batch ID",
            )
        try:
            return self.db.scalars(
                select(Batch).where(
                    Batch.id == batch_id,
                    Batch.tenant_id == self.tenant_id,
                )
            ).first()
        except HTTPException:
            raise
        except SQLAlchemyError as exc:
            logger.exception("Database error during get_by_id: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable",
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected error during get_by_id: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database operation failed",
            ) from exc

    def list_by_status(self, *statuses: str) -> list[Batch]:
        try:
            return list(
                self.db.scalars(
                    select(Batch).where(
                        Batch.tenant_id == self.tenant_id,
                        Batch.status.in_(statuses),
                    )
                ).all()
            )
        except HTTPException:
            raise
        except SQLAlchemyError as exc:
            logger.exception("Database error during list_by_status: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable",
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected error during list_by_status: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database operation failed",
            ) from exc
