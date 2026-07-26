from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.permissions import require_any_permission, require_permission, tenant_scope, tenant_scope_any
from app.models.user import User
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemRead,
    StockLevelCreate,
    StockLevelRead,
    StockMovementCreate,
    StockMovementRead,
    SupplierCreate,
    SupplierRead,
    WarehouseCreate,
    WarehouseRead,
)
from app.schemas.warehouse import (
    WarehouseCreateExtended,
    WarehouseDetailRead,
    WarehouseListRead,
    WarehouseSummaryRead,
    WarehouseUpdate,
)
from app.services.warehouse_service import (
    create_warehouse_extended,
    deactivate_warehouse,
    get_warehouse_detail,
    get_warehouse_summary,
    list_warehouses_enriched,
    update_warehouse,
)
from app.services.inventory_service import (
    create_inventory_item,
    create_stock_level,
    create_supplier,
    create_warehouse,
    get_inventory_dashboard,
    get_item_by_barcode,
    get_stock_by_item,
    get_total_stock,
    list_inventory_items,
    list_stock_levels_by_warehouse,
    list_suppliers,
    list_warehouses,
    record_stock_movement,
    update_stock_level,
)
from app.schemas.inventory_extended import (
    FinishedGoodListRead,
    InventoryHubRead,
    InventorySummaryRead,
    LedgerEntryRead,
    LedgerSummaryRead,
    MaterialDetailRead,
    MaterialListRead,
    StockAdjustmentCreate,
    StockAdjustmentRead,
    StockTransferCreate,
    StockTransferRead,
)
from app.services.inventory_extended_service import (
    create_adjustment,
    create_transfer,
    get_finished_goods_summary,
    get_inventory_hub,
    get_ledger_summary,
    get_material_detail,
    get_materials_summary,
    list_adjustments,
    list_finished_goods_enriched,
    list_ledger_entries,
    list_materials_enriched,
    list_transfers,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])

MODULE = "inventory"


@router.post("/warehouses", response_model=WarehouseRead)
def create_warehouse_endpoint(
    payload: WarehouseCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> WarehouseRead:
    payload.tenant_id = user.tenant_id
    return create_warehouse(db, payload)


@router.post("/warehouses/full", response_model=WarehouseListRead)
def create_warehouse_full_endpoint(
    payload: WarehouseCreateExtended,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> WarehouseListRead:
    payload.tenant_id = user.tenant_id
    wh = create_warehouse_extended(db, payload)
    from app.services.warehouse_service import _to_list_read
    return _to_list_read(db, wh)


@router.get("/warehouses/summary", response_model=WarehouseSummaryRead)
def warehouse_summary_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
) -> WarehouseSummaryRead:
    return get_warehouse_summary(db, tenant_id)


@router.get("/warehouses", response_model=list[WarehouseListRead])
def list_warehouses_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
) -> list[WarehouseListRead]:
    return list_warehouses_enriched(db, tenant_id)


@router.get("/warehouses/{warehouse_id}", response_model=WarehouseDetailRead)
def get_warehouse_endpoint(
    warehouse_id: int,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
) -> WarehouseDetailRead:
    detail = get_warehouse_detail(db, tenant_id, warehouse_id)
    if not detail:
        raise HTTPException(404, "Warehouse not found")
    return detail


@router.put("/warehouses/{warehouse_id}", response_model=WarehouseListRead)
def update_warehouse_endpoint(
    warehouse_id: int,
    payload: WarehouseUpdate,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
) -> WarehouseListRead:
    wh = update_warehouse(db, tenant_id, warehouse_id, payload)
    if not wh:
        raise HTTPException(404, "Warehouse not found")
    enriched = list_warehouses_enriched(db, tenant_id)
    match = next((w for w in enriched if w.id == warehouse_id), None)
    if not match:
        raise HTTPException(404, "Warehouse not found")
    return match


@router.patch("/warehouses/{warehouse_id}/deactivate", response_model=WarehouseListRead)
def deactivate_warehouse_endpoint(
    warehouse_id: int,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
) -> WarehouseListRead:
    wh = deactivate_warehouse(db, tenant_id, warehouse_id)
    if not wh:
        raise HTTPException(404, "Warehouse not found")
    enriched = list_warehouses_enriched(db, tenant_id)
    match = next((w for w in enriched if w.id == warehouse_id), None)
    if not match:
        raise HTTPException(404, "Warehouse not found")
    return match


@router.post("/suppliers", response_model=SupplierRead)
def create_supplier_endpoint(
    payload: SupplierCreate,
    user: User = Depends(require_any_permission("inventory", "procurement", "accounts")),
    db: Session = Depends(get_db),
) -> SupplierRead:
    payload.tenant_id = user.tenant_id
    return create_supplier(db, payload)


@router.get("/suppliers", response_model=list[SupplierRead])
def list_suppliers_endpoint(
    tenant_id: int = Depends(tenant_scope_any("inventory", "procurement", "accounts")), db: Session = Depends(get_db)
) -> list[SupplierRead]:
    return list_suppliers(db, tenant_id)


@router.post("/items", response_model=InventoryItemRead)
def create_item_endpoint(
    payload: InventoryItemCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> InventoryItemRead:
    payload.tenant_id = user.tenant_id
    return create_inventory_item(db, payload)


@router.get("/items", response_model=list[InventoryItemRead])
def list_items_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    low_stock_only: bool = Query(False),
    item_type: str | None = Query(None),
    db: Session = Depends(get_db),
) -> list[InventoryItemRead]:
    return list_inventory_items(db, tenant_id, low_stock_only, item_type)


