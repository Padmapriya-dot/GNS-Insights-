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

/** Load customers created in Customer Management, API, and converted leads (NO dummy/sample data). */
export async function fetchCustomersWithFallback() {
  try {
    const res = await getCustomers().catch(() => null);
    const apiCusts = res?.data || [];
    const storedCusts = localStorage.getItem("smrt_customers");
    const localCusts = storedCusts ? JSON.parse(storedCusts) : [];
    const deletedStored = localStorage.getItem("smrt_deleted_customers");
    const deletedIds = (deletedStored ? JSON.parse(deletedStored) : []).map((d) => String(d).trim().toLowerCase());
    
    // Merge qualified/converted leads strictly using company/customer name
    const storedLeads = localStorage.getItem("smrt_leads");
    const localLeads = storedLeads ? JSON.parse(storedLeads) : [];
    const convertedLeads = localLeads
      .filter((l) => ["qualified", "converted", "won"].includes(String(l.status || "").toLowerCase()))
      .map((l) => ({
        id: l.lead_id || l.id || l.customer_name || l.company,
        name: l.company || l.customer_name,
        company: l.company || l.customer_name,
        email: l.email,
        phone: l.contact,
      }));

    const custMap = new Map();
    [...apiCusts, ...localCusts, ...convertedLeads].forEach((c) => {
      const displayName = c.company || c.name || c.customer_name;
      const cleanName = String(displayName || "").trim();
      const lower = cleanName.toLowerCase();
      const idStr = String(c.id || c.customer_code || cleanName).trim().toLowerCase();

      if (deletedIds.includes(lower) || deletedIds.includes(idStr)) return;

      if (cleanName && cleanName.length >= 2) {
        const id = c.id || cleanName;
        custMap.set(lower, { ...c, id, name: cleanName, company: cleanName });
      }
    });

    return Array.from(custMap.values());
  } catch {
    const storedCusts = localStorage.getItem("smrt_customers");
    const localCusts = storedCusts ? JSON.parse(storedCusts) : [];
    const deletedStored = localStorage.getItem("smrt_deleted_customers");
    const deletedIds = (deletedStored ? JSON.parse(deletedStored) : []).map((d) => String(d).trim().toLowerCase());

    const custMap = new Map();
    localCusts.forEach((c) => {
      const displayName = c.company || c.name || c.customer_name;
      const cleanName = String(displayName || "").trim();
      const lower = cleanName.toLowerCase();
      const idStr = String(c.id || c.customer_code || cleanName).trim().toLowerCase();

      if (deletedIds.includes(lower) || deletedIds.includes(idStr)) return;

      if (cleanName && cleanName.length >= 2) {
        const id = c.id || cleanName;
        custMap.set(lower, { ...c, id, name: cleanName, company: cleanName });
      }
    });
    return Array.from(custMap.values());
  }
}

export function customerToConsigneeFields(customer) {
  if (!customer) return {};
  return {
    consignee_name: customer.name || customer.customer_name || "",
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

  const customer = customers.find((c) => String(c.id) === idStr || String(c.name) === idStr);
  if (!customer) return 1;

  const payload = {
    tenant_id: tenantId,
    name: customer.name || idStr,
    contact_name: customer.contact_name || null,
    city: customer.city || null,
    address_line1: customer.address_line1 || null,
    address_line2: customer.address_line2 || null,
    state: customer.state || null,
    state_code: customer.state_code || STATE_CODES[customer.state] || null,
    gstin: customer.gstin || null,
    email: customer.email || null,
    phone: customer.phone || null,
  };

  try {
    const res = await createCustomer(payload);
    return res.data.id;
  } catch {
    return 1;
  }
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
