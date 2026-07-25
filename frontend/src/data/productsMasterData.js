/** Extended product master fields — merged with API catalog rows in the UI. */

export const PRODUCT_CATEGORIES = [
  "Raw Material",
  "WIP",
  "Finished Goods",
  "Consumables",
  "Spare Parts",
];

export const PRODUCT_TYPES = ["Raw Material", "Semi-Finished", "Finished Goods", "Service"];

export const PRODUCT_STATUSES = ["active", "inactive"];

export const WAREHOUSES = ["Main Store", "Production Store", "FG Store", "QC Store"];

export const BRANDS = ["Tata Steel", "Bosch", "Siemens", "Local", "Generic"];

export const PRODUCT_UNITS = [
  "Nos",
  "Pcs",
  "Kgs",
  "Gms",
  "Mtr",
  "Ltr",
  "Box",
  "Pack",
  "Set",
  "Pair",
  "Doz",
  "Ton",
  "Mg",
  "Lbs",
  "Ml",
  "Gal",
  "Barrel",
  "Mm",
  "Cm",
  "In",
  "Ft",
  "Yd",
  "Sq Mtr",
  "Sq Ft",
  "Bag",
  "Roll",
  "Bundle",
  "Drum",
  "Carton",
  "Pallet",
  "Can",
  "Bottle",
  "Sheet",
];

export const DEMO_PRODUCTS = [];

export function guessCategory(sku = "", name = "") {
  const s = `${sku} ${name}`.toLowerCase();
  if (s.includes("part") || s.includes("stl") || s.includes("raw")) return "Raw Material";
  if (s.includes("widget") || s.includes("motor") || s.includes("valve")) return "Finished Goods";
  if (s.includes("lub") || s.includes("oil")) return "Consumables";
  return "Finished Goods";
}

export function enrichApiProduct(apiRow, index = 0) {
  const code = apiRow.product_code || apiRow.sku || `PRD${String(apiRow.id || index + 1).padStart(3, "0")}`;
  const category = apiRow.category || guessCategory(apiRow.sku, apiRow.name);
  const stock = apiRow.current_stock != null && apiRow.current_stock !== "" ? Number(apiRow.current_stock) : (apiRow.stock != null ? Number(apiRow.stock) : 0);
  const minStock = apiRow.min_stock != null && apiRow.min_stock !== "" ? Number(apiRow.min_stock) : 0;
  const maxStock = apiRow.max_stock != null && apiRow.max_stock !== "" ? Number(apiRow.max_stock) : 1000;
  const purchasePrice = apiRow.purchase_price != null && apiRow.purchase_price !== "" ? Number(apiRow.purchase_price) : (apiRow.unit_cost != null ? Number(apiRow.unit_cost) : 0);
  const sellingPrice = apiRow.selling_price != null && apiRow.selling_price !== "" ? Number(apiRow.selling_price) : (apiRow.unit_price != null ? Number(apiRow.unit_price) : 0);

  return {
    id: apiRow.id || code,
    product_code: code,
    name: apiRow.name || apiRow.product_name || "Product",
    category,
    product_type: apiRow.product_type || (category === "Raw Material" ? "Raw Material" : "Finished Goods"),
    sku: apiRow.sku || code,
    barcode: apiRow.barcode || `890${String(apiRow.id || index + 1).padStart(10, "0")}`,
    brand: apiRow.brand || BRANDS[index % BRANDS.length],
    unit: apiRow.unit || (category === "Raw Material" ? "KG" : "Nos"),
    hsn_code: apiRow.hsn_code || "—",
    gst_percent: apiRow.gst_percent != null ? Number(apiRow.gst_percent) : 18,
    purchase_price: purchasePrice,
    selling_price: sellingPrice,
    min_stock: minStock,
    max_stock: maxStock,
    current_stock: stock,
    warehouse: apiRow.warehouse || WAREHOUSES[index % WAREHOUSES.length],
    description: apiRow.description || "",
    status: apiRow.status || "active",
    bom: apiRow.bom || `BOM-${apiRow.sku || code}`,
    production_time: apiRow.production_time || (category === "Raw Material" ? "—" : "2 hrs"),
    machine_required: apiRow.machine_required || (category === "Raw Material" ? "—" : "CNC-01"),
    quality_standard: apiRow.quality_standard || "ISO 9001",
    batch_tracking: apiRow.batch_tracking != null ? apiRow.batch_tracking : category !== "Raw Material",
    serial_number: Boolean(apiRow.serial_number),
    expiry_date: apiRow.expiry_date || null,
    units_sold: apiRow.units_sold != null ? Number(apiRow.units_sold) : 0,
    stock_value: stock * sellingPrice,
    created_at: apiRow.created_at || new Date().toISOString().slice(0, 10),
  };
}

export function computeSummary(products) {
  const categories = new Set(products.map((p) => p.category));
  return {
    total: products.length,
    active: products.filter((p) => p.status === "active").length,
    inactive: products.filter((p) => p.status === "inactive").length,
    lowStock: products.filter((p) => p.current_stock > 0 && p.current_stock <= p.min_stock).length,
    outOfStock: products.filter((p) => p.current_stock === 0).length,
    categories: categories.size,
  };
}

export function computeQuickStats(products) {
  if (!products.length) {
    return {
      mostSold: "—",
      highestStock: "—",
      lowestStock: "—",
      recentlyAdded: "—",
      pendingApproval: 0,
    };
  }
  const mostSold = [...products].sort((a, b) => (b.units_sold || 0) - (a.units_sold || 0))[0];
  const highest = [...products].sort((a, b) => b.current_stock - a.current_stock)[0];
  const lowest = [...products].filter((p) => p.current_stock > 0).sort((a, b) => a.current_stock - b.current_stock)[0];
  const recent = [...products].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))[0];
  return {
    mostSold: mostSold?.name || "—",
    highestStock: highest ? `${highest.name} (${highest.current_stock})` : "—",
    lowestStock: lowest ? `${lowest.name} (${lowest.current_stock})` : "—",
    recentlyAdded: recent?.name || "—",
    pendingApproval: products.filter((p) => p.status === "inactive").length,
  };
}

export const categoryChartData = [
  { name: "Raw Material", value: 35, color: "#3B82F6" },
  { name: "Finished Goods", value: 28, color: "#22C55E" },
  { name: "WIP", value: 12, color: "#F97316" },
  { name: "Consumables", value: 15, color: "#A855F7" },
  { name: "Spare Parts", value: 10, color: "#64748B" },
];

export const IMPORT_TEMPLATE_HEADERS = [
  "product_code",
  "name",
  "category",
  "sku",
  "unit",
  "purchase_price",
  "selling_price",
  "min_stock",
  "max_stock",
  "warehouse",
  "status",
];
