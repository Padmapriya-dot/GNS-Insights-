from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import require_permission, tenant_scope
from app.models.user import User
from app.schemas.inventory import SupplierRead
from app.schemas.vendor import (
    VendorCreate,
    VendorDetailRead,
    VendorListRead,
    VendorSummaryRead,
    VendorUpdate,
)
from app.schemas.procurement import (
    GoodsReceiptCreate,
    GoodsReceiptQCRequest,
    GoodsReceiptRead,
    MaterialRequestConvertToPORequest,
    MaterialRequestCreate,
    MaterialRequestRead,
    PurchaseOrderCreate,
    PurchaseOrderListRead,
    PurchaseOrderRead,
    SupplierPaymentCreate,
    SupplierPaymentRead,
)
from app.services.inventory_service import update_supplier_approval
from app.services.vendor_service import (
    create_vendor,
    deactivate_vendor,
    get_vendor_detail,
    get_vendor_summary,
    list_vendors_enriched,
    update_vendor,
)
from app.services.procurement_service import (
    approve_goods_receipt_qc,
    convert_material_request_to_purchase_order,
    create_goods_receipt,
    create_material_request,
    create_purchase_order,
    create_supplier_payment,
    get_material_request,
    list_goods_receipts,
    list_material_requests,
    list_purchase_orders,
    list_supplier_payments,
    update_purchase_order_status,
)
from app.schemas.procurement_extended import (
    GRNListRead,
    GRNSummaryRead,
    MRListRead,
    MRSummaryRead,
    POListRead,
    POSummaryRead,
    ProcurementHubRead,
    RFQCreate,
    RFQListRead,
    RFQSummaryRead,
    RFQAward,
    VendorBillCreate,
    VendorBillListRead,
    VendorBillStatusUpdate,
    VendorBillSummaryRead,
    VendorComparisonRead,
    VendorQuotationCreate,
)
from app.services.procurement_extended_service import (
    award_rfq,
    create_rfq,
    create_vendor_bill,
    create_vendor_quotation,
    update_vendor_bill_status,
    get_grn_summary,
    get_mr_summary,
    get_po_summary,
    get_procurement_hub,
    get_rfq_comparison,
    get_rfq_summary,
    get_vendor_bill_summary,
    list_grn_enriched,
    list_mr_enriched,
    list_po_enriched,
    list_rfq_enriched,
    list_vendor_bills_enriched,
)

router = APIRouter(prefix="/procurement", tags=["procurement"])

MODULE = "procurement"


@router.post("/purchase-orders", response_model=PurchaseOrderRead)
def create_purchase_order_endpoint(
    payload: PurchaseOrderCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> PurchaseOrderRead:
    payload.tenant_id = user.tenant_id
    return create_purchase_order(db, payload)


@router.get("/purchase-orders", response_model=list[PurchaseOrderListRead])
def list_purchase_orders_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
) -> list[PurchaseOrderListRead]:
    orders = list_purchase_orders(db, tenant_id)
    return [
        PurchaseOrderListRead(
            **PurchaseOrderRead.model_validate(o).model_dump(),
            supplier_name=o.supplier.name if o.supplier else None,
        )
        for o in orders
    ]


@router.patch("/purchase-orders/{po_id}/status", response_model=PurchaseOrderRead)
def update_purchase_order_status_endpoint(
    po_id: int,
    status: str = Query(..., description="e.g. draft, approved, received, cancelled"),
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
) -> PurchaseOrderRead:
    po = update_purchase_order_status(db, po_id, tenant_id, status)
    if not po:
        raise HTTPException(404, "Purchase order not found")
    return po


@router.get("/vendors/summary", response_model=VendorSummaryRead)
def vendor_summary_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
) -> VendorSummaryRead:
    return get_vendor_summary(db, tenant_id)


@router.get("/vendors", response_model=list[VendorListRead])
def list_vendors_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
) -> list[VendorListRead]:
    return list_vendors_enriched(db, tenant_id)


