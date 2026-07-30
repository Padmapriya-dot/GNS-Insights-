/** End-to-end manufacturing workflow steps for GNS Insights. */

export const MANUFACTURING_WORKFLOW_STEPS = [
  { id: "sales_order", label: "Sales Order", path: "/sales/orders" },
  { id: "production_planning", label: "Production Planning", path: "/production/planning" },
  { id: "bom", label: "Bill of Materials (BOM)", path: "/masters/bom" },
  { id: "mrp", label: "Material Requirements Planning (MRP)", path: "/production/mrp" },
  { id: "purchase_request", label: "Purchase Request", path: "/procurement/material-requests" },
  { id: "purchase_order", label: "Purchase Order", path: "/procurement/purchase-orders" },
  { id: "grn", label: "Goods Receipt Note (GRN)", path: "/procurement/goods-receipt" },
  { id: "raw_material", label: "Raw Material", path: "/inventory/raw-materials" },
  { id: "schedule", label: "Schedule", path: "/production/schedule" },
  { id: "work_order", label: "Work Order", path: "/production/work-orders" },
  { id: "machine_assign", label: "Machine Assign", path: "/production/tasks" },
  { id: "material_issue", label: "Material Issue", path: "/production/work-orders" },
  { id: "production", label: "Production", path: "/factory-monitor/live-production" },
  { id: "quality", label: "Quality", path: "/quality/final" },
  { id: "finished_goods", label: "Finished Goods", path: "/inventory/finished-goods" },
  { id: "dispatch", label: "Dispatch", path: "/sales/dispatch" },
  { id: "invoice", label: "Invoice", path: "/sales/invoices" },
  { id: "payment", label: "Payment", path: "/sales/payments" },
  { id: "dashboard", label: "Dashboard", path: "/" },
];

/** Nine high-level phases (Enquiry → Closure) displayed in the workflow legend. */
export const WORKFLOW_PHASES = [
  { id: 1, label: "Enquiry & Order" },
  { id: 2, label: "Planning" },
  { id: 3, label: "Procurement" },
  { id: 4, label: "Inventory" },
  { id: 5, label: "Scheduling" },
  { id: 6, label: "Production" },
  { id: 7, label: "Quality" },
  { id: 8, label: "Dispatch & Invoicing" },
  { id: 9, label: "Closure & Payment" },
];

/** Roles that are allowed to view the full manufacturing workflow chain. */
const FULL_ACCESS_ROLES = ["admin", "management", "manager", "superadmin", "super_admin", "super_user"];

/**
 * Extract the primary role name string from a user object.
 * Handles both `user.role` (string) and `user.roles` (array) shapes.
 * Also accepts a plain role string directly.
 * @param {object|string|null} user
 * @returns {string}
 */
export function getPrimaryRoleName(user) {
  if (!user) return "";
  if (typeof user === "string") return user;
  if (typeof user.role === "string") return user.role;
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const first = user.roles[0];
    return typeof first === "string" ? first : first?.name ?? "";
  }
  return "";
}

/**
 * Returns true when the given role should see the full manufacturing workflow
 * (admin / management) rather than only their department stages.
 * @param {string} roleName
 * @returns {boolean}
 */
export function canViewFullWorkflow(roleName) {
  if (!roleName) return false;
  return FULL_ACCESS_ROLES.includes(roleName.toLowerCase());
}

/**
 * Map a page/context key to the current step index in the manufacturing spine.
 * @param {string} currentStepId
 * @returns {number}
 */
export function getWorkflowStepIndex(currentStepId) {
  const idx = MANUFACTURING_WORKFLOW_STEPS.findIndex((s) => s.id === currentStepId);
  return idx >= 0 ? idx : 0;
}

/**
 * Build step statuses relative to the current step.
 * @param {string} currentStepId
 * @param {{ roleName?: string, filterByRole?: boolean }} [options]
 * @returns {{ id: string, label: string, path: string, state: 'completed'|'current'|'pending' }[]}
 */
export function buildWorkflowProgress(currentStepId, options = {}) {
  const { filterByRole = false } = options;
  const current = getWorkflowStepIndex(currentStepId);
  const steps = MANUFACTURING_WORKFLOW_STEPS.map((step, i) => ({
    ...step,
    state: i < current ? "completed" : i === current ? "current" : "pending",
  }));

  // When filterByRole is true, show a focused window around the current step.
  // Full role-based filtering is handled by the backend via getManufacturingWorkflowBoard.
  if (filterByRole) {
    return steps.filter(
      (_, i) => i >= Math.max(0, current - 2) && i <= Math.min(steps.length - 1, current + 2)
    );
  }

  return steps;
}
