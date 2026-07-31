/** End-to-end manufacturing workflow — role-owned stages.
 * Login roles are only the 6 RBAC roles; department stage labels map onto them.
 */

/** Workflow ownership uses the same names as REGISTERABLE_ROLES. */
export const WORKFLOW_PERSONAS = {
  SALES: "Sales Manager",
  PLANNER: "Production Manager",
  PURCHASE: "Production Manager",
  STORE: "Store Manager",
  QUALITY: "Production Manager",
  SUPERVISOR: "Production Manager",
  OPERATOR: "Operator",
  MAINTENANCE: "Production Manager",
  DISPATCH: "Store Manager",
  FINANCE: "Accountant",
  MANAGEMENT: "Admin",
  CRM: "Sales Manager",
};

/**
 * Map login Role.name → workflow persona(s) they own.
 * Admin sees the full chain.
 */
export const ROLE_TO_WORKFLOW_PERSONAS = {
  Admin: ["*"],
  "Sales Manager": [WORKFLOW_PERSONAS.SALES, WORKFLOW_PERSONAS.CRM],
  "Production Manager": [
    WORKFLOW_PERSONAS.PLANNER,
    WORKFLOW_PERSONAS.PURCHASE,
    WORKFLOW_PERSONAS.QUALITY,
    WORKFLOW_PERSONAS.SUPERVISOR,
    WORKFLOW_PERSONAS.OPERATOR,
    WORKFLOW_PERSONAS.MAINTENANCE,
  ],
  "Store Manager": [WORKFLOW_PERSONAS.STORE, WORKFLOW_PERSONAS.DISPATCH],
  Accountant: [WORKFLOW_PERSONAS.FINANCE],
  Operator: [WORKFLOW_PERSONAS.OPERATOR],
  "HR Manager": [],
};

/** Phase metadata for Role Workflow Board grouping */
export const WORKFLOW_PHASES = [
  { id: 1, label: "Sales", stageIds: ["enquiry", "quotation", "quotation_approval", "quotation_sent", "sales_order"] },
  { id: 2, label: "Production Planning", stageIds: ["production_planning", "bom", "mrp", "capacity", "work_order"] },
  { id: 3, label: "Procurement", stageIds: ["purchase_request", "purchase_order", "grn", "incoming_qc", "raw_material"] },
  { id: 4, label: "Production Execution", stageIds: ["machine_assign", "material_issue", "production", "maintenance"] },
  { id: 5, label: "Quality Control", stageIds: ["in_process_qc", "final_qc"] },
  { id: 6, label: "Warehouse", stageIds: ["batch", "finished_goods"] },
  { id: 7, label: "Packing & Dispatch", stageIds: ["dispatch", "delivery"] },
  { id: 8, label: "Finance", stageIds: ["invoice", "payment", "order_close"] },
  { id: 9, label: "After-Sales", stageIds: ["after_sales", "dashboard"] },
];

