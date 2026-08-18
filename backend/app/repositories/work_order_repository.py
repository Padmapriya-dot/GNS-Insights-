"""Work order data access."""

import logging
from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import SQLAlchemyError

from app.models.production import WorkOrder
from app.models.user import User
from app.repositories.base_repository import BaseRepository
from app.services.data_scope import scope_work_orders

logger = logging.getLogger(__name__)


class WorkOrderRepository(BaseRepository):
    def _base_stmt(self, user: User | None = None):
        stmt = select(WorkOrder).where(WorkOrder.tenant_id == self.tenant_id)
        if user is not None:
            stmt = scope_work_orders(stmt, user)
        return stmt

    def list_all(self, user: User | None = None) -> list[WorkOrder]:
        try:
            stmt = self._base_stmt(user).order_by(WorkOrder.id.desc())
            return list(self.db.scalars(stmt).all())
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

    def list_today(self, user: User | None = None) -> list[WorkOrder]:
        try:
            today = date.today()
            orders = self.list_all(user=user)
            res = []
            for wo in orders:
                is_today = False
                ps = getattr(wo, "planned_start", None)
                if ps:
                    if isinstance(ps, (datetime, date)):
                        try:
                            d = ps.date() if isinstance(ps, datetime) else ps
                            if d == today:
                                is_today = True
                        except Exception:
                            pass
                if is_today or getattr(wo, "status", None) in ("in_progress", "running", "paused"):
                    res.append(wo)
            return res
        except HTTPException:
            raise
        except SQLAlchemyError as exc:
            logger.exception("Database error during list_today: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable",
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected error during list_today: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database operation failed",
            ) from exc

    def list_assigned(self, user: User) -> list[WorkOrder]:
        try:
            conditions = [WorkOrder.assigned_user_id == user.id]
            if getattr(user, "assigned_machine_id", None):
                conditions.append(WorkOrder.machine_id == user.assigned_machine_id)
            stmt = select(WorkOrder).where(
                WorkOrder.tenant_id == self.tenant_id,
                or_(*conditions),
            )
            stmt = scope_work_orders(stmt, user)
            return list(self.db.scalars(stmt.order_by(WorkOrder.id.desc())).all())
        except HTTPException:
            raise
        except SQLAlchemyError as exc:
            logger.exception("Database error during list_assigned: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable",
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected error during list_assigned: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database operation failed",
            ) from exc

    def list_pending(self, user: User | None = None) -> list[WorkOrder]:
        try:
            pending_statuses = ("planned", "pending", "released", "material_ready", "machine_ready")
            stmt = self._base_stmt(user).where(WorkOrder.status.in_(pending_statuses))
            return list(self.db.scalars(stmt).all())
        except HTTPException:
            raise
        except SQLAlchemyError as exc:
            logger.exception("Database error during list_pending: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable",
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected error during list_pending: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database operation failed",
            ) from exc

    def get_by_id(self, work_order_id: int) -> WorkOrder | None:
        if not isinstance(work_order_id, int) or isinstance(work_order_id, bool) or work_order_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid work order ID",
            )
        try:
            return self.db.scalars(
                select(WorkOrder).where(
                    WorkOrder.id == work_order_id,
                    WorkOrder.tenant_id == self.tenant_id,
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

    def get_by_number(self, number: str, user: User | None = None) -> WorkOrder | None:
        if not isinstance(number, str) or not number.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid work order number",
            )
        try:
            normalized = number.strip().upper()
            stmt = select(WorkOrder).where(
                WorkOrder.tenant_id == self.tenant_id,
                func.upper(WorkOrder.work_order_number) == normalized,
            )
            if user is not None:
                stmt = scope_work_orders(stmt, user)
            return self.db.scalars(stmt).first()
        except HTTPException:
            raise
        except SQLAlchemyError as exc:
            logger.exception("Database error during get_by_number: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable",
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected error during get_by_number: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database operation failed",
            ) from exc
