/** Generated Accounting Reports (Balance Sheet / P&L) via tenant prefs API. */

import { getTenantPref, putTenantPref } from "../api/accountsApi";

const PREF_KEY = "accounting_reports_v1";

export const REPORT_TYPES = {
  BALANCE_SHEET: "Balance Sheet",
  PROFIT_LOSS: "Profit and Loss Report",
};

export async function fetchAccountingReports() {
  try {
    const res = await getTenantPref(PREF_KEY);
    const value = res.data?.value;
    if (Array.isArray(value)) return value;
  } catch {
    /* fall through */
  }
  return [];
}

/** @deprecated use fetchAccountingReports */
export function loadAccountingReports() {
  return [];
}

export async function saveAccountingReports(list) {
  await putTenantPref(PREF_KEY, list);
  return list;
}

export function nextReportRef(list = []) {
  const nums = list.map((r) => Number(String(r.referenceNo || "").replace(/\D/g, "")) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `AR-${String(next).padStart(4, "0")}`;
}

export async function addAccountingReport({
  name,
  type,
  from,
  to,
  status = "Ready",
}) {
  const list = await fetchAccountingReports();
  const entry = {
    id: `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    referenceNo: nextReportRef(list),
    name,
    type,
    from,
    to,
    createdOn: new Date().toISOString(),
    status,
  };
  await saveAccountingReports([entry, ...list]);
  return entry;
}

export async function deleteAccountingReport(id) {
  const list = await fetchAccountingReports();
  await saveAccountingReports(list.filter((r) => r.id !== id));
}

export async function updateAccountingReport(id, patch) {
  const list = await fetchAccountingReports();
  const next = list.map((r) => (r.id === id ? { ...r, ...patch } : r));
  await saveAccountingReports(next);
  return next.find((r) => r.id === id) || null;
}
