/** Vendor master demo data and helpers. */

export const VENDOR_STATUSES = ["active", "inactive"];
export const VENDOR_TYPES = ["Manufacturer", "Trader", "Importer", "Service Provider", "Contractor"];
export const VENDOR_CATEGORIES = ["Raw Material", "Consumables", "Machinery", "Packaging", "Services"];
export const MATERIAL_TYPES = ["Steel", "Aluminium", "Plastic", "Chemicals", "Electronics", "General"];
export const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Net 60", "Advance", "COD"];
export const INDIAN_STATES = [
  "Andhra Pradesh", "Telangana", "Karnataka", "Maharashtra", "Tamil Nadu",
  "Gujarat", "Delhi", "Uttar Pradesh", "West Bengal", "Rajasthan",
];

export const WORKFLOW_STEPS = [
  "Create Vendor",
  "Purchase Request",
  "RFQ",
  "Quotation",
  "Purchase Order",
  "GRN",
  "Vendor Bill",
  "Payment",
  "Ledger Update",
];

export const REPORT_TYPES = [
  "Vendor Ledger",
  "Outstanding Report",
  "Purchase Summary",
  "Vendor Performance",
  "Payment History",
  "GST Report",
];

export const IMPORT_TEMPLATE_HEADERS = [
  "vendor_code", "name", "contact", "phone", "email", "gstin", "city", "state",
  "payment_terms", "status", "category", "material_type",
];

export const DEMO_VENDORS = [
  {
    id: "ven-101",
    vendor_code: "VEN-001",
    name: "Tata Steel Ltd",
    contact: "Ramesh Kumar",
    phone: "+91 98490 11223",
    email: "supply@tatasteel.com",
    gstin: "36AABCT1234E1ZP",
    city: "Hyderabad",
    state: "Telangana",
    payment_terms: "Net 30",
    status: "active",
    approval_status: "approved",
    category: "Raw Material",
    material_type: "Steel",
    outstanding: 350000,
    rating: 4.8,
    total_purchase_orders: 18,
    pending_orders: 2,
    total_purchase_value: 4500000,
    last_purchase_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString().slice(0, 10),
  },
  {
    id: "ven-102",
    vendor_code: "VEN-002",
    name: "Hindalco Industries Ltd",
    contact: "Sanjay Mehta",
    phone: "+91 98850 44556",
    email: "orders@hindalco.adityabirla.com",
    gstin: "27AABCH5678F1ZQ",
    city: "Mumbai",
    state: "Maharashtra",
    payment_terms: "Net 45",
    status: "active",
    approval_status: "approved",
    category: "Raw Material",
    material_type: "Aluminium",
    outstanding: 180000,
    rating: 4.6,
    total_purchase_orders: 12,
    pending_orders: 1,
    total_purchase_value: 2800000,
    last_purchase_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString().slice(0, 10),
  },
  {
    id: "ven-103",
    vendor_code: "VEN-003",
    name: "Polymer Tech Extrusions Pvt Ltd",
    contact: "Anil Kapoor",
    phone: "+91 94400 77889",
    email: "sales@polymertech.co.in",
    gstin: "29AABCP9012G1ZR",
    city: "Bengaluru",
    state: "Karnataka",
    payment_terms: "Net 15",
    status: "active",
    approval_status: "approved",
    category: "Packaging",
    material_type: "Plastic",
    outstanding: 95000,
    rating: 4.5,
    total_purchase_orders: 8,
    pending_orders: 0,
    total_purchase_value: 1200000,
    last_purchase_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString().slice(0, 10),
  },
];


export function enrichApiVendor(row, index = 0) {
  const code = row.vendor_code || `VEN${String(row.id || index + 1).padStart(3, "0")}`;
  return {
    ...row,
    vendor_code: code,
    name: row.name || "Unnamed Vendor",
    contact: row.contact || row.contact_name || "—",
    status: row.status || "active",
    approval_status: row.approval_status || "approved",
    payment_terms: row.payment_terms || "Net 30",
    city: row.city || "—",
    state: row.state || "—",
    gstin: row.gstin || "—",
    outstanding: row.outstanding ?? 0,
    rating: row.rating ?? 4.0,
    category: row.category || "General",
    material_type: row.material_type || "General",
    total_purchase_orders: row.total_purchase_orders ?? 0,
    pending_orders: row.pending_orders ?? 0,
    total_purchase_value: row.total_purchase_value ?? 0,
    last_purchase_date: row.last_purchase_date || "—",
    created_at: row.created_at?.slice?.(0, 10) || new Date().toISOString().slice(0, 10),
  };
}

export function computeVendorSummary(vendors) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    total: vendors.length,
    active: vendors.filter((v) => v.status === "active").length,
    inactive: vendors.filter((v) => v.status !== "active").length,
    pendingApproval: vendors.filter((v) => v.approval_status === "pending").length,
    outstandingPayables: vendors.reduce((s, v) => s + Number(v.outstanding || 0), 0),
    newThisMonth: vendors.filter((v) => {
      const d = new Date(v.created_at);
      return d >= monthStart;
    }).length,
  };
}

export function starRating(rating) {
  const r = Math.round(Number(rating || 0));
  return "★".repeat(Math.min(5, r)) + "☆".repeat(Math.max(0, 5 - r));
}
