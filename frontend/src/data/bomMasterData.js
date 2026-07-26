/** BOM master demo data and helpers — UI layer until full bom_headers tables exist. */

export const BOM_STATUSES = ["active", "draft", "inactive", "pending_approval"];
export const BOM_VERSIONS = ["V1.0", "V1.1", "V2.0"];
export const PRODUCT_CATEGORIES = ["Finished Goods", "Semi-Finished", "Assembly", "Sub-Assembly"];

const OFFICE_CHAIR_COMPONENTS = [
  { id: 1, component: "Steel Pipe", item_code: "RM001", category: "Raw Material", unit: "KG", qty: 5, unit_cost: 120, total_cost: 600 },
  { id: 2, component: "Paint", item_code: "RM002", category: "Chemical", unit: "Ltr", qty: 0.5, unit_cost: 250, total_cost: 125 },
  { id: 3, component: "Bolt", item_code: "RM003", category: "Hardware", unit: "Nos", qty: 20, unit_cost: 5, total_cost: 100 },
  { id: 4, component: "Foam Cushion", item_code: "RM004", category: "Raw Material", unit: "Nos", qty: 1, unit_cost: 350, total_cost: 350 },
  { id: 5, component: "Fabric Cover", item_code: "RM005", category: "Raw Material", unit: "Nos", qty: 1, unit_cost: 280, total_cost: 280 },
  { id: 6, component: "Wheel Castor", item_code: "RM006", category: "Hardware", unit: "Nos", qty: 5, unit_cost: 45, total_cost: 225 },
  { id: 7, component: "Gas Lift", item_code: "RM007", category: "Hardware", unit: "Nos", qty: 1, unit_cost: 420, total_cost: 420 },
  { id: 8, component: "Base Plate", item_code: "RM008", category: "Raw Material", unit: "Nos", qty: 1, unit_cost: 180, total_cost: 180 },
  { id: 9, component: "Arm Rest", item_code: "RM009", category: "Semi-Finished", unit: "Nos", qty: 2, unit_cost: 95, total_cost: 190 },
  { id: 10, component: "Label Sticker", item_code: "RM010", category: "Consumables", unit: "Nos", qty: 1, unit_cost: 5, total_cost: 5 },
  { id: 11, component: "Packaging Box", item_code: "RM011", category: "Packaging", unit: "Nos", qty: 1, unit_cost: 60, total_cost: 60 },
  { id: 12, component: "User Manual", item_code: "RM012", category: "Consumables", unit: "Nos", qty: 1, unit_cost: 15, total_cost: 15 },
];

export const DEMO_BOMS = [
  {
    id: "bom-101",
    bom_code: "BOM-OFF-CHAIR-01",
    bom_number: "BOM-OFF-CHAIR-01",
    product: "Executive Ergonomic Office Chair",
    product_name: "Executive Ergonomic Office Chair",
    category: "Finished Goods",
    version: "V1.0",
    status: "active",
    warehouse: "Main Warehouse",
    created_by: "Store Manager",
    total_cost: 2550,
    created_at: new Date().toISOString().slice(0, 10),
    items: OFFICE_CHAIR_COMPONENTS,
  },
  {
    id: "bom-102",
    bom_code: "BOM-IND-TABLE-01",
    bom_number: "BOM-IND-TABLE-01",
    product: "Heavy Duty Industrial Workstation Table",
    product_name: "Heavy Duty Industrial Workstation Table",
    category: "Assembly",
    version: "V1.1",
    status: "active",
    warehouse: "Plant-1 Store",
    created_by: "Production Lead",
    total_cost: 4800,
    created_at: new Date().toISOString().slice(0, 10),
    items: OFFICE_CHAIR_COMPONENTS.slice(0, 6),
  },
  {
    id: "bom-103",
    bom_code: "BOM-ST-CABINET-01",
    bom_number: "BOM-ST-CABINET-01",
    product: "Modular Steel Storage Cabinet 4-Door",
    product_name: "Modular Steel Storage Cabinet 4-Door",
    category: "Finished Goods",
    version: "V2.0",
    status: "active",
    warehouse: "Main Warehouse",
    created_by: "Store Manager",
    total_cost: 6200,
    created_at: new Date().toISOString().slice(0, 10),
    items: OFFICE_CHAIR_COMPONENTS.slice(2, 9),
  },
];


