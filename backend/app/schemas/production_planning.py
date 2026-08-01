from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ProductionOrderListRead(BaseModel):
    id: int
    tenant_id: int
    product_id: int
    order_number: str
    planned_quantity: float
    produced_quantity: float = 0
    balance_quantity: float = 0
    scrap_quantity: float = 0
    start_date: datetime | None = None
    due_date: datetime | None = None
    status: str = "planned"
    customer_name: str | None = None
    priority: str = "medium"
    bom_version: str | None = None
    sales_order_number: str | None = None
    department: str | None = None
    shift: str | None = None
    product_name: str | None = None
    product_code: str | None = None
    work_order_number: str | None = None
    machine_name: str | None = None
    machine_code: str | None = None
    progress_pct: float = 0
    is_delayed: bool = False
    model_config = ConfigDict(from_attributes=True)


class ProductionPlanningSummaryRead(BaseModel):
    total_orders: int = 0
    planned_orders: int = 0
    in_progress_orders: int = 0
    completed_orders: int = 0
    delayed_orders: int = 0
    cancelled_orders: int = 0
    todays_target: int = 0
    todays_production: int = 0


class ProductionMaterialRead(BaseModel):
    component_name: str
    required_qty: float
    available_qty: float
    issued_qty: float = 0
    balance_qty: float = 0
    unit: str = "pcs"


class ProductionWorkOrderRead(BaseModel):
    id: int
    work_order_number: str
    status: str
    planned_quantity: float
    actual_quantity: float | None = None
    machine_name: str | None = None
    model_config = ConfigDict(from_attributes=True)


class ProductionStartCheckRead(BaseModel):
    check_type: str
    label: str
    ready: bool
    message: str


class ProductionOrderDetailRead(ProductionOrderListRead):
    batch_number: str | None = None
    operator_name: str | None = None
    supervisor: str | None = None
    machine_status: str | None = None
    machine_utilization_pct: float | None = None
    operator_efficiency_pct: float | None = None
    scrap_pct: float = 0
    production_efficiency_pct: float = 0
    downtime_minutes: int = 0
    oee_pct: float | None = None
    quality_status: str = "pending"
    materials: list[ProductionMaterialRead] = Field(default_factory=list)
    work_orders: list[ProductionWorkOrderRead] = Field(default_factory=list)
    documents: list[dict] = Field(default_factory=list)
    audit_logs: list[dict] = Field(default_factory=list)


class ProductionStartResponse(BaseModel):
    success: bool
    checks: list[ProductionStartCheckRead]
    order: ProductionOrderListRead | None = None
    message: str


class ProductionCompleteResponse(BaseModel):
    success: bool
    steps: list[str]
    order: ProductionOrderListRead | None = None
    message: str
