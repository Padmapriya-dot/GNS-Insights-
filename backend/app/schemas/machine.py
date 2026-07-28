from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class MachineExtendedBase(BaseModel):
    tenant_id: int
    code: str
    name: str
    status: str = "idle"
    location: str | None = None
    plant_code: str | None = None
    is_active: bool = True
    machine_type: str | None = None
    department: str | None = None
    production_line: str | None = None
    work_center: str | None = None
    manufacturer: str | None = None
    model_name: str | None = None
    serial_number: str | None = None
    purchase_date: date | None = None
    warranty_until: date | None = None
    assigned_operator: str | None = None
    current_shift: str | None = None
    health_score: float | None = None
    efficiency_pct: float | None = None
    oee_pct: float | None = None
    temperature_c: float | None = None
    rpm: float | None = None
    last_maintenance_date: date | None = None
    next_maintenance_date: date | None = None


class MachineCreateExtended(MachineExtendedBase):
    pass


class MachineFullUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    status: str | None = None
    location: str | None = None
    is_active: bool | None = None
    machine_type: str | None = None
    department: str | None = None
    production_line: str | None = None
    work_center: str | None = None
    manufacturer: str | None = None
    model_name: str | None = None
    serial_number: str | None = None
    purchase_date: date | None = None
    warranty_until: date | None = None
    assigned_operator: str | None = None
    current_shift: str | None = None
    health_score: float | None = None
    efficiency_pct: float | None = None
    oee_pct: float | None = None
    temperature_c: float | None = None
    rpm: float | None = None
    last_maintenance_date: date | None = None
    next_maintenance_date: date | None = None


class MachineListRead(MachineExtendedBase):
    id: int
    display_status: str = "idle"
    current_work_order: str | None = None
    current_product: str | None = None
    todays_output: int | None = 0
    target_quantity: int | None = 0
    created_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class MachineSummaryRead(BaseModel):
    total_machines: int = 0
    running: int = 0
    idle: int = 0
    maintenance: int = 0
    breakdown: int = 0
    offline: int = 0
    utilization_pct: float = 0
    todays_production: int = 0


class MachineWorkOrderRead(BaseModel):
    id: int
    work_order_number: str
    status: str
    planned_quantity: float
    actual_quantity: float | None = None
    model_config = ConfigDict(from_attributes=True)


class MachineMaintenanceRead(BaseModel):
    id: int
    maintenance_date: date
    maintenance_type: str
    description: str | None = None
    performed_by: str | None = None
    model_config = ConfigDict(from_attributes=True)


class MachineStatusLogRead(BaseModel):
    id: int
    status: str
    started_at: datetime
    reason: str | None = None
    model_config = ConfigDict(from_attributes=True)


class MachineDetailRead(MachineListRead):
    availability_pct: float | None = None
    performance_pct: float | None = None
    quality_pct: float | None = None
    work_orders: list[MachineWorkOrderRead] = Field(default_factory=list)
    maintenance_history: list[MachineMaintenanceRead] = Field(default_factory=list)
    status_logs: list[MachineStatusLogRead] = Field(default_factory=list)
    downtime_minutes: int = 0
    energy_kwh: float | None = None
