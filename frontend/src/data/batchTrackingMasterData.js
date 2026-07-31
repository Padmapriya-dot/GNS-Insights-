/** Batch tracking demo data. */

export const DEMO_BATCH_SUMMARY = {
  total_batches: 0,
  running: 0,
  completed: 0,
  hold: 0,
  rejected: 0,
  expired: 0,
};

export const DEMO_BATCHES = [];

export const BATCH_TRACE_STEPS = [
  "Raw Material", "BOM", "Production", "QC", "Packing", "Dispatch", "Customer",
];

export const DEMO_BATCH_DETAIL = {
  id: "demo-b1",
  batch_code: "BATCH-2026-001",
  product_name: "Chair",
  customer_name: "Tata Motors",
  production_order_number: "PO-2026-1001",
  work_order_number: "WO-1001",
  machine_name: "CNC-01",
  operator_name: "Ravi Kumar",
  shift: "Morning",
  material_lot: "RM-LOT-2026-441",
  qc_status: "pending",
  dispatch_status: "pending",
  invoice_number: null,
  quantity: 0,
  good_qty: 0,
  scrap_qty: 0,
  status: "running",
  traceability: [],
};

export const BATCH_STATUS_COLORS = {
  running: "bg-green-100 text-green-800",
  in_process: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  hold: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-slate-200 text-slate-700",
};

export function batchStatusColor(status) {
  return BATCH_STATUS_COLORS[status] || "bg-slate-100 text-slate-700";
}
