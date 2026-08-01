from pydantic import BaseModel


class AllocationSummaryRead(BaseModel):
    total_machines: int = 0
    allocated: int = 0
    free_machines: int = 0
    under_maintenance: int = 0
    utilization_pct: float = 0


class AllocationRowRead(BaseModel):
    work_order_id: int
    work_order_number: str
    product_name: str
    machine_id: int | None = None
    machine_name: str | None = None
    operator_name: str | None = None
    shift: str | None = None
    supervisor: str | None = None
    capacity_pct: float = 0
    status: str = "unassigned"
    priority: str = "medium"


class MachineAvailabilityRead(BaseModel):
    machine_id: int
    machine_name: str
    status: str
    free_time: str | None = None
    current_job: str | None = None
    utilization_pct: float = 0


class AllocationAssignRequest(BaseModel):
    work_order_id: int
    machine_id: int
    operator_name: str | None = None
    shift: str | None = None
    supervisor: str | None = None
