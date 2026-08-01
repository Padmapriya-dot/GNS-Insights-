/** Warehouse master demo data and helpers. */

export const WAREHOUSE_STATUSES = ["active", "inactive"];
export const WAREHOUSE_TYPES = [
  "Raw Material",
  "Finished Goods",
  "Work in Progress (WIP)",
  "General",
  "Distribution",
  "Transit",
];
export const BRANCHES = ["Hyderabad", "Chennai", "Pune", "Bengaluru"];
export const PLANTS = ["Plant A — Hyderabad", "Plant B — Chennai", "Plant C — Pune"];

export const WORKFLOW_STEPS = [
  "Purchase",
  "Raw Material Warehouse",
  "Production",
  "Finished Goods Warehouse",
  "Sales",
  "Dispatch",
];

export const TRANSFER_WORKFLOW = [
  "Source Warehouse",
  "Destination Warehouse",
  "Product Selection",
  "Quantity",
  "Approval",
  "Transfer Confirmation",
];

export const GRN_WORKFLOW = [
  "Supplier",
  "Purchase Order",
  "Goods Receipt",
  "Quality Check",
  "Put Away",
  "Inventory Update",
];

export const ISSUE_WORKFLOW = [
  "Production Order",
  "Material Selection",
  "Quantity",
  "Approval",
  "Issue",
  "Stock Update",
];

export const PICK_PACK_WORKFLOW = [
  "Sales Order",
  "Picking",
  "Packing",
  "Dispatch",
  "Delivery",
];

export const INVENTORY_CATEGORIES = [
  "Raw Materials",
  "Finished Goods",
  "Semi-Finished Goods",
  "Packing Materials",
  "Consumables",
  "Spare Parts",
];

export const REPORT_TYPES = [
  "Stock Report",
  "Warehouse Utilization",
  "Inventory Valuation",
  "Stock Aging",
  "Bin-wise Stock",
  "Movement Report",
];

export const IMPORT_TEMPLATE_HEADERS = [
  "code", "name", "branch", "plant", "warehouse_type", "state", "manager_name", "capacity", "status",
];

export const DEMO_WAREHOUSES = [];


export const DEMO_BIN_TREE = [];

export function enrichApiWarehouse(row, index = 0) {
  const used = row.used_capacity ?? 0;
  const cap = row.capacity ?? 0;
  return {
    ...row,
    code: row.code || `WH-${String(index + 1).padStart(2, "0")}`,
    name: row.name || "Unnamed Warehouse",
    branch: row.branch || "—",
    plant: row.plant || "—",
    warehouse_type: row.warehouse_type || "General",
    manager_name: row.manager_name || "—",
    manager_phone: row.manager_phone || "—",
    status: row.status || "active",
    used_capacity: used,
    available_capacity: row.available_capacity ?? (cap ? cap - used : null),
    utilization_pct: row.utilization_pct ?? (cap ? Math.round((used / cap) * 1000) / 10 : null),
    inventory_value: row.inventory_value ?? 0,
    item_count: row.item_count ?? 0,
    low_stock_items: row.low_stock_items ?? 0,
    created_at: row.created_at?.slice?.(0, 10) || new Date().toISOString().slice(0, 10),
  };
}

export function computeWarehouseSummary(warehouses) {
  const active = warehouses.filter((w) => w.status === "active");
  const totalCap = warehouses.reduce((s, w) => s + (w.capacity || 0), 0);
  const totalUsed = warehouses.reduce((s, w) => s + (w.used_capacity || 0), 0);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    total: warehouses.length,
    active: active.length,
    inactive: warehouses.length - active.length,
    primary: warehouses.find((w) => w.is_primary)?.name || active[0]?.name || "—",
    utilizationPct: totalCap ? Math.round((totalUsed / totalCap) * 1000) / 10 : 0,
    inventoryValue: warehouses.reduce((s, w) => s + Number(w.inventory_value || 0), 0),
    lowStockWarehouses: warehouses.filter((w) => {
      const avail = w.available_capacity ?? (w.capacity ? w.capacity - (w.used_capacity || 0) : null);
      return (w.low_stock_items || 0) > 0 || (w.out_of_stock || 0) > 0 || (avail !== null && avail <= 0);
    }).length,

    pendingTransfers: 0,
    newThisMonth: warehouses.filter((w) => new Date(w.created_at) >= monthStart).length,
  };
}

export function formatCr(value) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString("en-IN")}`;
}

