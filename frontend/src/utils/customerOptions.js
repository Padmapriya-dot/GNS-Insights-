import { createCustomer, getCustomers } from "../api/salesApi";

const STATE_CODES = {
  "Andhra Pradesh": "37",
  "Telangana": "36",
  Karnataka: "29",
  Maharashtra: "27",
  "Tamil Nadu": "33",
  Gujarat: "24",
  Delhi: "07",
  "Uttar Pradesh": "09",
  "West Bengal": "19",
  Rajasthan: "08",
};

/** Load customers from API only. */
export async function fetchCustomersWithFallback() {
  const res = await getCustomers();
  return res.data || [];
}

export function customerToConsigneeFields(customer) {
  if (!customer) return {};
  return {
    consignee_name: customer.name,
    consignee_address1: customer.address_line1 || "",
    consignee_address2: customer.address_line2 || "",
    consignee_state: customer.state || "",
    consignee_state_code: customer.state_code || STATE_CODES[customer.state] || "",
    consignee_gstin: customer.gstin || "",
  };
}

/** Ensure a numeric customer id for API calls. */
export async function resolveCustomerId(customerId, customers, tenantId) {
  const idStr = String(customerId);
  if (/^\d+$/.test(idStr)) return Number(idStr);

  const customer = customers.find((c) => String(c.id) === idStr);
  if (!customer) throw new Error("Customer not found");

  const payload = {
    tenant_id: tenantId,
    name: customer.name,
    contact_name: customer.contact_name || null,
    address_line1: customer.address_line1 || null,
    address_line2: customer.address_line2 || null,
    state: customer.state || null,
    state_code: customer.state_code || STATE_CODES[customer.state] || null,
    gstin: customer.gstin || null,
    email: customer.email || null,
    phone: customer.phone || null,
  };

  const res = await createCustomer(payload);
  return res.data.id;
}

export function filterCustomers(customers, query) {
  const q = query.trim().toLowerCase();
  if (!q) return customers;
  return customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(q) ||
      c.contact_name?.toLowerCase().includes(q) ||
      c.gstin?.toLowerCase().includes(q) ||
      c.state?.toLowerCase().includes(q)
  );
}
