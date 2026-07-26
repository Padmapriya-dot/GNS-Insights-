from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.sales import (
    Customer,
    DispatchShipment,
    Invoice,
    InvoiceItem,
    Lead,
    Payment,
    Quotation,
    SalesOrder,
    SalesOrderLine,
)
from app.schemas.sales import (
    CustomerCreate,
    InvoiceCreate,
    InvoiceItemCreate,
    PaymentCreate,
    SalesOrderCreate,
    LeadCreate,
    QuotationCreate,
)
from app.schemas.sales_extended import DeliveryChallanRead, DispatchShipmentCreate
from app.services.journal_service import (
    post_sales_invoice_journal,
    post_sales_payment_journal,
)


def create_customer(db: Session, payload: CustomerCreate) -> Customer:
    c = Customer(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def list_customers(db: Session, tenant_id: int) -> list[Customer]:
    stmt = select(Customer).where(Customer.tenant_id == tenant_id)
    return list(db.scalars(stmt).all())


def create_sales_order(db: Session, payload: SalesOrderCreate) -> SalesOrder:
    data = payload.model_dump(exclude={"line_items"})
    so = SalesOrder(**data)
    db.add(so)
    db.flush()
    total = 0.0
    for line in payload.line_items or []:
        line_total = float(line.line_total or (line.quantity * line.unit_price))
        sol = SalesOrderLine(
            sales_order_id=so.id,
            product_id=line.product_id,
            item_description=line.item_description,
            quantity=line.quantity,
            unit=line.unit,
            unit_price=line.unit_price,
            line_total=line_total,
        )
        db.add(sol)
        total += line_total
    if total:
        so.total_amount = total
    db.commit()
    db.refresh(so)
    try:
        from app.services.alert_event_service import emit_alert

        emit_alert(
            db,
            tenant_id=so.tenant_id,
            alert_type="sales_order",
            title=f"New sales order: {so.order_number}",
            message=f"SO {so.order_number} created — amount ₹{float(so.total_amount or 0):,.2f}",
            severity="medium",
            link=f"/sales/orders/{so.id}",
            reference_type="sales_order",
            reference_id=so.id,
            created_by="Sales",
        )
    except Exception:
        pass
    return so


def list_sales_orders(db: Session, tenant_id: int, status: str | None = None) -> list[SalesOrder]:
    stmt = (
        select(SalesOrder)
        .options(joinedload(SalesOrder.customer))
        .where(SalesOrder.tenant_id == tenant_id)
    )
    if status:
        stmt = stmt.where(SalesOrder.status == status)
    stmt = stmt.order_by(SalesOrder.order_date.desc())
    return list(db.scalars(stmt).all())


def update_sales_order_status(
    db: Session, tenant_id: int, order_id: int, status: str
) -> SalesOrder | None:
    order = db.scalars(
        select(SalesOrder).where(
            SalesOrder.id == order_id, SalesOrder.tenant_id == tenant_id
        )
    ).first()
    if not order:
        return None
    previous = (order.status or "").lower()
    new_status = (status or "").lower()
    if new_status in {"confirmed", "approved"} and previous not in {
        "confirmed",
        "approved",
    }:
        from app.services.manufacturing_workflow_service import confirm_sales_order_workflow

        confirm_sales_order_workflow(db, tenant_id, order.id)
        db.refresh(order)
        return order

    order.status = status
    db.commit()
    db.refresh(order)
    return order


def confirm_sales_order(
    db: Session, tenant_id: int, order_id: int, requested_by: str | None = None
) -> dict:
    """Confirm SO and return MRP + production planning results."""
    from app.services.manufacturing_workflow_service import confirm_sales_order_workflow

    order = db.scalars(
        select(SalesOrder).where(
            SalesOrder.id == order_id, SalesOrder.tenant_id == tenant_id
        )
    ).first()
    if not order:
        raise ValueError("Sales order not found")
    previous = (order.status or "").lower()
    if previous in {"confirmed", "approved"}:
        # Already confirmed — return linked production snapshot
        from app.models.production import ProductionOrder

        pos = list(
            db.scalars(
                select(ProductionOrder).where(
                    ProductionOrder.tenant_id == tenant_id,
                    ProductionOrder.sales_order_id == order.id,
                )
            ).all()
        )
        return {
            "sales_order_id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "already_confirmed": True,
            "mrp_results": [],
            "production_orders": [
                {
                    "id": p.id,
                    "order_number": p.order_number,
                    "product_id": p.product_id,
                    "quantity": float(p.planned_quantity or 0),
                }
                for p in pos
            ],
            "warning": None,
        }
    return confirm_sales_order_workflow(
        db,
        tenant_id,
        order.id,
        requested_by=requested_by,
    )


def convert_quotation_to_sales_order(
    db: Session,
    tenant_id: int,
    quote_id: int,
    *,
    product_id: int | None = None,
    item_description: str | None = None,
    quantity: float | None = None,
    unit: str = "pcs",
    unit_price: float | None = None,
) -> SalesOrder:
    """Create a sales order from an accepted/sent quotation."""
    from datetime import date as date_cls
    from fastapi import HTTPException

    from app.models.product import Product

    quote = db.scalars(
        select(Quotation).where(
            Quotation.id == quote_id, Quotation.tenant_id == tenant_id
        )
    ).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if not quote.customer_id:
        raise HTTPException(
            status_code=400,
            detail="Quotation has no customer — link a customer before converting.",
        )

    # Avoid duplicate convert for same quote reference
    existing = db.scalars(
        select(SalesOrder).where(
            SalesOrder.tenant_id == tenant_id,
            SalesOrder.reference_number == quote.quote_number,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Sales order {existing.order_number} already exists for this quotation.",
        )

    ts = date_cls.today().strftime("%Y%m%d")
    so = SalesOrder(
        tenant_id=tenant_id,
        customer_id=quote.customer_id,
        order_number=f"SO-{quote.quote_number}",
        reference_number=quote.quote_number,
        order_date=date_cls.today(),
        status="draft",
        total_amount=float(quote.total_amount or 0),
        sales_person=quote.sales_person,
    )
    db.add(so)
    db.flush()

    if product_id:
        product = db.get(Product, product_id)
        qty = float(quantity or 1)
        price = float(
            unit_price
            if unit_price is not None
            else (product.unit_price if product and product.unit_price else 0)
        )
        desc = item_description or (product.name if product else f"Product #{product_id}")
        line_total = round(qty * price, 2)
        db.add(
            SalesOrderLine(
                sales_order_id=so.id,
                product_id=product_id,
                item_description=desc,
                quantity=qty,
                unit=unit,
                unit_price=price,
                line_total=line_total,
            )
        )
        so.total_amount = line_total

    quote.status = "accepted"
    db.commit()
    db.refresh(so)
    return so


def list_production_orders_for_sales_order(
    db: Session, tenant_id: int, sales_order_id: int, order_number: str | None = None
) -> list:
    from app.models.production import ProductionOrder

    stmt = select(ProductionOrder).where(
        ProductionOrder.tenant_id == tenant_id,
        ProductionOrder.sales_order_id == sales_order_id,
    )
    rows = list(db.scalars(stmt).all())
    if not rows and order_number:
        rows = list(
            db.scalars(
                select(ProductionOrder).where(
                    ProductionOrder.tenant_id == tenant_id,
                    ProductionOrder.sales_order_number == order_number,
                )
            ).all()
        )
    return rows


def get_sales_order_with_items(
    db: Session, tenant_id: int, order_id: int
) -> SalesOrder | None:
    stmt = (
        select(SalesOrder)
        .options(
            joinedload(SalesOrder.customer),
            selectinload(SalesOrder.line_items),
        )
        .where(SalesOrder.id == order_id, SalesOrder.tenant_id == tenant_id)
    )
    return db.scalars(stmt).first()


def _calc_gst(subtotal: float, sgst_pct: float, cgst_pct: float, igst_pct: float) -> tuple[float, float, float]:
    sgst = round(subtotal * (sgst_pct / 100), 2)
    cgst = round(subtotal * (cgst_pct / 100), 2)
    igst = round(subtotal * (igst_pct / 100), 2)
    return sgst, cgst, igst


def create_invoice(db: Session, payload: InvoiceCreate) -> Invoice:
    data = payload.model_dump(exclude={"items"})
    inv = Invoice(**data)
    db.add(inv)
    db.flush()
    subtotal = 0.0
    for item_data in payload.items:
        if hasattr(item_data, "model_dump"):
            item_payload = item_data.model_dump()
        elif isinstance(item_data, dict):
            item_payload = dict(item_data)
        else:
            item_payload = {"item_description": str(item_data), "qty": 0, "unit": "pcs", "rate": 0, "amount": 0}

        item = InvoiceItem(invoice_id=inv.id, **item_payload)
        db.add(item)
        subtotal += float(item.amount or 0)
    inv.subtotal = subtotal
    sgst, cgst, igst = _calc_gst(
        subtotal, inv.sgst_pct, inv.cgst_pct, inv.igst_pct
    )
    inv.sgst_amount = sgst
    inv.cgst_amount = cgst
    inv.igst_amount = igst
    inv.grand_total = round(
        subtotal - inv.discount + sgst + cgst + igst + inv.round_off, 2
    )
    if inv.status in (None, "", "draft"):
        inv.status = "issued"

    if inv.sales_order_id:
        so = db.get(SalesOrder, inv.sales_order_id)
        if so and so.tenant_id == inv.tenant_id:
            so.invoiced = True
            if so.status not in ("shipped", "delivered", "closed"):
                so.status = so.status or "invoiced"

    post_sales_invoice_journal(
        db,
        inv.tenant_id,
        invoice_number=inv.invoice_number,
        issue_date=inv.issue_date or date.today(),
        subtotal=float(inv.subtotal or 0),
        discount=float(inv.discount or 0),
        sgst=float(inv.sgst_amount or 0),
        cgst=float(inv.cgst_amount or 0),
        igst=float(inv.igst_amount or 0),
        round_off=float(inv.round_off or 0),
        grand_total=float(inv.grand_total or 0),
    )

    db.commit()
    db.refresh(inv)
    try:
        from app.services.alert_event_service import emit_alert

        emit_alert(
            db,
            tenant_id=inv.tenant_id,
            alert_type="invoice_generated",
            title=f"Invoice generated: {inv.invoice_number}",
            message=f"Invoice {inv.invoice_number} — ₹{float(inv.grand_total or 0):,.2f}",
            severity="medium",
            link="/sales/invoices",
            reference_type="invoice",
            reference_id=inv.id,
            created_by="Sales",
        )
    except Exception:
        pass
    return inv


def get_invoice_with_items(db: Session, invoice_id: int) -> Invoice | None:
    stmt = (
        select(Invoice)
        .options(
            joinedload(Invoice.customer),
            selectinload(Invoice.items),
        )
        .where(Invoice.id == invoice_id)
    )
    return db.scalars(stmt).first()


def list_invoices(
    db: Session, tenant_id: int, status: str | None = None
) -> list[Invoice]:
    stmt = (
        select(Invoice)
        .options(joinedload(Invoice.customer))
        .where(Invoice.tenant_id == tenant_id)
    )
    if status:
        stmt = stmt.where(Invoice.status == status)
    stmt = stmt.order_by(Invoice.issue_date.desc())
    return list(db.scalars(stmt).all())


def create_payment(db: Session, payload: PaymentCreate) -> Payment:
    p = Payment(**payload.model_dump())
    db.add(p)
    inv = db.get(Invoice, payload.invoice_id)
    if inv:
        inv.amount_paid = (inv.amount_paid or 0) + payload.amount
        inv.status = "paid" if inv.amount_paid >= inv.grand_total else "partial"
        try:
            from app.models.accounts import Income

            income = Income(
                tenant_id=payload.tenant_id,
                income_date=payload.payment_date,
                category="Sales Payment",
                source=inv.invoice_number,
                description=f"Payment for invoice #{inv.invoice_number}",
                amount=float(payload.amount),
            )
            db.add(income)
        except Exception:
            pass
        post_sales_payment_journal(
            db,
            payload.tenant_id,
            invoice_number=inv.invoice_number,
            payment_date=payload.payment_date,
            amount=float(payload.amount),
            method=payload.method or "cash",
        )
    db.commit()
    db.refresh(p)
    try:
        from app.services.alert_event_service import emit_alert

        inv_no = inv.invoice_number if inv else str(payload.invoice_id)
        emit_alert(
            db,
            tenant_id=payload.tenant_id,
            alert_type="payment_received",
            title=f"Payment received: {inv_no}",
            message=f"Payment of ₹{float(payload.amount):,.2f} recorded for {inv_no}",
            severity="low",
            link="/sales/payments",
            reference_type="payment",
            reference_id=p.id,
            created_by="Finance",
        )
    except Exception:
        pass
    return p


def list_payments(db: Session, tenant_id: int, invoice_id: int | None = None) -> list[Payment]:
    stmt = select(Payment).where(Payment.tenant_id == tenant_id)
    if invoice_id:
        stmt = stmt.where(Payment.invoice_id == invoice_id)
    stmt = stmt.order_by(Payment.payment_date.desc())
    return list(db.scalars(stmt).all())


def ensure_dispatch_shipment(
    db: Session,
    tenant_id: int,
    order: SalesOrder,
    *,
    status: str = "packed",
    courier: str | None = None,
    vehicle_number: str | None = None,
    driver_name: str | None = None,
    lr_number: str | None = None,
    eta: date | None = None,
    tracking_url: str | None = None,
) -> DispatchShipment:
    """Create or update a DispatchShipment / delivery challan for a sales order."""
    existing = db.scalars(
        select(DispatchShipment).where(
            DispatchShipment.tenant_id == tenant_id,
            DispatchShipment.sales_order_id == order.id,
        )
    ).first()
    challan = f"DC-{order.order_number}"
    if existing:
        existing.status = status
        if courier is not None:
            existing.courier = courier
        if vehicle_number is not None:
            existing.vehicle_number = vehicle_number
        if driver_name is not None:
            existing.driver_name = driver_name
        if lr_number is not None:
            existing.lr_number = lr_number
        if eta is not None:
            existing.eta = eta
        if tracking_url is not None:
            existing.tracking_url = tracking_url
        return existing

    shipment = DispatchShipment(
        tenant_id=tenant_id,
        dispatch_number=challan,
        sales_order_id=order.id,
        customer_id=order.customer_id,
        courier=courier,
        vehicle_number=vehicle_number,
        driver_name=driver_name,
        lr_number=lr_number,
        dispatch_date=date.today(),
        eta=eta or getattr(order, "delivery_date", None),
        status=status,
        tracking_url=tracking_url,
    )
    db.add(shipment)
    db.flush()
    return shipment


def create_or_update_dispatch_shipment(
    db: Session, tenant_id: int, payload: DispatchShipmentCreate
) -> DispatchShipment:
    order = db.scalars(
        select(SalesOrder).where(
            SalesOrder.id == payload.sales_order_id,
            SalesOrder.tenant_id == tenant_id,
        )
    ).first()
    if not order:
        from fastapi import HTTPException

        raise HTTPException(404, "Sales order not found")
    order.packed = True
    shipment = ensure_dispatch_shipment(
        db,
        tenant_id,
        order,
        status=payload.status or "packed",
        courier=payload.courier,
        vehicle_number=payload.vehicle_number,
        driver_name=payload.driver_name,
        lr_number=payload.lr_number,
        eta=payload.eta,
        tracking_url=payload.tracking_url,
    )
    db.commit()
    db.refresh(shipment)
    return shipment


def get_delivery_challan(
    db: Session, tenant_id: int, sales_order_id: int
) -> DeliveryChallanRead | None:
    order = db.scalars(
        select(SalesOrder)
        .options(
            joinedload(SalesOrder.customer),
            selectinload(SalesOrder.line_items),
        )
        .where(SalesOrder.id == sales_order_id, SalesOrder.tenant_id == tenant_id)
    ).first()
    if not order:
        return None

    shipment = db.scalars(
        select(DispatchShipment).where(
            DispatchShipment.tenant_id == tenant_id,
            DispatchShipment.sales_order_id == order.id,
        )
    ).first()
    if not shipment and order.packed:
        shipment = ensure_dispatch_shipment(db, tenant_id, order, status="packed")
        db.commit()
        db.refresh(shipment)

    challan_no = shipment.dispatch_number if shipment else f"DC-{order.order_number}"
    customer = order.customer
    address_parts = []
    if customer:
        for attr in ("address_line1", "address_line2", "state", "gstin"):
            val = getattr(customer, attr, None)
            if val:
                address_parts.append(str(val))

    lines = []
    for line in order.line_items or []:
        lines.append(
            {
                "product_id": line.product_id,
                "description": line.item_description or f"Item #{line.product_id}",
                "quantity": float(line.quantity or 0),
                "unit": line.unit,
                "unit_price": float(line.unit_price or 0),
                "line_total": float(line.line_total or 0),
            }
        )

    return DeliveryChallanRead(
        challan_number=challan_no,
        dispatch_number=challan_no,
        sales_order_id=order.id,
        so_number=order.order_number,
        customer_name=customer.name if customer else None,
        customer_address=", ".join(address_parts) if address_parts else None,
        dispatch_date=(
            shipment.dispatch_date.isoformat()
            if shipment and shipment.dispatch_date
            else (order.order_date.isoformat() if order.order_date else None)
        ),
        courier=shipment.courier if shipment else None,
        vehicle_number=shipment.vehicle_number if shipment else None,
        driver_name=shipment.driver_name if shipment else None,
        lr_number=shipment.lr_number if shipment else None,
        status=shipment.status if shipment else ("packed" if order.packed else "draft"),
        lines=lines,
        total_amount=float(order.total_amount or 0),
    )


def create_lead(db: Session, payload: LeadCreate) -> Lead:
    lead = Lead(**payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def list_leads(db: Session, tenant_id: int, status: str | None = None) -> list[Lead]:
    stmt = select(Lead).where(Lead.tenant_id == tenant_id)
    if status:
        stmt = stmt.where(Lead.status == status)
    stmt = stmt.order_by(Lead.id.desc())
    return list(db.scalars(stmt).all())


def update_lead_status(
    db: Session, tenant_id: int, lead_id: int, status: str
) -> Lead | None:
    lead = db.scalars(
        select(Lead).where(Lead.id == lead_id, Lead.tenant_id == tenant_id)
    ).first()
    if not lead:
        return None
    lead.status = status
    db.commit()
    db.refresh(lead)
    return lead


def create_quotation(db: Session, payload: QuotationCreate) -> Quotation:
    quote = Quotation(**payload.model_dump())
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


def list_quotations(
    db: Session, tenant_id: int, status: str | None = None
) -> list[Quotation]:
    stmt = (
        select(Quotation)
        .options(joinedload(Quotation.customer), joinedload(Quotation.lead))
        .where(Quotation.tenant_id == tenant_id)
    )
    if status:
        stmt = stmt.where(Quotation.status == status)
    stmt = stmt.order_by(Quotation.quote_date.desc())
    return list(db.scalars(stmt).all())


def update_quotation_status(
    db: Session, tenant_id: int, quote_id: int, status: str
) -> Quotation | None:
    quote = db.scalars(
        select(Quotation).where(
            Quotation.id == quote_id, Quotation.tenant_id == tenant_id
        )
    ).first()
    if not quote:
        return None
    quote.status = status
    db.commit()
    db.refresh(quote)
    return quote


def update_sales_order_dispatch(
    db: Session,
    tenant_id: int,
    order_id: int,
    packed: bool | None = None,
    shipped: bool | None = None,
) -> SalesOrder | None:
    order = db.scalars(
        select(SalesOrder).where(
            SalesOrder.id == order_id, SalesOrder.tenant_id == tenant_id
        )
    ).first()
    if not order:
        return None

    becoming_shipped = shipped is True and not order.shipped
    becoming_packed = packed is True and not order.packed

    if becoming_packed or (packed is True):
        order.packed = True
        ensure_dispatch_shipment(db, tenant_id, order, status="packed")

    if becoming_shipped:
        from app.services.manufacturing_workflow_service import ship_sales_order_stock_out

        ship_sales_order_stock_out(db, tenant_id, order.id)
        # ship_sales_order_stock_out commits; refresh and mark shipment in transit
        order = db.scalars(
            select(SalesOrder).where(
                SalesOrder.id == order_id, SalesOrder.tenant_id == tenant_id
            )
        ).first()
        if order:
            ensure_dispatch_shipment(db, tenant_id, order, status="in_transit")
            db.commit()
            db.refresh(order)
        return order

    if packed is not None:
        order.packed = packed
    if shipped is not None:
        order.shipped = shipped
    db.commit()
    db.refresh(order)
    return order
