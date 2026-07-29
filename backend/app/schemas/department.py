from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DepartmentBase(BaseModel):
    tenant_id: int
    code: str
    name: str
    department_type: str = "production"
    plant: str | None = None
    branch: str | None = None
    description: str | None = None
    status: str = "active"
    manager_name: str | None = None
    manager_mobile: str | None = None
    manager_email: str | None = None
    manager_designation: str | None = None
    employee_count: int | None = 0
    machine_count: int | None = 0
    work_center_count: int | None = 0
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    department_type: str | None = None
    plant: str | None = None
    branch: str | None = None
    description: str | None = None
    status: str | None = None
    manager_name: str | None = None
    manager_mobile: str | None = None
    manager_email: str | None = None
    manager_designation: str | None = None
    employee_count: int | None = None
    machine_count: int | None = None
    work_center_count: int | None = None
    is_active: bool | None = None


class DepartmentListRead(DepartmentBase):
    id: int
    employee_count: int = 0
    machine_count: int = 0
    work_center_count: int = 0
    created_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class DepartmentSummaryRead(BaseModel):
    total_departments: int = 0
    active_departments: int = 0
    production_departments: int = 0
    support_departments: int = 0
    total_employees: int = 0
    total_machines: int = 0


class DepartmentWorkCenterRead(BaseModel):
    name: str
    capacity: str | None = None
    shift: str | None = None
    supervisor: str | None = None


class DepartmentEmployeeRead(BaseModel):
    id: int
    employee_code: str
    full_name: str
    email: str | None = None
    is_active: bool = True
    model_config = ConfigDict(from_attributes=True)


class DepartmentMachineRead(BaseModel):
    id: int
    code: str
    name: str
    status: str
    work_center: str | None = None
    model_config = ConfigDict(from_attributes=True)


class DepartmentDetailRead(DepartmentListRead):
    present_today: int = 0
    absent_today: int = 0
    shift_a_count: int = 0
    shift_b_count: int = 0
    shift_c_count: int = 0
    machines_running: int = 0
    machines_idle: int = 0
    machines_breakdown: int = 0
    machines_maintenance: int = 0
    todays_target: int = 0
    todays_production: int = 0
    pending_work_orders: int = 0
    completed_work_orders: int = 0
    work_centers: list[DepartmentWorkCenterRead] = Field(default_factory=list)
    employees: list[DepartmentEmployeeRead] = Field(default_factory=list)
    machines: list[DepartmentMachineRead] = Field(default_factory=list)