export const MANUFACTURING_WORKFLOW_STEPS = [
  {
    id: "enquiry",
    label: "Customer Enquiry",
    path: "/sales/leads",
    responsibleRole: WORKFLOW_PERSONAS.SALES,
    module: "sales",
    phase: 1,
    tasks: ["Receive customer enquiry", "Capture bottle specs / volume"],
  },
  {
    id: "quotation",
    label: "Quotation Prep",
    path: "/sales/quotations",
    responsibleRole: WORKFLOW_PERSONAS.SALES,
    module: "sales",
    phase: 1,
    tasks: ["Prepare quotation", "Price, GST, validity"],
  },
  {
    id: "quotation_approval",
    label: "Quote Internal Approval",
    path: "/sales/quotations",
    responsibleRole: WORKFLOW_PERSONAS.SALES,
    module: "sales",
    phase: 1,
    tasks: ["Submit for approval", "Manager approve / reject"],
  },
  {
    id: "quotation_sent",
    label: "Quote Sent / Confirm",
    path: "/sales/quotations",
    responsibleRole: WORKFLOW_PERSONAS.SALES,
    module: "sales",
    phase: 1,
    tasks: ["Send to customer", "Customer confirmation"],
  },
  {
    id: "sales_order",
    label: "Sales Order",
    path: "/sales/orders",
    responsibleRole: WORKFLOW_PERSONAS.SALES,
    module: "sales",
    phase: 1,
    tasks: ["Create SO", "Approve / Confirm → Planning"],
  },
  {
    id: "production_planning",
    label: "Production Planning",
    path: "/production/planning",
    responsibleRole: WORKFLOW_PERSONAS.PLANNER,
    module: "production",
    phase: 2,
    tasks: ["Receive SO", "Create production plan"],
  },
  {
    id: "bom",
    label: "BOM",
    path: "/masters/bom",
    responsibleRole: WORKFLOW_PERSONAS.PLANNER,
    module: "masters",
    phase: 2,
    tasks: ["Load active BOM", "Verify resin / preform / cap / label"],
  },
  {
    id: "mrp",
    label: "MRP & Shortage",
    path: "/production/mrp",
    responsibleRole: WORKFLOW_PERSONAS.PLANNER,
    module: "production",
    phase: 2,
    tasks: ["Run MRP", "Inventory check", "Shortage analysis"],
  },
  {
    id: "capacity",
    label: "Capacity / Schedule",
    path: "/production/schedule",
    responsibleRole: WORKFLOW_PERSONAS.PLANNER,
    module: "production",
    phase: 2,
    tasks: ["Machine capacity check", "Production schedule"],
  },
  {
    id: "purchase_request",
    label: "Purchase Requisition",
    path: "/procurement/material-requests",
    responsibleRole: WORKFLOW_PERSONAS.PURCHASE,
    module: "procurement",
    phase: 3,
    tasks: ["Review shortages", "Approve PR"],
  },
  {
    id: "purchase_order",
    label: "Purchase Order",
    path: "/procurement/purchase-orders",
    responsibleRole: WORKFLOW_PERSONAS.PURCHASE,
    module: "procurement",
    phase: 3,
    tasks: ["Create PO", "Supplier confirmation"],
  },
  {
    id: "grn",
    label: "GRN",
    path: "/procurement/goods-receipt",
    responsibleRole: WORKFLOW_PERSONAS.STORE,
    module: "procurement",
    phase: 3,
    tasks: ["Material receipt", "Create GRN"],
  },
  {
    id: "incoming_qc",
    label: "Incoming QC",
    path: "/quality/incoming",
    responsibleRole: WORKFLOW_PERSONAS.QUALITY,
    module: "quality",
    phase: 3,
    tasks: ["Incoming material inspection", "Approve / reject"],
  },
  {
    id: "raw_material",
    label: "Inventory Update",
    path: "/inventory/raw-materials",
    responsibleRole: WORKFLOW_PERSONAS.STORE,
    module: "inventory",
    phase: 3,
    tasks: ["Post stock after QC"],
  },
  {
    id: "work_order",
    label: "Work Order",
    path: "/production/work-orders",
    responsibleRole: WORKFLOW_PERSONAS.PLANNER,
    module: "production",
    phase: 2,
    tasks: ["Generate / release work order"],
  },
  {
    id: "machine_assign",
    label: "Assign Machine / Crew",
    path: "/production/tasks",
    responsibleRole: WORKFLOW_PERSONAS.SUPERVISOR,
    module: "production",
    phase: 4,
    tasks: ["Assign machine", "Assign supervisor & operators"],
  },
  {
    id: "material_issue",
    label: "Material Issue",
    path: "/production/work-orders",
    responsibleRole: WORKFLOW_PERSONAS.STORE,
    module: "inventory",
    phase: 4,
    tasks: ["Reserve / issue raw materials"],
  },
  {
    id: "production",
    label: "Production Execution",
    path: "/factory-monitor/live-production",
    responsibleRole: WORKFLOW_PERSONAS.OPERATOR,
    module: "production",
    phase: 4,
    tasks: ["Setup", "Start", "Live tracking", "Downtime", "Complete"],
  },
  {
    id: "in_process_qc",
    label: "In-Process QC",
    path: "/quality/in-process",
    responsibleRole: WORKFLOW_PERSONAS.QUALITY,
    module: "quality",
    phase: 5,
    tasks: ["In-process inspection"],
  },
  {
    id: "final_qc",
    label: "Final QC",
    path: "/quality/final",
    responsibleRole: WORKFLOW_PERSONAS.QUALITY,
    module: "quality",
    phase: 5,
    tasks: ["Final product inspection", "Approve / rework / reject"],
  },
  {
    id: "batch",
    label: "Batch / Lot",
    path: "/production/batches",
    responsibleRole: WORKFLOW_PERSONAS.SUPERVISOR,
    module: "production",
    phase: 6,
    tasks: ["Batch generation", "Lot tracking"],
  },
  {
    id: "finished_goods",
    label: "Finished Goods",
    path: "/inventory/finished-goods",
    responsibleRole: WORKFLOW_PERSONAS.STORE,
    module: "inventory",
    phase: 6,
    tasks: ["Receive FG", "Put-away", "Stock update"],
  },
  {
    id: "maintenance",
    label: "Maintenance",
    path: "/maintenance",
    responsibleRole: WORKFLOW_PERSONAS.MAINTENANCE,
    module: "maintenance",
    phase: 4,
    tasks: ["Preventive / breakdown support"],
  },
  {
    id: "dispatch",
    label: "Packing & Dispatch",
    path: "/sales/dispatch",
    responsibleRole: WORKFLOW_PERSONAS.DISPATCH,
    module: "sales",
    phase: 7,
    tasks: ["Pack", "Vehicle", "Challan", "Dispatch"],
  },
  {
    id: "delivery",
    label: "Delivery Confirm",
    path: "/sales/dispatch",
    responsibleRole: WORKFLOW_PERSONAS.DISPATCH,
    module: "sales",
    phase: 7,
    tasks: ["Shipment tracking", "Delivery confirmation"],
  },
  {
    id: "invoice",
    label: "GST Invoice",
    path: "/sales/invoices",
    responsibleRole: WORKFLOW_PERSONAS.FINANCE,
    module: "accounts",
    phase: 8,
    tasks: ["Tax invoice", "Accounts receivable"],
  },
  {
    id: "payment",
    label: "Payment",
    path: "/sales/payments",
    responsibleRole: WORKFLOW_PERSONAS.FINANCE,
    module: "accounts",
    phase: 8,
    tasks: ["Collect payment", "Reconcile"],
  },
  {
    id: "order_close",
    label: "Order Closure",
    path: "/sales/orders",
    responsibleRole: WORKFLOW_PERSONAS.FINANCE,
    module: "accounts",
    phase: 8,
    tasks: ["Close invoice", "Close sales order"],
  },
  {
    id: "after_sales",
    label: "After-Sales",
    path: "/quality/defects",
    responsibleRole: WORKFLOW_PERSONAS.CRM,
    module: "sales",
    phase: 9,
    tasks: ["Feedback", "Complaint / return", "Satisfaction"],
  },
  {
    id: "dashboard",
    label: "Management KPIs",
    path: "/analytics/executive",
    responsibleRole: WORKFLOW_PERSONAS.MANAGEMENT,
    module: "analytics",
    phase: 9,
    tasks: ["Live dashboards", "Department KPIs"],
  },
];

