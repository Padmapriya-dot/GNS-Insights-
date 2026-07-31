/** Customer master demo data and helpers. */

import { INDIAN_STATES as INDIA_STATES_FULL } from "./indiaLocations";

export const CUSTOMER_STATUSES = ["active", "inactive"];
export const CUSTOMER_TYPES = ["Corporate", "Retail", "Distributor", "OEM", "Government"];
/** All 28 States + 8 Union Territories (official names, A–Z). */
export const INDIAN_STATES = INDIA_STATES_FULL;
export const SALES_EXECUTIVES = ["Ravi Kumar", "Anita Sharma", "Suresh Reddy", "Priya Nair"];

export const DEMO_CUSTOMERS = [
  {
    id: "cus-101",
    customer_code: "CUS-001",
    company: "Apex Precision Engineering Ltd",
    name: "Apex Precision Engineering Ltd",
    contact_person: "Vikram Malhotra",
    phone: "+91 98490 12345",
    email: "procurement@apexprecision.com",
    gstin: "36AABCA1234F1ZP",
    city: "Hyderabad",
    state: "Telangana",
    district: "Hyderabad",
    pincode: "500032",
    country: "India",
    status: "active",
    customer_type: "OEM",
    industry: "Manufacturing",
    pan: "AABCA1234F",
    billing_address: "Plot 42, IDA Nacharam, Hyderabad, Telangana",
    shipping_address: "Plot 42, IDA Nacharam, Hyderabad, Telangana",
    credit_limit: 2500000,
    payment_terms: "Net 30",
    outstanding: 450000,
    opening_balance: 0,
    currency: "INR",
    sales_executive: "Ravi Kumar",
    price_list: "Standard",
    discount_percent: 5,
    pending_payments: 1,
  },
  {
    id: "cus-102",
    customer_code: "CUS-002",
    company: "Bharath Heavy Components Pvt Ltd",
    name: "Bharath Heavy Components Pvt Ltd",
    contact_person: "Sangeetha Rao",
    phone: "+91 98850 67890",
    email: "orders@bharathcomponents.co.in",
    gstin: "29AABCB5678G1ZQ",
    city: "Bengaluru",
    state: "Karnataka",
    district: "Bengaluru",
    pincode: "560058",
    country: "India",
    status: "active",
    customer_type: "Corporate",
    industry: "Automotive",
    pan: "AABCB5678G",
    billing_address: "Peenya Industrial Area 2nd Stage, Bengaluru",
    shipping_address: "Peenya Industrial Area 2nd Stage, Bengaluru",
    credit_limit: 1500000,
    payment_terms: "Net 45",
    outstanding: 280000,
    opening_balance: 0,
    currency: "INR",
    sales_executive: "Anita Sharma",
    price_list: "Corporate",
    discount_percent: 8,
    pending_payments: 0,
  },
  {
    id: "cus-103",
    customer_code: "CUS-003",
    company: "Deccan Steel & Alloys Corp",
    name: "Deccan Steel & Alloys Corp",
    contact_person: "Rajesh Varma",
    phone: "+91 94400 43210",
    email: "sales@deccansteel.com",
    gstin: "27AABCD9012H1ZR",
    city: "Pune",
    state: "Maharashtra",
    district: "Pune",
    pincode: "411026",
    country: "India",
    status: "active",
    customer_type: "Distributor",
    industry: "Industrial Supplies",
    pan: "AABCD9012H",
    billing_address: "MIDC Bhosari Industrial Zone, Pune",
    shipping_address: "MIDC Bhosari Industrial Zone, Pune",
    credit_limit: 3000000,
    payment_terms: "Net 15",
    outstanding: 620000,
    opening_balance: 0,
    currency: "INR",
    sales_executive: "Suresh Reddy",
    price_list: "Wholesale",
    discount_percent: 10,
    pending_payments: 2,
  },
];


export function enrichApiCustomer(row, index = 0) {
  const code = row.customer_code || `CUS${String(row.id || index + 1).padStart(3, "0")}`;
  const companyName = row.company || row.name || row.customer_name || "Customer";
  const city = row.city || row.district || ["Hyderabad", "Pune", "Chennai", "Mumbai", "Bengaluru"][index % 5];
  
  return {
    id: row.id || code,
    customer_code: code,
    company: companyName,
    name: companyName,
    contact_person: row.contact_person || row.contact_name || "—",
    phone: row.phone || "—",
    email: row.email || "—",
    gstin: row.gstin || "—",
    city: city,
    state: row.state || INDIAN_STATES[index % INDIAN_STATES.length],
    district: row.district || city,
    pincode: row.pincode || "500001",
    country: row.country || "India",
    status: row.status || "active",
    customer_type: row.customer_type || CUSTOMER_TYPES[index % CUSTOMER_TYPES.length],
    industry: row.industry || "Manufacturing",
    pan: row.pan || (row.gstin && row.gstin.length >= 12 ? row.gstin.slice(2, 12) : "—"),
    website: row.website || null,
    alternate_phone: row.alternate_phone || null,
    designation: row.designation || "Contact",
    billing_address: row.billing_address || row.address_line1 || "—",
    shipping_address: row.shipping_address || row.address_line1 || "—",
    credit_limit: row.credit_limit != null && row.credit_limit !== "" ? Number(row.credit_limit) : (1000000 + index * 200000),
    payment_terms: row.payment_terms || "Net 30",
    outstanding: row.outstanding != null && row.outstanding !== "" ? Number(row.outstanding) : 0,
    opening_balance: row.opening_balance != null ? Number(row.opening_balance) : 0,
    currency: row.currency || "INR",
    tan: row.tan || null,
    msme: row.msme || null,
    sales_executive: row.sales_executive || SALES_EXECUTIVES[index % SALES_EXECUTIVES.length],
    price_list: row.price_list || "Standard",
    discount_percent: row.discount_percent != null ? Number(row.discount_percent) : 5,
    sales_territory: row.sales_territory || row.state || "India",
    pending_payments: row.pending_payments != null ? row.pending_payments : 0,
    total_orders: row.total_orders != null ? row.total_orders : 0,
    total_sales: row.total_sales != null ? row.total_sales : 0,
    pending_orders: row.pending_orders != null ? row.pending_orders : 0,
    last_order: row.last_order || "—",
    last_payment: row.last_payment || "—",
    created_at: row.created_at || new Date().toISOString().slice(0, 10),
    documents: row.documents || [],
  };
}

export function computeCustomerSummary(customers) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const newThisMonth = customers.filter((c) => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  return {
    total: customers.length,
    active: customers.filter((c) => c.status === "active").length,
    inactive: customers.filter((c) => c.status === "inactive").length,
    newThisMonth,
    pendingPayments: customers.reduce((s, c) => s + (c.pending_payments || 0), 0),
    outstandingAmount: customers.reduce((s, c) => s + (c.outstanding || 0), 0),
  };
}

export const REPORT_TYPES = [
  "Customer Ledger",
  "Customer Aging Report",
  "Outstanding Report",
  "Sales Report",
  "Payment Report",
];

export const IMPORT_TEMPLATE_HEADERS = [
  "customer_code", "company", "contact_person", "phone", "email",
  "gstin", "city", "state", "credit_limit", "status",
];

export const WORKFLOW_STEPS = [
  "Create Customer", "Create Quotation", "Sales Order", "Dispatch",
  "Invoice", "Payment", "Ledger Updated",
];
