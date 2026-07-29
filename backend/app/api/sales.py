from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import require_any_permission, require_permission, tenant_scope, tenant_scope_any
from app.models.user import User
from app.schemas.sales import (
    CustomerCreate,
    CustomerRead,
    InvoiceCreate,
    InvoiceListRead,
    InvoiceRead,
    InvoiceItemRead,
    LeadCreate,
    LeadRead,
    PaymentCreate,
    PaymentRead,
    QuotationConvertRequest,
    QuotationCreate,
    QuotationRead,
    SalesOrderCreate,
    SalesOrderListRead,
    SalesOrderRead,
)
from app.services.sales_service import (
    create_customer,
    create_invoice,
    create_lead,
    create_payment,
    create_quotation,
    create_sales_order,
    get_invoice_with_items,
    list_customers,
    list_invoices,
    list_leads,
    list_payments,
    list_quotations,
    list_sales_orders,
    update_lead_status,
    update_quotation_status,
    update_sales_order_dispatch,
)
from app.schemas.sales_extended import (
    DispatchListRead,
    DispatchSummaryRead,
    InvoiceListEnrichedRead,
    InvoiceSummaryRead,
    LeadListRead,
    LeadSummaryRead,
    QuotationListRead,
    QuotationSummaryRead,
    SalesHubRead,
    SOListRead,
    SOSummaryRead,
)
from app.services.sales_extended_service import (
    get_dispatch_summary,
    get_invoice_summary,
    get_lead_summary,
    get_quotation_summary,
    get_sales_hub,
    get_so_summary,
    list_dispatch_enriched,
    list_invoices_enriched,
    list_leads_enriched,
    list_quotations_enriched,
    list_so_enriched,
)

router = APIRouter(prefix="/sales", tags=["sales"])

MODULE = "sales"


@router.post("/customers", response_model=CustomerRead)
def create_customer_endpoint(
    payload: CustomerCreate,
    user: User = Depends(require_any_permission(MODULE, "masters")),
    db: Session = Depends(get_db),
):
    payload.tenant_id = user.tenant_id
    return create_customer(db, payload)


@router.get("/customers", response_model=list[CustomerRead])
def list_customers_endpoint(
    tenant_id: int = Depends(tenant_scope_any(MODULE, "masters")), db: Session = Depends(get_db)
):
    return list_customers(db, tenant_id)


