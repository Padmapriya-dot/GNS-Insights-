from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user
from app.api.deps import get_db
from app.core.permissions import require_permission, tenant_scope, user_has_permission
from app.models.user import User
from app.schemas.accounts import ExpenseCreate, ExpenseRead, IncomeCreate, IncomeRead
from app.services.accounts_service import (
    create_expense,
    create_income,
    get_accounts_dashboard,
    get_profit_loss,
    get_tax_report,
    list_expenses,
    list_incomes,
)
from app.services.finance_extended_service import (
    get_ap_summary,
    get_ar_summary,
    get_extended_reports,
    get_finance_hub,
    get_gl_summary,
    get_gst_extended,
    get_payment_summary,
    get_pl_extended,
    list_ap_enriched,
    list_ar_enriched,
    list_gl_enriched,
    list_payments_enriched,
)

router = APIRouter(prefix="/accounts", tags=["accounts"])

MODULE = "accounts"


@router.post("/income", response_model=IncomeRead)
def create_income_endpoint(
    payload: IncomeCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    payload.tenant_id = user.tenant_id
    return create_income(db, payload)


@router.get("/income", response_model=list[IncomeRead])
def list_income_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
):
    return list_incomes(db, tenant_id, year)


@router.post("/expenses", response_model=ExpenseRead)
def create_expense_endpoint(
    payload: ExpenseCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    payload.tenant_id = user.tenant_id
    return create_expense(db, payload)


@router.get("/expenses", response_model=list[ExpenseRead])
def list_expense_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
):
    return list_expenses(db, tenant_id, year)


@router.get("/dashboard")
def accounts_dashboard_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
):
    return get_accounts_dashboard(db, tenant_id)


@router.get("/profit-loss")
def profit_loss_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int = Query(...),
    ytd_month: int = Query(12, ge=1, le=12),
    db: Session = Depends(get_db),
):
    return get_profit_loss(db, tenant_id, year, ytd_month)


@router.get("/tax-report")
def tax_report_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int = Query(...),
    db: Session = Depends(get_db),
):
    return get_tax_report(db, tenant_id, year)


@router.get("/hub")
def finance_hub_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    current_user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db)
):
    return get_finance_hub(db, tenant_id, current_user)


@router.get("/ap/summary")
def ap_summary_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    current_user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db)
):
    return get_ap_summary(db, tenant_id)


@router.get("/ap/enriched")
def ap_enriched_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    current_user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db)
):
    return list_ap_enriched(db, tenant_id)


@router.get("/ar/summary")
def ar_summary_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    current_user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db)
):
    return get_ar_summary(db, tenant_id)


@router.get("/ar/enriched")
def ar_enriched_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    current_user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db)
):
    return list_ar_enriched(db, tenant_id)


@router.get("/payments/summary")
def payment_summary_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    current_user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db)
):
    return get_payment_summary(db, tenant_id)


@router.get("/payments/enriched")
def payments_enriched_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    current_user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db)
):
    return list_payments_enriched(db, tenant_id)


@router.get("/gl/summary")
def gl_summary_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    current_user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db)
):
    return get_gl_summary(db, tenant_id)


@router.get("/gl/enriched")
def gl_enriched_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    current_user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db)
):
    return list_gl_enriched(db, tenant_id)


@router.get("/gst/extended")
def gst_extended_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int = Query(...),
    financial_year: str | None = Query(None),
    month: str | None = Query(None),
    branch: str | None = Query(None),
    db: Session = Depends(get_db),
):
    # Extra query params kept for SMRT API compatibility; service uses year.
    _ = (financial_year, month, branch)
    return get_gst_extended(db, tenant_id, year)


@router.get("/profit-loss/extended")
def pl_extended_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    year: int = Query(...),
    financial_year: str | None = Query(None),
    month: str | None = Query(None),
    branch: str | None = Query(None),
    db: Session = Depends(get_db),
):
    _ = (financial_year, month, branch)
    return get_pl_extended(db, tenant_id, year)


@router.get("/extended-reports")
def extended_reports_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    financial_year: str | None = Query(None),
    month: str | None = Query(None),
    branch: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return get_extended_reports(db, tenant_id, financial_year, month, branch)


