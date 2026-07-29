from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import require_permission, tenant_scope
from app.models.user import User
from app.services.analytics_extended_service import (
    get_executive_hub,
    get_finance_analytics,
    get_inventory_analytics,
    get_live_dashboard,
    get_production_analytics,
    get_sales_analytics,
)
from app.services.analytics_service import (
    get_inventory_turnover_rate,
    get_machine_efficiency,
    get_monthly_production_trend,
    get_profit_analysis,
    get_worker_performance_score,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

MODULE = "analytics"


@router.get("/production-trend")
def production_trend_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int = Query(...),
    db: Session = Depends(get_db),
):
    return get_monthly_production_trend(db, tenant_id, year)


@router.get("/machine-efficiency")
def machine_efficiency_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    return get_machine_efficiency(db, tenant_id)


@router.get("/inventory-turnover")
def inventory_turnover_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    return get_inventory_turnover_rate(db, tenant_id)


@router.get("/worker-performance")
def worker_performance_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    return get_worker_performance_score(db, tenant_id)


@router.get("/profit")
def profit_analysis_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int = Query(...),
    db: Session = Depends(get_db),
):
    return get_profit_analysis(db, tenant_id, year)


@router.get("/dashboard")
def analytics_dashboard_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int = Query(None),
    db: Session = Depends(get_db),
):
    from datetime import date

    y = year or date.today().year
    return {
        "monthly_production_trend": get_monthly_production_trend(db, tenant_id, y),
        "machine_efficiency": get_machine_efficiency(db, tenant_id),
        "inventory_turnover": get_inventory_turnover_rate(db, tenant_id),
        "worker_performance": get_worker_performance_score(db, tenant_id),
    }


@router.get("/production/summary")
def production_analytics_endpoint(
    current_user: User = Depends(require_permission(MODULE)),
    year: int = Query(None),
    db: Session = Depends(get_db),
):
    return get_production_analytics(db, current_user.tenant_id, year, user=current_user)


@router.get("/inventory/summary")
def inventory_analytics_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    return get_inventory_analytics(db, tenant_id)


@router.get("/sales/summary")
def sales_analytics_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int = Query(None),
    db: Session = Depends(get_db),
):
    return get_sales_analytics(db, tenant_id, year)


@router.get("/finance/summary")
def finance_analytics_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int = Query(None),
    db: Session = Depends(get_db),
):
    return get_finance_analytics(db, tenant_id, year)


@router.get("/executive/hub")
def executive_hub_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int = Query(None),
    db: Session = Depends(get_db),
):
    return get_executive_hub(db, tenant_id, year)


@router.get("/live/hub")
def live_dashboard_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    return get_live_dashboard(db, tenant_id)