@router.post("/leads", response_model=LeadRead)
def create_lead_endpoint(
    payload: LeadCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    payload.tenant_id = user.tenant_id
    return create_lead(db, payload)


@router.get("/leads", response_model=list[LeadRead])
def list_leads_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return list_leads(db, tenant_id, status)


@router.post("/leads/{lead_id}/convert-to-quotation", response_model=QuotationRead)
def convert_lead_to_quotation_endpoint(
    lead_id: int,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    """Customer enquiry (Lead) → Quotation."""
    from app.services.sales_service import convert_lead_to_quotation

    return convert_lead_to_quotation(
        db,
        user.tenant_id,
        lead_id,
        sales_person=user.full_name or user.email,
    )


@router.patch("/leads/{lead_id}/status", response_model=LeadRead)
def update_lead_status_endpoint(
    lead_id: int,
    status: str = Query(...),
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    lead = update_lead_status(db, tenant_id, lead_id, status)
    if not lead:
        raise HTTPException(404, "Lead not found")
    return lead


@router.post("/quotations", response_model=QuotationRead)
def create_quotation_endpoint(
    payload: QuotationCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    payload.tenant_id = user.tenant_id
    return create_quotation(db, payload)


@router.get("/quotations", response_model=list[QuotationRead])
def list_quotations_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return list_quotations(db, tenant_id, status)


@router.patch("/quotations/{quote_id}/status", response_model=QuotationRead)
def update_quotation_status_endpoint(
    quote_id: int,
    status: str = Query(...),
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    quote = update_quotation_status(db, tenant_id, quote_id, status)
    if not quote:
        raise HTTPException(404, "Quotation not found")
    return quote


@router.post("/sales-orders", response_model=SalesOrderRead)
def create_sales_order_endpoint(
    payload: SalesOrderCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    payload.tenant_id = user.tenant_id
    return create_sales_order(db, payload)


@router.get("/sales-orders", response_model=list[SalesOrderListRead])
def list_sales_orders_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    orders = list_sales_orders(db, tenant_id, status)
    return [
        SalesOrderListRead(
            **SalesOrderRead.model_validate(o).model_dump(),
            customer_name=o.customer.name if o.customer else None,
        )
        for o in orders
    ]


@router.patch("/sales-orders/{order_id}/status", response_model=SalesOrderRead)
def update_sales_order_status_endpoint(
    order_id: int,
    status: str = Query(...),
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    from app.services.sales_service import update_sales_order_status

    order = update_sales_order_status(db, tenant_id, order_id, status)
    if not order:
        raise HTTPException(404, "Sales order not found")
    return order


@router.post("/sales-orders/{order_id}/confirm")
def confirm_sales_order_endpoint(
    order_id: int,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    """Confirm SO → MRP + production orders. Returns workflow result."""
    from app.services.sales_service import confirm_sales_order

    try:
        return confirm_sales_order(
            db,
            user.tenant_id,
            order_id,
            requested_by=user.full_name or user.email,
        )
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc


@router.post("/quotations/{quote_id}/convert-to-so", response_model=SalesOrderRead)
def convert_quotation_to_so_endpoint(
    quote_id: int,
    payload: QuotationConvertRequest | None = None,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    from app.services.sales_service import convert_quotation_to_sales_order

    body = payload or QuotationConvertRequest()
    so = convert_quotation_to_sales_order(
        db,
        user.tenant_id,
        quote_id,
        product_id=body.product_id,
        item_description=body.item_description,
        quantity=body.quantity,
        unit=body.unit,
        unit_price=body.unit_price,
    )
    return so


@router.patch("/sales-orders/{order_id}/dispatch", response_model=SalesOrderRead)
def update_sales_order_dispatch_endpoint(
    order_id: int,
    packed: bool | None = Query(None),
    shipped: bool | None = Query(None),
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    order = update_sales_order_dispatch(db, tenant_id, order_id, packed, shipped)
    if not order:
        raise HTTPException(404, "Sales order not found")
    return order


@router.post("/sales-orders/{order_id}/confirm-delivery", response_model=SalesOrderRead)
def confirm_delivery_endpoint(
    order_id: int,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    from app.services.sales_service import confirm_delivery

    order = confirm_delivery(db, tenant_id, order_id)
    if not order:
        raise HTTPException(404, "Sales order not found")
    return order


@router.get("/workflow/board")
def get_manufacturing_workflow_board(
    user: User = Depends(
        require_any_permission(
            "sales",
            "production",
            "procurement",
            "inventory",
            "quality",
            "maintenance",
            "accounts",
            "analytics",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    """Role-filtered manufacturing workflow board (reuses existing SO chain)."""
    from app.services.manufacturing_workflow_service import list_role_workflow_board

    return list_role_workflow_board(db, user.tenant_id, user)


@router.get("/sales-orders/{order_id}/workflow")
def get_sales_order_workflow_endpoint(
    order_id: int,
    user: User = Depends(
        require_any_permission(
            "sales",
            "production",
            "procurement",
            "inventory",
            "quality",
            "maintenance",
            "accounts",
            "analytics",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    """Role-filtered step status for one sales order."""
    from app.services.manufacturing_workflow_service import get_role_workflow_for_order

    return get_role_workflow_for_order(db, user.tenant_id, order_id, user)


@router.get("/sales-orders/{order_id}/traceability")
def get_sales_order_traceability_endpoint(
    order_id: int,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    """Full manufacturing chain for a sales order (existing module records)."""
    from app.services.manufacturing_workflow_service import get_order_traceability

    return get_order_traceability(db, tenant_id, order_id)


@router.get("/sales-orders/{order_id}")
def get_sales_order_detail_endpoint(
    order_id: int,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    from app.services.sales_service import get_sales_order_with_items

    order = get_sales_order_with_items(db, tenant_id, order_id)
    if not order:
        raise HTTPException(404, "Sales order not found")
    data = SalesOrderRead.model_validate(order)
    cust = CustomerRead.model_validate(order.customer) if order.customer else None
    lines = [
        {
            "id": line.id,
            "product_id": line.product_id,
            "item_description": line.item_description,
            "quantity": float(line.quantity),
            "unit": line.unit,
            "unit_price": float(line.unit_price or 0),
            "line_total": float(line.line_total or 0),
        }
        for line in (order.line_items or [])
    ]
    from app.services.sales_service import list_production_orders_for_sales_order

    production_orders = [
        {
            "id": po.id,
            "order_number": po.order_number,
            "product_id": po.product_id,
            "planned_quantity": float(po.planned_quantity or 0),
            "status": po.status,
        }
        for po in list_production_orders_for_sales_order(
            db, tenant_id, order.id, order.order_number
        )
    ]
    return {
        "order": data,
        "customer": cust,
        "line_items": lines,
        "production_orders": production_orders,
    }


@router.post("/invoices", response_model=InvoiceRead)
def create_invoice_endpoint(
    payload: InvoiceCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    payload.tenant_id = user.tenant_id
    return create_invoice(db, payload)


@router.get("/invoices", response_model=list[InvoiceListRead])
def list_invoices_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    invs = list_invoices(db, tenant_id, status)
    return [
        InvoiceListRead(
            **InvoiceRead.model_validate(i).model_dump(),
            customer_name=i.customer.name if i.customer else None,
            items=[InvoiceItemRead.model_validate(item) for item in (i.items or [])],
        )
        for i in invs
    ]


@router.get("/invoices/{invoice_id}")
def get_invoice_detail_endpoint(
    invoice_id: int,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    inv = get_invoice_with_items(db, invoice_id)
    if not inv or inv.tenant_id != tenant_id:
        raise HTTPException(404, "Invoice not found")
    data = InvoiceRead.model_validate(inv)
    items = [InvoiceItemRead.model_validate(i) for i in inv.items]
    cust = CustomerRead.model_validate(inv.customer) if inv.customer else None
    return {"found": True, "invoice": data, "items": items, "customer": cust}


@router.patch("/invoices/{invoice_id}/status", response_model=InvoiceRead)
def update_invoice_status_endpoint(
    invoice_id: int,
    status: str = Query(..., description="New status: paid, partial, draft, issued, sent"),
    amount_paid: float | None = Query(None, description="Amount paid (for partial payments)"),
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    from app.models.sales import Invoice as InvoiceModel
    inv = db.get(InvoiceModel, invoice_id)
    if not inv or inv.tenant_id != tenant_id:
        raise HTTPException(404, "Invoice not found")
    inv.status = status
    if amount_paid is not None:
        inv.amount_paid = amount_paid
    elif status == "paid":
        inv.amount_paid = float(inv.grand_total or 0)
    db.commit()
    db.refresh(inv)
    return inv



@router.post("/payments", response_model=PaymentRead)
def create_payment_endpoint(
    payload: PaymentCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    payload.tenant_id = user.tenant_id
    return create_payment(db, payload)


@router.get("/payments", response_model=list[PaymentRead])
def list_payments_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    invoice_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    return list_payments(db, tenant_id, invoice_id)


@router.get("/leads/summary", response_model=LeadSummaryRead)
def leads_summary(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_lead_summary(db, tenant_id)


@router.get("/leads/enriched", response_model=list[LeadListRead])
def leads_enriched(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return list_leads_enriched(db, tenant_id)


@router.get("/quotations/summary", response_model=QuotationSummaryRead)
def quotations_summary(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_quotation_summary(db, tenant_id)


@router.get("/quotations/enriched", response_model=list[QuotationListRead])
def quotations_enriched(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return list_quotations_enriched(db, tenant_id)


@router.get("/sales-orders/summary", response_model=SOSummaryRead)
def so_summary(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_so_summary(db, tenant_id)


@router.get("/sales-orders/enriched", response_model=list[SOListRead])
def so_enriched(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return list_so_enriched(db, tenant_id)


@router.get("/invoices/summary", response_model=InvoiceSummaryRead)
def invoices_summary(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_invoice_summary(db, tenant_id)


@router.get("/invoices/enriched", response_model=list[InvoiceListEnrichedRead])
def invoices_enriched(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return list_invoices_enriched(db, tenant_id)


@router.get("/hub", response_model=SalesHubRead)
def sales_hub(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_sales_hub(db, tenant_id)
