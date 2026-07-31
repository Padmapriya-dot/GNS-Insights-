/** Standard Chart of Accounts seed (India-style groups from product screenshots). */

export const COA_TABS = [
  { id: "all", label: "All Accounts" },
  { id: "Asset", label: "Asset" },
  { id: "Liability", label: "Liability" },
  { id: "Income", label: "Income" },
  { id: "Expense", label: "Expense" },
  { id: "Equity", label: "Equity" },
];

export const COA_GROUPS = {
  Asset: ["Current Asset", "Fixed Asset", "Investment"],
  Liability: ["Current Liability", "Non-Current Liability", "Provisions", "Loans"],
  Income: ["Direct Income", "Indirect Income"],
  Expense: ["Direct Expense", "Indirect Expense"],
  Equity: ["Capital Account"],
};

/** @type {{ id: string, name: string, type: string, group: string, balance: number, side: 'DR'|'CR', childCount?: number, custom?: boolean }[]} */
export const DEFAULT_CHART_OF_ACCOUNTS = [
  // Asset / Current Asset
  { id: "ar", name: "Accounts Receivable (Sundry Debtors)", type: "Asset", group: "Current Asset", balance: 0, side: "DR", childCount: 2, description: "Amounts owed by customers for goods/services sold on credit." },
  { id: "bank", name: "Bank Accounts", type: "Asset", group: "Current Asset", balance: 0, side: "DR" },
  { id: "cash", name: "Cash In Hand", type: "Asset", group: "Current Asset", balance: 0, side: "DR" },
  { id: "oca", name: "Other Current Asset", type: "Asset", group: "Current Asset", balance: 0, side: "DR" },
  { id: "stock", name: "Stock in Hand", type: "Asset", group: "Current Asset", balance: 0, side: "DR" },
  { id: "tcs-rec", name: "TCS Receivable", type: "Asset", group: "Current Asset", balance: 0, side: "DR" },
  { id: "tds-rec", name: "TDS Receivable", type: "Asset", group: "Current Asset", balance: 0, side: "DR" },
  // Asset / Fixed Asset
  { id: "plant", name: "Plant and Equipment", type: "Asset", group: "Fixed Asset", balance: 0, side: "DR" },
  // Asset / Investment
  { id: "investment", name: "Investment", type: "Asset", group: "Investment", balance: 0, side: "DR" },

  // Liability / Current Liability
  { id: "ap", name: "Accounts Payable (Sundry Creditors)", type: "Liability", group: "Current Liability", balance: 0, side: "CR" },
  { id: "advances", name: "Advances", type: "Liability", group: "Current Liability", balance: 0, side: "CR" },
  { id: "dtl", name: "Deferred Tax Liability", type: "Liability", group: "Current Liability", balance: 0, side: "CR" },
  { id: "duties", name: "Duties And Taxes", type: "Liability", group: "Current Liability", balance: 0, side: "CR", childCount: 9 },
  { id: "ocl", name: "Other Current Liability", type: "Liability", group: "Current Liability", balance: 0, side: "CR" },
  { id: "stb", name: "Short Term Borrowings", type: "Liability", group: "Current Liability", balance: 0, side: "CR" },
  { id: "stp", name: "Short Term Provisions", type: "Liability", group: "Current Liability", balance: 0, side: "CR" },
  // Liability / Non-Current
  { id: "ltb", name: "Long Term Borrowings", type: "Liability", group: "Non-Current Liability", balance: 0, side: "CR" },
  { id: "ltp", name: "Long Term Provisions", type: "Liability", group: "Non-Current Liability", balance: 0, side: "CR" },
  { id: "provisions", name: "Provisions", type: "Liability", group: "Provisions", balance: 0, side: "CR", childCount: 2 },
  { id: "loans", name: "Loans", type: "Liability", group: "Loans", balance: 0, side: "CR", childCount: 2 },

  // Income / Direct
  { id: "add-charges", name: "Additional Charges", type: "Income", group: "Direct Income", balance: 0, side: "CR", childCount: 11 },
  { id: "sales", name: "Sales Accounts", type: "Income", group: "Direct Income", balance: 0, side: "CR", childCount: 3 },
  // Income / Indirect
  { id: "cash-disc-rec", name: "Cash Discount (received)", type: "Income", group: "Indirect Income", balance: 0, side: "CR" },
  { id: "interest-rec", name: "Interest Received", type: "Income", group: "Indirect Income", balance: 0, side: "CR" },
  { id: "item-disc-rec", name: "Item Discount (received)", type: "Income", group: "Indirect Income", balance: 0, side: "CR" },
  { id: "other-ind-inc", name: "Other Indirect Income", type: "Income", group: "Indirect Income", balance: 0, side: "CR" },
  { id: "round-off-inc", name: "Round Off", type: "Income", group: "Indirect Income", balance: 0, side: "CR" },

  // Expense / Direct
  { id: "add-charges-pur", name: "Additional Charges (purchases)", type: "Expense", group: "Direct Expense", balance: 0, side: "DR", childCount: 5 },
  { id: "purchase", name: "Purchase Accounts", type: "Expense", group: "Direct Expense", balance: 0, side: "DR", childCount: 4 },
  { id: "wages", name: "Wages", type: "Expense", group: "Direct Expense", balance: 0, side: "DR" },
  // Expense / Indirect
  { id: "bank-charges", name: "Bank Charges", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR" },
  { id: "bill-util", name: "Bill & Utilities", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR", custom: true },
  { id: "cash-disc", name: "Cash Discount", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR" },
  { id: "food", name: "Food & Dining", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR", custom: true },
  { id: "gifts", name: "Gifts & Decorations", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR", custom: true },
  { id: "health", name: "Health & Fitness", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR", custom: true },
  { id: "investments-exp", name: "Investments", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR", custom: true },
  { id: "item-disc", name: "Item Discount", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR" },
  { id: "other-exp", name: "Other", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR", custom: true },
  { id: "other-ind-exp", name: "Other Indirect Expenses", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR" },
  { id: "personal", name: "Personal Care", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR", custom: true },
  { id: "recharge", name: "Recharge", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR", custom: true },
  { id: "round-off-pur", name: "Round Off (purchase)", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR" },
  { id: "salary", name: "Salary", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR" },
  { id: "shopping", name: "Shopping", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR", custom: true },
  { id: "taxes", name: "Taxes", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR", custom: true },
  { id: "travel", name: "Travel", type: "Expense", group: "Indirect Expense", balance: 0, side: "DR", custom: true },

  // Equity
  { id: "partner-cap", name: "Partner's Capital", type: "Equity", group: "Capital Account", balance: 0, side: "CR" },
  { id: "prop-cap", name: "Proprietor's Capital", type: "Equity", group: "Capital Account", balance: 0, side: "CR" },
  { id: "reserves", name: "Reserves and Surplus", type: "Equity", group: "Capital Account", balance: 0, side: "CR" },
  { id: "share-cap", name: "Share Capital", type: "Equity", group: "Capital Account", balance: 0, side: "CR" },
];

const COA_KEY = "gns_chart_of_accounts_v2";
const COA_SUB_KEY = "gns_coa_sub_accounts_v1";
const COA_JOURNAL_KEY = "gns_coa_journal_entries_v1";

/** Default sub-accounts keyed by parent account id. */
export const DEFAULT_SUB_ACCOUNTS = {
  ar: [
    { id: "ar-cash-sale", name: "Cash Sale", balance: 0, side: "DR", custom: true, openingBalance: 0 },
    { id: "ar-demo-gst", name: "DEMO GST Register Party", balance: 0, side: "DR", custom: true, openingBalance: 0 },
  ],
};

export function loadChartOfAccounts() {
  try {
    const raw = localStorage.getItem(COA_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    /* ignore */
  }
  return DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({ ...a }));
}

export function saveChartOfAccounts(list) {
  localStorage.setItem(COA_KEY, JSON.stringify(list));
}

export function loadSubAccounts(parentId) {
  try {
    const raw = localStorage.getItem(COA_SUB_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed[parentId])) return parsed[parentId];
      // Prefer stored empty array over defaults once user has saved
      if (Object.prototype.hasOwnProperty.call(parsed, parentId)) return parsed[parentId] || [];
    }
  } catch {
    /* ignore */
  }
  return (DEFAULT_SUB_ACCOUNTS[parentId] || []).map((s) => ({ ...s }));
}

export function saveSubAccounts(parentId, list) {
  let all = {};
  try {
    const raw = localStorage.getItem(COA_SUB_KEY);
    all = raw ? JSON.parse(raw) : {};
    if (!all || typeof all !== "object") all = {};
  } catch {
    all = {};
  }
  all[parentId] = list;
  localStorage.setItem(COA_SUB_KEY, JSON.stringify(all));
}

export function loadJournalEntries(parentId) {
  try {
    const raw = localStorage.getItem(COA_JOURNAL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed[parentId])) return parsed[parentId];
  } catch {
    /* ignore */
  }
  return [];
}

export function saveJournalEntries(parentId, list) {
  let all = {};
  try {
    const raw = localStorage.getItem(COA_JOURNAL_KEY);
    all = raw ? JSON.parse(raw) : {};
    if (!all || typeof all !== "object") all = {};
  } catch {
    all = {};
  }
  all[parentId] = list;
  localStorage.setItem(COA_JOURNAL_KEY, JSON.stringify(all));
}

/** Extra ledgers shown in journal account picker (charges / tax / GST, etc.). */
export const EXTRA_JOURNAL_ACCOUNTS = [
  "Making Charge- Imitation Jewelry",
  "Making Charge- Gold Jewelry",
  "Loading Charge",
  "Freight Charge",
  "Insurance Charge",
  "Packing Charge",
  "Service Charge",
  "Labour Charge",
  "Delivery Charge",
  "Other Charge",
  "Input CGST",
  "Input SGST",
  "Input IGST",
  "Input CESS",
  "Output CGST",
  "Output SGST",
  "Output IGST",
  "Output CESS",
  "GST Paid",
  "TDS Payable",
  "TCS Payable",
  "Sales",
  "Sales Return",
  "Purchase Return",
  "Debit Note",
  "Credit Note",
  "Demo Product",
  "Unsecured Loan",
  "Secured Loan",
  "Share Capital",
  "Cost Of Goods Sold",
  "Cost Of Goods Purchased",
  "Custom",
].map((name, i) => ({
  id: `extra-${i + 1}`,
  name,
}));

/** Flat options for journal Account picker (COA + all sub-accounts + extras). */
export function getJournalAccountOptions(contextAccountId) {
  const mains = loadChartOfAccounts().map((a) => ({ value: a.id, label: a.name }));
  const extras = EXTRA_JOURNAL_ACCOUNTS.map((a) => ({ value: a.id, label: a.name }));

  const subOpts = [];
  try {
    const raw = localStorage.getItem(COA_SUB_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") {
      Object.values(parsed).forEach((list) => {
        if (!Array.isArray(list)) return;
        list.forEach((s) => subOpts.push({ value: s.id, label: s.name }));
      });
    }
  } catch {
    /* ignore */
  }
  // Always include defaults for context parent if not stored yet
  (DEFAULT_SUB_ACCOUNTS[contextAccountId] || []).forEach((s) => {
    subOpts.push({ value: s.id, label: s.name });
  });

  const seen = new Set();
  return [...mains, ...subOpts, ...extras]
    .filter((o) => {
      if (!o.label || seen.has(o.value) || seen.has(o.label)) return false;
      seen.add(o.value);
      seen.add(o.label);
      return true;
    })
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

export function getAccountById(id) {
  return loadChartOfAccounts().find((a) => a.id === id) || null;
}

export function updateAccountById(id, patch) {
  const list = loadChartOfAccounts();
  const next = list.map((a) => (a.id === id ? { ...a, ...patch, id: a.id } : a));
  saveChartOfAccounts(next);
  return next.find((a) => a.id === id) || null;
}
