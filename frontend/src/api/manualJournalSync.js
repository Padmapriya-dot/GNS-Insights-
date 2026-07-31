import { createJournalEntry, deleteJournalEntry, listJournalEntries, updateJournalEntry } from "./accountsApi";
import { asArray, apiErrorMessage } from "../utils/apiError";

/** Map backend journal row → Manual Journal V2 list shape. */
export function mapApiJournalToUi(row) {
  const legs = Array.isArray(row?.legs) ? row.legs : [];
  const debit = legs.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const credit = legs.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  return {
    id: row.id,
    apiId: row.id,
    date: row.entry_date,
    voucherNumber: row.entry_number,
    name: row.reference || row.entry_number,
    narration: row.description || "",
    transactionType: "Journal",
    debit,
    credit,
    amount: debit,
    status: row.status,
    source: "api",
    lines: legs.map((l) => ({
      accountId: l.account,
      accountName: l.account,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
    })),
  };
}

export async function fetchManualJournals() {
  const res = await listJournalEntries();
  return asArray(res.data)
    .map(mapApiJournalToUi)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

/** @deprecated use fetchManualJournals */
export async function fetchMergedManualJournals(_localList = []) {
  return fetchManualJournals();
}

export async function postManualJournalToApi(entry) {
  const payload = {
    date: entry.date,
    ref: entry.name,
    desc: entry.narration,
    status: "Posted",
    branch: "Head Office",
    legs: (entry.lines || []).map((l) => ({
      account: l.accountName || l.accountId || "General",
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
    })),
  };
  const res = await createJournalEntry(payload);
  return mapApiJournalToUi(res.data);
}

export async function updateManualJournalOnApi(entry) {
  const id = entry.apiId || entry.id;
  if (!id) throw new Error("Missing journal id");
  const payload = {
    date: entry.date,
    ref: entry.name,
    desc: entry.narration,
    status: entry.status || "Posted",
    branch: "Head Office",
    legs: (entry.lines || []).map((l) => ({
      account: l.accountName || l.accountId || "General",
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
    })),
  };
  const res = await updateJournalEntry(id, payload);
  return mapApiJournalToUi(res.data);
}

export async function deleteManualJournalOnApi(entry) {
  const id = entry?.apiId || entry?.id;
  if (!id) throw new Error("Missing journal id");
  await deleteJournalEntry(id);
  return id;
}

export { apiErrorMessage };
