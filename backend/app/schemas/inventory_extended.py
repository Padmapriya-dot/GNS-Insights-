from datetime import date

from pydantic import BaseModel


class InventorySummaryRead(BaseModel):
    total_items: int = 0
    available_stock: int = 0
    low_stock: int = 0
    out_of_stock: int = 0
    stock_value: float = 0
    expiring_soon: int = 0
    reorder_items: int = 0


class MaterialListRead(BaseModel):
    id: int
    sku: str
    name: str
    category: str | None = None
    warehouse_name: str | None = None
    batch_number: str | None = None
    quantity: int = 0
    reserved: int = 0
    available: int = 0
    unit: str = "pcs"
    reorder_level: int = 0
    unit_cost: float | None = None
    stock_value: float | None = None
    status: str = "available"
    barcode: str | None = None
    vendor_name: str | None = None
    item_type: str = "raw_material"


class FinishedGoodListRead(BaseModel):
    id: int
    sku: str
    name: str
    batch_number: str | None = None
    quantity: int = 0
    reserved: int = 0
    available: int = 0
    warehouse_name: str | None = None
    customer_name: str | None = None
    status: str = "available"
    production_date: str | None = None
    expiry_date: str | None = None
    warranty: str | None = None
    serial_number: str | None = None
    qr_code: str | None = None
    unit_cost: float | None = None
    stock_value: float | None = None


class MaterialDetailRead(BaseModel):
    id: int
    sku: str
    name: str
    barcode: str | None = None
    category: str | None = None
    unit: str = "pcs"
    unit_cost: float | None = None
    reorder_level: int = 0
    description: str | None = None
    vendor_name: str | None = None
    vendor_contact: str | None = None
    vendor_email: str | None = None
    stock_history: list[dict] = []
    purchase_history: list[dict] = []
    consumption_history: list[dict] = []
    batches: list[dict] = []


class StockTransferCreate(BaseModel):
    transfer_number: str | None = None
    transfer_date: str | None = None
    from_warehouse_id: int
    to_warehouse_id: int
    item_id: int
    batch_number: str | None = None
    quantity: int
    vehicle: str | None = None
    driver: str | None = None
    notes: str | None = None


class StockTransferStatusUpdate(BaseModel):
    status: str
    approved_by: str | None = None



class StockTransferRead(BaseModel):
    id: int
    transfer_number: str
    transfer_date: str | None = None
    from_warehouse: str
    to_warehouse: str
    item_name: str
    batch_number: str | None = None
    quantity: int
    status: str
    approved_by: str | None = None
    vehicle: str | None = None
    driver: str | None = None


class StockAdjustmentCreate(BaseModel):
    adjustment_date: str | None = None
    warehouse_id: int
    item_id: int
    new_qty: int
    reason: str


class StockAdjustmentStatusUpdate(BaseModel):
    status: str
    approved_by: str | None = None



class StockAdjustmentRead(BaseModel):
    id: int
    adjustment_date: str | None = None
    warehouse_name: str
    item_name: str
    old_qty: int
    new_qty: int
    difference: int
    reason: str
    status: str
    approved_by: str | None = None


class LedgerSummaryRead(BaseModel):
    total_transactions: int = 0
    stock_in: int = 0
    stock_out: int = 0
    transfers: int = 0
    adjustments: int = 0
    current_stock_value: float = 0


class LedgerEntryRead(BaseModel):
    id: int
    date: str | None = None
    transaction: str
    warehouse_name: str
    item_name: str
    batch_number: str | None = None
    qty_in: int = 0
    qty_out: int = 0
    balance: int = 0
    user_name: str | None = None
    reference: str | None = None


class InventoryHubRead(BaseModel):
    total_inventory_value: float = 0
    low_stock_items: int = 0
    dead_stock: int = 0
    fast_moving: int = 0
    slow_moving: int = 0
    todays_transactions: int = 0
    warehouse_stock: list[dict] = []
    top_materials: list[dict] = []