@router.post("/vendors", response_model=VendorListRead)
def create_vendor_endpoint(
    payload: VendorCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> VendorListRead:
    payload.tenant_id = user.tenant_id
    supplier = create_vendor(db, payload)
    from app.services.vendor_service import _to_list_read

    return _to_list_read(db, user.tenant_id, supplier)


@router.get("/vendors/{vendor_id}", response_model=VendorDetailRead)
def get_vendor_endpoint(
    vendor_id: int,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
) -> VendorDetailRead:
    detail = get_vendor_detail(db, tenant_id, vendor_id)
    if not detail:
        raise HTTPException(404, "Vendor not found")
    return detail


@router.put("/vendors/{vendor_id}", response_model=VendorListRead)
def update_vendor_endpoint(
    vendor_id: int,
    payload: VendorUpdate,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
) -> VendorListRead:
    supplier = update_vendor(db, tenant_id, vendor_id, payload)
    if not supplier:
        raise HTTPException(404, "Vendor not found")
    enriched = list_vendors_enriched(db, tenant_id)
    match = next((v for v in enriched if v.id == vendor_id), None)
    if not match:
        raise HTTPException(404, "Vendor not found")
    return match


@router.patch("/vendors/{vendor_id}/deactivate", response_model=VendorListRead)
def deactivate_vendor_endpoint(
    vendor_id: int,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
) -> VendorListRead:
    supplier = deactivate_vendor(db, tenant_id, vendor_id)
    if not supplier:
        raise HTTPException(404, "Vendor not found")
    enriched = list_vendors_enriched(db, tenant_id)
    match = next((v for v in enriched if v.id == vendor_id), None)
    if not match:
        raise HTTPException(404, "Vendor not found")
    return match


@router.patch("/vendors/{vendor_id}/approval", response_model=SupplierRead)
def update_vendor_approval_endpoint(
    vendor_id: int,
    status: str = Query(..., description="approved or rejected"),
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
) -> SupplierRead:
    if status not in ("approved", "rejected", "pending"):
        raise HTTPException(400, "Invalid approval status")
    vendor = update_supplier_approval(db, tenant_id, vendor_id, status)
    if not vendor:
        raise HTTPException(404, "Vendor not found")
    return vendor


@router.post("/material-requests", response_model=MaterialRequestRead)
def create_material_request_endpoint(
    payload: MaterialRequestCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> MaterialRequestRead:
    payload.tenant_id = user.tenant_id
    return create_material_request(db, payload)


@router.get("/material-requests", response_model=list[MaterialRequestRead])
def list_material_requests_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
) -> list[MaterialRequestRead]:
    return list_material_requests(db, tenant_id)


@router.get("/material-requests/summary", response_model=MRSummaryRead)
def mr_summary(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_mr_summary(db, tenant_id)


@router.get("/material-requests/enriched", response_model=list[MRListRead])
def mr_enriched(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return list_mr_enriched(db, tenant_id)


@router.get("/material-requests/{mr_id}", response_model=MaterialRequestRead)
def get_material_request_endpoint(
    mr_id: int,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
) -> MaterialRequestRead:
    mr = get_material_request(db, tenant_id, mr_id)
    if not mr:
        raise HTTPException(404, "Material request not found")
    return mr


@router.post(
    "/material-requests/{mr_id}/convert-to-po",
    response_model=PurchaseOrderRead,
)
def convert_material_request_to_po_endpoint(
    mr_id: int,
    payload: MaterialRequestConvertToPORequest,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> PurchaseOrderRead:
    return convert_material_request_to_purchase_order(
        db, user.tenant_id, mr_id, payload
    )


@router.post("/goods-receipt", response_model=GoodsReceiptRead)
def create_goods_receipt_endpoint(
    payload: GoodsReceiptCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> GoodsReceiptRead:
    payload.tenant_id = user.tenant_id
    return create_goods_receipt(db, payload)


@router.get("/goods-receipt", response_model=list[GoodsReceiptRead])
def list_goods_receipts_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
) -> list[GoodsReceiptRead]:
    return list_goods_receipts(db, tenant_id)


@router.get("/goods-receipt/summary", response_model=GRNSummaryRead)
def grn_summary(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_grn_summary(db, tenant_id)


@router.get("/goods-receipt/enriched", response_model=list[GRNListRead])
def grn_enriched(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return list_grn_enriched(db, tenant_id)


@router.post("/goods-receipt/{grn_id}/qc", response_model=GoodsReceiptRead)
def goods_receipt_qc_endpoint(
    grn_id: int,
    payload: GoodsReceiptQCRequest,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> GoodsReceiptRead:
    return approve_goods_receipt_qc(db, user.tenant_id, grn_id, payload)


@router.post("/supplier-payments", response_model=SupplierPaymentRead)
def create_supplier_payment_endpoint(
    payload: SupplierPaymentCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> SupplierPaymentRead:
    payload.tenant_id = user.tenant_id
    return create_supplier_payment(db, payload)


@router.get("/supplier-payments", response_model=list[SupplierPaymentRead])
def list_supplier_payments_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
) -> list[SupplierPaymentRead]:
    return list_supplier_payments(db, tenant_id)


@router.get("/rfq/summary", response_model=RFQSummaryRead)
def rfq_summary(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_rfq_summary(db, tenant_id)


@router.get("/rfq", response_model=list[RFQListRead])
def rfq_list(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return list_rfq_enriched(db, tenant_id)


@router.post("/rfq", response_model=RFQListRead)
def create_rfq_endpoint(
    payload: RFQCreate,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    rfq = create_rfq(db, tenant_id, payload)
    rows = list_rfq_enriched(db, tenant_id)
    match = next((r for r in rows if r.id == rfq.id), None)
    if not match:
        raise HTTPException(500, "RFQ created but could not be loaded")
    return match


@router.post("/rfq/{rfq_id}/quotation")
def create_quotation_endpoint(
    rfq_id: int,
    payload: VendorQuotationCreate,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    q = create_vendor_quotation(db, tenant_id, rfq_id, payload)
    return {"message": "Quotation recorded successfully", "id": q.id}


@router.patch("/rfq/{rfq_id}/award", response_model=RFQListRead)
def award_rfq_endpoint(
    rfq_id: int,
    payload: RFQAward,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    rfq = award_rfq(db, tenant_id, rfq_id, payload.supplier_id)
    if not rfq:
        raise HTTPException(404, "RFQ not found")
    rows = list_rfq_enriched(db, tenant_id)
    match = next((r for r in rows if r.id == rfq.id), None)
    if not match:
        raise HTTPException(500, "RFQ awarded but could not be loaded")
    return match


@router.get("/rfq/{rfq_id}/comparison", response_model=list[VendorComparisonRead])
def rfq_comparison(rfq_id: int, tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_rfq_comparison(db, tenant_id, rfq_id)



@router.get("/purchase-orders/summary", response_model=POSummaryRead)
def po_summary(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_po_summary(db, tenant_id)


@router.get("/purchase-orders/enriched", response_model=list[POListRead])
def po_enriched(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return list_po_enriched(db, tenant_id)


@router.get("/vendor-bills/summary", response_model=VendorBillSummaryRead)
def vendor_bill_summary(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_vendor_bill_summary(db, tenant_id)


@router.get("/vendor-bills", response_model=list[VendorBillListRead])
def vendor_bills_list(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return list_vendor_bills_enriched(db, tenant_id)


@router.post("/vendor-bills", response_model=VendorBillListRead)
def create_vendor_bill_endpoint(
    payload: VendorBillCreate,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    bill = create_vendor_bill(db, tenant_id, payload)
    rows = list_vendor_bills_enriched(db, tenant_id)
    match = next((r for r in rows if r.id == bill.id), None)
    if not match:
        raise HTTPException(500, "Vendor bill created but could not be loaded")
    return match


@router.patch("/vendor-bills/{bill_id}/status", response_model=VendorBillListRead)
def update_vendor_bill_status_endpoint(
    bill_id: int,
    payload: VendorBillStatusUpdate,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    bill = update_vendor_bill_status(db, tenant_id, bill_id, payload.status)
    if not bill:
        raise HTTPException(404, "Vendor bill not found")
    rows = list_vendor_bills_enriched(db, tenant_id)
    match = next((r for r in rows if r.id == bill.id), None)
    if not match:
        raise HTTPException(500, "Vendor bill updated but could not be loaded")
    return match



@router.get("/hub", response_model=ProcurementHubRead)
def procurement_hub(tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)):
    return get_procurement_hub(db, tenant_id)
