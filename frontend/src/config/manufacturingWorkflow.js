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

/**
 * Map a page/context key to the current step index in the manufacturing spine.
 * @param {string} currentStepId
 */
export function getWorkflowStepIndex(currentStepId) {
  const idx = MANUFACTURING_WORKFLOW_STEPS.findIndex((s) => s.id === currentStepId);
  return idx >= 0 ? idx : 0;
}

/**
 * Build step statuses relative to the current step.
 * @returns {{ id: string, label: string, path: string, state: 'completed'|'current'|'pending' }[]}
 */
export function buildWorkflowProgress(currentStepId) {
  const current = getWorkflowStepIndex(currentStepId);
  return MANUFACTURING_WORKFLOW_STEPS.map((step, i) => ({
    ...step,
    state: i < current ? "completed" : i === current ? "current" : "pending",
  }));
}
