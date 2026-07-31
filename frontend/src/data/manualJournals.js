/** Manual journal helpers — numbers only; persistence is via accounts API. */

export function nextManualJournalNumber(existing = []) {
  const nums = (existing || []).map((j) => {
    const raw = String(j.voucherNumber || "");
    const m = raw.match(/(\d+)\s*$/);
    return m ? Number(m[1]) : Number(raw) || 0;
  });
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}

/** @deprecated local persistence removed — use accounts journal APIs */
export function loadManualJournals() {
  return [];
}

/** @deprecated */
export function saveManualJournals() {}

/** @deprecated */
export function deleteManualJournal() {
  return [];
}