@router.get("/items/barcode/{barcode}")
def get_item_by_barcode_endpoint(
    barcode: str,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    item = get_item_by_barcode(db, tenant_id, barcode)
    if not item:
        raise HTTPException(404, "No item found for that barcode")
    total = get_total_stock(db, item.id)
    return {
        "found": True,
        "item": InventoryItemRead.model_validate(item),
        "total_stock": total,
        "needs_reorder": total < item.reorder_level if item.reorder_level else False,
    }


@router.get("/dashboard")
def inventory_dashboard_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    item_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return get_inventory_dashboard(db, tenant_id, item_type)


@router.post("/stock-levels", response_model=StockLevelRead)
def create_stock_level_endpoint(
    payload: StockLevelCreate,
    _: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> StockLevelRead:
    return create_stock_level(db, payload)


@router.get("/stock-levels/warehouse/{warehouse_id}", response_model=list[StockLevelRead])
def list_stock_by_warehouse_endpoint(
    warehouse_id: int,
    _: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> list[StockLevelRead]:
    return list_stock_levels_by_warehouse(db, warehouse_id)


@router.get("/stock-levels/item/{item_id}", response_model=list[StockLevelRead])
def list_stock_by_item_endpoint(
    item_id: int,
    _: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> list[StockLevelRead]:
    return get_stock_by_item(db, item_id)


@router.put("/stock-levels")
def update_stock_endpoint(
    warehouse_id: int = Query(...),
    item_id: int = Query(...),
    quantity: int = Query(...),
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
):
    sl = update_stock_level(db, warehouse_id, item_id, quantity)
    if not sl:
        raise HTTPException(404, "Stock level not found for that warehouse/item")
    from app.services.alert_service import sync_low_stock_alerts

    sync_low_stock_alerts(db, user.tenant_id)
    return {"updated": True, "quantity": sl.quantity}


@router.get("/stock-movements", response_model=list[StockMovementRead])
def list_stock_movements_endpoint(
    tenant_id: int = Depends(tenant_scope(MODULE)),
    item_id: int | None = Query(None),
    db: Session = Depends(get_db),
) -> list[StockMovementRead]:
    from app.services.inventory_service import list_stock_movements

    return list_stock_movements(db, tenant_id, item_id)


@router.post("/stock-movements", response_model=StockMovementRead)
def record_movement_endpoint(
    payload: StockMovementCreate,
    user: User = Depends(require_permission(MODULE)),
    db: Session = Depends(get_db),
) -> StockMovementRead:
    if hasattr(payload, "tenant_id"):
        payload.tenant_id = user.tenant_id
    movement = record_stock_movement(db, payload)
    from app.services.alert_service import sync_low_stock_alerts

    sync_low_stock_alerts(db, user.tenant_id)
    return movement


@router.get("/raw-materials/summary", response_model=InventorySummaryRead)
def raw_materials_summary(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
):
    return get_materials_summary(db, tenant_id)


@router.get("/raw-materials", response_model=list[MaterialListRead])
def raw_materials_list(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
):
    return list_materials_enriched(db, tenant_id)


@router.get("/raw-materials/{item_id}", response_model=MaterialDetailRead)
def raw_material_detail(
    item_id: int,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    detail = get_material_detail(db, tenant_id, item_id)
    if not detail:
        raise HTTPException(404, "Material not found")
    return detail


@router.get("/finished-goods/summary")
def finished_goods_summary(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
):
    return get_finished_goods_summary(db, tenant_id)


@router.get("/finished-goods", response_model=list[FinishedGoodListRead])
def finished_goods_list(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
):
    return list_finished_goods_enriched(db, tenant_id)


@router.get("/transfers", response_model=list[StockTransferRead])
def transfers_list(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
):
    return list_transfers(db, tenant_id)


@router.post("/transfers", response_model=StockTransferRead)
def create_transfer_endpoint(
    payload: StockTransferCreate,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    t = create_transfer(db, tenant_id, payload)
    rows = list_transfers(db, tenant_id)
    match = next((r for r in rows if r.id == t.id), None)
    if not match:
        raise HTTPException(500, "Transfer created but could not be loaded")
    return match


@router.get("/adjustments", response_model=list[StockAdjustmentRead])
def adjustments_list(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
):
    return list_adjustments(db, tenant_id)


@router.post("/adjustments", response_model=StockAdjustmentRead)
def create_adjustment_endpoint(
    payload: StockAdjustmentCreate,
    tenant_id: int = Depends(tenant_scope(MODULE)),
    db: Session = Depends(get_db),
):
    a = create_adjustment(db, tenant_id, payload)
    rows = list_adjustments(db, tenant_id)
    match = next((r for r in rows if r.id == a.id), None)
    if not match:
        raise HTTPException(500, "Adjustment created but could not be loaded")
    return match


@router.get("/ledger/summary", response_model=LedgerSummaryRead)
def ledger_summary(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
):
    return get_ledger_summary(db, tenant_id)


@router.get("/ledger", response_model=list[LedgerEntryRead])
def ledger_list(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
):
    return list_ledger_entries(db, tenant_id)


@router.get("/hub", response_model=InventoryHubRead)
def inventory_hub(
    tenant_id: int = Depends(tenant_scope(MODULE)), db: Session = Depends(get_db)
):
    return get_inventory_hub(db, tenant_id)