export function computeBomSummary(boms, totalProducts = 0) {
  const productsWithBom = new Set(boms.map((b) => b.product_name || b.product).filter(Boolean)).size;
  return {
    total: boms.length,
    active: boms.filter((b) => b.status === "active").length,
    draft: boms.filter((b) => b.status === "draft").length,
    inactive: boms.filter((b) => b.status === "inactive").length,
    withoutBom: Math.max(0, totalProducts - productsWithBom),
    pendingApproval: boms.filter((b) => b.status === "pending_approval" || (b.status === "draft" && b.approval_workflow?.some((s) => s.step === "Submitted" && s.status === "pending"))).length,
  };
}

export function groupApiBomRows(rows) {
  const groups = {};
  for (const row of rows) {
    const key = row.product_sku || row.product || row.product_name || String(row.product_id);
    if (!groups[key]) {
      groups[key] = {
        product: row.product || row.product_name,
        product_sku: row.product_sku || key,
        components: [],
      };
    }
    groups[key].components.push({
      id: row.id,
      component: row.component || row.component_name,
      item_code: row.component_sku,
      category: "Raw Material",
      unit: row.unit,
      qty: row.quantity,
      unit_cost: row.unit_cost || 0,
      total_cost: row.total_cost || 0,
    });
  }
  return Object.entries(groups).map(([sku, g], i) => {
    const materialCost = g.components.reduce((s, c) => s + (c.total_cost || 0), 0);
    return {
      id: `api-${i}`,
      bom_number: `BOM${String(i + 10).padStart(3, "0")}`,
      product_name: g.product,
      product_code: sku,
      version: "V1.0",
      revision: "R0",
      description: `BOM for ${g.product}`,
      status: "active",
      category: "Finished Goods",
      warehouse: "Main Store",
      effective_date: new Date().toISOString().slice(0, 10),
      expiry_date: null,
      created_by: "System",
      approved_by: "—",
      created_date: new Date().toISOString().slice(0, 10),
      last_updated: "Recently",
      components: g.components,
      costing: {
        material_cost: materialCost,
        labour_cost: Math.round(materialCost * 0.2),
        machine_cost: Math.round(materialCost * 0.1),
        electricity_cost: Math.round(materialCost * 0.05),
        overhead_cost: Math.round(materialCost * 0.08),
        total_cost: Math.round(materialCost * 1.43),
      },
      routing: [],
      machines: [],
      inventory_availability: g.components.map((c) => ({
        component: c.component,
        required: `${c.qty} ${c.unit}`,
        available: "—",
        status: "available",
      })),
      documents: [],
      version_history: [{ version: "V1.0", date: new Date().toISOString().slice(0, 10), changes: "Imported from API", author: "System" }],
      approval_workflow: [
        { step: "Created", status: "completed", date: new Date().toISOString().slice(0, 10), user: "System" },
        { step: "Approved", status: "completed", date: new Date().toISOString().slice(0, 10), user: "—" },
        { step: "Production", status: "active", date: new Date().toISOString().slice(0, 10), user: "—" },
      ],
      audit: { created_by: "System", modified_by: "—", approved_by: "—", modified_date: new Date().toISOString().slice(0, 10), remarks: "Auto-generated from BOM lines." },
    };
  });
}

export const IMPORT_TEMPLATE_HEADERS = [
  "bom_number",
  "product_name",
  "product_code",
  "version",
  "component",
  "item_code",
  "qty",
  "unit",
  "unit_cost",
];

export const REPORT_TYPES = [
  "BOM Cost Report",
  "Material Requirement Report",
  "BOM Comparison",
  "Revision History",
  "Component Usage Report",
];