const STEP_ALIASES = {
  quality: "final_qc",
  schedule: "capacity",
  packing: "dispatch",
};

export function getPrimaryRoleName(user) {
  if (!user) return null;
  if (user.role) return user.role;
  if (Array.isArray(user.roles) && user.roles.length) {
    const first = user.roles[0];
    return typeof first === "string" ? first : first?.name;
  }
  return user.role_name || null;
}

export function getWorkflowPersonasForRole(roleName) {
  if (!roleName) return [];
  if (ROLE_TO_WORKFLOW_PERSONAS[roleName]) {
    return ROLE_TO_WORKFLOW_PERSONAS[roleName];
  }
  const key = Object.keys(ROLE_TO_WORKFLOW_PERSONAS).find(
    (k) => k.toLowerCase() === String(roleName).toLowerCase()
  );
  return key ? ROLE_TO_WORKFLOW_PERSONAS[key] : [];
}

export function canViewFullWorkflow(roleName) {
  const personas = getWorkflowPersonasForRole(roleName);
  return personas.includes("*");
}

export function getStepsForRole(roleName) {
  if (canViewFullWorkflow(roleName)) {
    return MANUFACTURING_WORKFLOW_STEPS.map((s) => ({ ...s }));
  }
  const personas = new Set(getWorkflowPersonasForRole(roleName));
  if (!personas.size) return [];
  return MANUFACTURING_WORKFLOW_STEPS.filter((s) => personas.has(s.responsibleRole)).map((s) => ({
    ...s,
  }));
}

export function getWorkflowStepIndex(currentStepId) {
  const id = STEP_ALIASES[currentStepId] || currentStepId;
  const idx = MANUFACTURING_WORKFLOW_STEPS.findIndex((s) => s.id === id);
  return idx >= 0 ? idx : 0;
}

export function buildWorkflowProgress(currentStepId, options = {}) {
  const { roleName = null, filterByRole = false } = options;
  const source =
    filterByRole && roleName && !canViewFullWorkflow(roleName)
      ? getStepsForRole(roleName)
      : MANUFACTURING_WORKFLOW_STEPS;

  const fullIdx = getWorkflowStepIndex(currentStepId);
  const currentId = MANUFACTURING_WORKFLOW_STEPS[fullIdx]?.id;

  return source.map((step) => {
    const stepFullIdx = MANUFACTURING_WORKFLOW_STEPS.findIndex((s) => s.id === step.id);
    let state = "pending";
    if (step.id === currentId) state = "current";
    else if (stepFullIdx < fullIdx) state = "completed";
    return { ...step, state };
  });
}