@router.post("/journal-entries")
def create_journal_entry_endpoint(
    payload: dict,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    import datetime

    from fastapi import HTTPException
    from sqlalchemy import func, select

    from app.models.accounts import JournalEntry, JournalLeg

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Journal entry payload must be a JSON object")

    date_str = (
        payload.get("date")
        or payload.get("entry_date")
        or payload.get("posting_date")
        or datetime.date.today().isoformat()
    )
    try:
        entry_date = datetime.datetime.strptime(str(date_str), "%Y-%m-%d").date()
    except ValueError:
        entry_date = datetime.date.today()

    reference = payload.get("reference") or payload.get("ref")
    description = payload.get("description") or payload.get("desc")
    status = payload.get("status") or "Posted"
    branch = payload.get("branch") or "Head Office"
    legs_payload = payload.get("legs") or payload.get("lines") or []

    if not isinstance(legs_payload, list):
        raise HTTPException(status_code=400, detail="Journal entry legs must be a list")

    count = db.scalar(
        select(func.count(JournalEntry.id)).where(JournalEntry.tenant_id == user.tenant_id)
    ) or 0
    entry_number = f"JV-{entry_date.year}-{count + 1:04d}"

    entry = JournalEntry(
        tenant_id=user.tenant_id,
        entry_number=entry_number,
        entry_date=entry_date,
        reference=reference,
        description=description,
        status=status,
        branch=branch,
    )
    db.add(entry)
    db.flush()

    try:
        for leg_data in legs_payload:
            if not isinstance(leg_data, dict):
                raise ValueError("Each leg must be an object")
            account = str(leg_data.get("account") or "General").strip() or "General"
            debit = float(leg_data.get("debit", 0.0) or 0.0)
            credit = float(leg_data.get("credit", 0.0) or 0.0)
            db.add(
                JournalLeg(
                    entry_id=entry.id,
                    account=account,
                    debit=debit,
                    credit=credit,
                )
            )
    except (TypeError, ValueError) as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Invalid journal legs: {exc}") from exc

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Unable to save journal entry: {exc}") from exc

    return {"status": "success", "entry_number": entry_number}


@router.post("/gl-accounts")
def create_gl_account_endpoint(
    payload: dict,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    from sqlalchemy import select

    from app.models.accounts import GLAccount

    existing = db.scalar(
        select(GLAccount).where(
            GLAccount.tenant_id == user.tenant_id, GLAccount.code == payload.get("code")
        )
    )
    if existing:
        return {"status": "error", "message": "Account code already exists"}

    db.add(
        GLAccount(
            tenant_id=user.tenant_id,
            code=payload.get("code"),
            name=payload.get("name"),
            parent=payload.get("parent", "Current Assets"),
            type=payload.get("type", "Assets"),
            balance=float(payload.get("balance", 0.0) or 0.0),
            status=payload.get("status", "Active"),
        )
    )
    db.commit()
    return {"status": "success"}


@router.post("/fixed-assets")
def create_fixed_asset_endpoint(
    payload: dict,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    import datetime

    from sqlalchemy import select

    from app.models.accounts import FixedAsset

    existing = db.scalar(
        select(FixedAsset).where(
            FixedAsset.tenant_id == user.tenant_id, FixedAsset.code == payload.get("code")
        )
    )
    if existing:
        return {"status": "error", "message": "Asset code already exists"}

    date_str = payload.get("purchaseDate")
    try:
        purchase_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        purchase_date = datetime.date.today()

    db.add(
        FixedAsset(
            tenant_id=user.tenant_id,
            code=payload.get("code"),
            name=payload.get("name"),
            purchase_date=purchase_date,
            cost=float(payload.get("cost", 0.0) or 0.0),
            salvage=float(payload.get("salvage", 0.0) or 0.0),
            life=int(payload.get("life", 1) or 1),
            method=payload.get("method", "Straight Line"),
            accum_dep=float(payload.get("accumDep", 0.0) or 0.0),
        )
    )
    db.commit()
    return {"status": "success"}
