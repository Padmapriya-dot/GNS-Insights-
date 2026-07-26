export const INITIAL_AP_SUMMARY = {
  outstanding_payables: 0,
  due_this_week: 0,
  overdue_bills: 0,
  paid_this_month: 0,
  pending_approvals: 0,
  vendor_count: 0,
};

export function normalizeListPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

export function normalizeSummaryPayload(payload) {
  if (!payload || typeof payload !== "object") return INITIAL_AP_SUMMARY;
  const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
  return {
    ...INITIAL_AP_SUMMARY,
    ...data,
  };
}

export function normalizeVendorList(payload) {
  const normalized = normalizeListPayload(payload);
  return normalized.filter((vendor) => vendor && typeof vendor === "object" && (vendor.name || vendor.vendor_code));
}

export function getRowBranch(row, fallback = "Head Office") {
  if (row?.branch) return row.branch;
  if (typeof row?.id === "number") {
    return row.id % 2 === 0 ? "Head Office" : "Plant-1";
  }
  return fallback;
}
