/** Quality demo data and helpers. */

export const QUALITY_FLOW = [
  "Purchase Order", "Incoming Inspection", "Inventory", "Production",
  "In Process QC", "Final QC", "Packing", "Dispatch", "Customer",
];

export const FINAL_QC_FLOW = [
  "Production", "In Process QC", "Final QC", "Packing", "Dispatch",
];

export const DEFECT_WORKFLOW = [
  "New", "Assigned", "In Progress", "Verification", "Resolved", "Closed",
];

export const CAPA_STATUSES = ["open", "assigned", "in_progress", "verification", "resolved", "closed"];

export const DEMO_INCOMING_SUMMARY = {
  todays_inspections: 0,
  pending_inspection: 0,
  passed: 0,
  failed: 0,
  rejected_lots: 0,
  avg_inspection_time: 0,
};

export const DEMO_INCOMING_LIST = [];

export const DEMO_PROCESS_SUMMARY = {
  production_running: 0,
  qc_pending: 0,
  passed: 0,
  failed: 0,
  rework: 0,
  scrap: 0,
};

export const DEMO_PROCESS_LIST = [];

export const DEMO_FINAL_SUMMARY = {
  pending_final: 0,
  passed: 0,
  failed: 0,
  packed: 0,
  ready_dispatch: 0,
};

export const DEMO_FINAL_LIST = [];

export const DEMO_BATCH_SUMMARY = {
  total_batches: 0,
  passed: 0,
  failed: 0,
  yield_pct: 0,
  scrap_pct: 0,
  rework_pct: 0,
};

export const DEMO_BATCH_LIST = [];

export const DEMO_DEFECT_SUMMARY = {
  total_defects: 0,
  open: 0,
  in_progress: 0,
  resolved: 0,
  critical: 0,
  capa_pending: 0,
};

export const DEMO_DEFECT_LIST = [];

export const DEMO_QUALITY_HUB = {
  total_inspections: 0,
  passed: 0,
  failed: 0,
  rejected: 0,
  yield_pct: 0,
  defect_rate: 0,
  pass_vs_fail: [],
  defect_trend: [],
  monthly_yield: [],
  supplier_quality: [],
  machine_defects: [],
  pareto_defects: [],
  root_cause_analysis: [],
  qc_performance: [],
  recent_inspections: [],
  alerts: [],
};

/** Pass=Green, Fail=Red, Pending=Orange */
export function qcStatusColor(s) {
  const m = {
    pass: "bg-green-100 text-green-800",
    passed: "bg-green-100 text-green-800",
    fail: "bg-red-100 text-red-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-orange-100 text-orange-800",
    rework: "bg-amber-100 text-amber-800",
    scrap: "bg-red-200 text-red-900",
    rejected: "bg-red-100 text-red-800",
    approved: "bg-green-100 text-green-800",
    packed: "bg-blue-100 text-blue-800",
    in_progress: "bg-blue-100 text-blue-800",
    open: "bg-orange-100 text-orange-800",
    new: "bg-orange-100 text-orange-800",
    assigned: "bg-indigo-100 text-indigo-800",
    verification: "bg-purple-100 text-purple-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-slate-200 text-slate-700",
  };
  return m[s] || "bg-slate-100 text-slate-700";
}

/** Low=Green, Medium=Orange, High=Red, Critical=Dark Red */
export function severityColor(s) {
  const m = {
    low: "bg-green-100 text-green-800",
    medium: "bg-orange-100 text-orange-800",
    high: "bg-red-100 text-red-800",
    critical: "bg-red-900 text-white",
  };
  return m[s] || "bg-slate-100 text-slate-700";
}

export function formatPct(v) {
  if (v == null) return "—";
  return `${Number(v).toFixed(1)}%`;
}
