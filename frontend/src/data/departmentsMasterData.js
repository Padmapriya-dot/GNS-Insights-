/** Department master demo data and helpers. */

export const DEPARTMENT_STATUSES = ["active", "inactive"];
export const DEPARTMENT_TYPES = [
  { value: "production", label: "Production" },
  { value: "support", label: "Support" },
  { value: "admin", label: "Administration" },
];
export const PLANTS = ["Plant 1", "Plant 2", "Head Office"];
export const BRANCHES = ["Hyderabad", "Bengaluru", "Mumbai", "Chennai"];

export const RECOMMENDED_DEPARTMENTS = [
  "Production",
  "Quality Control",
  "Stores",
  "Purchase",
  "Sales",
  "Maintenance",
  "Engineering",
  "Packing",
  "Dispatch",
  "Accounts",
  "HR",
  "Administration",
  "IT",
];

export const WORKFLOW_STEPS = [
  "Company",
  "Department",
  "Work Center",
  "Machine",
  "Employee",
  "Production",
  "Quality",
  "Finished Goods",
];

export const REPORT_TYPES = [
  "Department Performance",
  "Employee Report",
  "Machine Utilization",
  "Production Report",
  "Attendance Report",
];

export const IMPORT_TEMPLATE_HEADERS = [
  "code", "name", "department_type", "plant", "branch", "manager_name",
  "manager_mobile", "manager_email", "status",
];

export const DEMO_DEPARTMENTS = [];


export function enrichApiDepartment(row, index = 0) {
  const code = row.code || `DEP${String(row.id || index + 1).padStart(3, "0")}`;
  return {
    ...row,
    code,
    name: row.name || "Unnamed Department",
    department_type: row.department_type || "production",
    plant: row.plant || "Plant 1",
    branch: row.branch || "Hyderabad",
    status: row.status || "active",
    manager_name: row.manager_name || "—",
    manager_mobile: row.manager_mobile || "—",
    manager_email: row.manager_email || "—",
    manager_designation: row.manager_designation || "Manager",
    employee_count: row.employee_count ?? 0,
    machine_count: row.machine_count ?? 0,
    work_center_count: row.work_center_count ?? 0,
    present_today: row.present_today ?? 0,
    absent_today: row.absent_today ?? 0,
    todays_target: row.todays_target ?? 0,
    todays_production: row.todays_production ?? 0,
    pending_work_orders: row.pending_work_orders ?? 0,
    completed_work_orders: row.completed_work_orders ?? 0,
    work_centers: row.work_centers || [],
    documents: row.documents || [],
    audit_logs: row.audit_logs || [],
  };
}

export function computeDepartmentSummary(departments) {
  const active = departments.filter((d) => d.status === "active").length;
  const production = departments.filter(
    (d) => d.department_type === "production" && d.status === "active"
  ).length;
  const support = departments.filter(
    (d) => d.department_type === "support" && d.status === "active"
  ).length;
  const totalEmployees = departments.reduce((s, d) => s + (d.employee_count || 0), 0);
  const totalMachines = departments.reduce((s, d) => s + (d.machine_count || 0), 0);
  return {
    total_departments: departments.length,
    active_departments: active,
    production_departments: production,
    support_departments: support,
    total_employees: totalEmployees,
    total_machines: totalMachines,
  };
}

export function departmentTypeLabel(type) {
  const match = DEPARTMENT_TYPES.find((t) => t.value === type);
  return match?.label || type;
}
