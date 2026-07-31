/** BOM master demo data and helpers — UI layer until full bom_headers tables exist. */

export const BOM_STATUSES = ["active", "draft", "inactive", "pending_approval"];
export const BOM_VERSIONS = ["V1.0", "V1.1", "V2.0"];
export const PRODUCT_CATEGORIES = ["Finished Goods", "Semi-Finished", "Assembly", "Sub-Assembly"];

export const DEMO_BOMS = [];


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
