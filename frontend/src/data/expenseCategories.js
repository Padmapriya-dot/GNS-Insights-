import {
  FileText,
  Gift,
  Grid2X2,
  HandCoins,
  HeartPulse,
  Plane,
  Receipt,
  ShoppingCart,
  Smartphone,
  UtensilsCrossed,
} from "lucide-react";

import { getTenantPref, putTenantPref } from "../api/accountsApi";

export const EXPENSE_COLOURS = [
  { id: "teal", value: "#14b8a6" },
  { id: "lime", value: "#a3e635" },
  { id: "slate", value: "#475569" },
  { id: "green", value: "#16a34a" },
  { id: "purple", value: "#a855f7" },
];

export const ACCOUNT_GROUPS = ["Direct Expense", "Indirect Expense"];

export const PAYMENT_MODES = ["CASH", "CHEQUE", "NET BANKING", "UPI"];

/** Default expense categories matching Expense Settings v2. */
export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: "bill-utilities", name: "Bill & Utilities", account_group: "Indirect Expense", color: "#92400e", icon: "receipt" },
  { id: "food-dining", name: "Food & Dining", account_group: "Indirect Expense", color: "#ef4444", icon: "utensils" },
  { id: "gifts", name: "Gifts & Decorations", account_group: "Indirect Expense", color: "#ec4899", icon: "gift" },
  { id: "health", name: "Health & Fitness", account_group: "Indirect Expense", color: "#38bdf8", icon: "heart" },
  { id: "investments", name: "Investments", account_group: "Indirect Expense", color: "#166534", icon: "handCoins" },
  { id: "other", name: "Other", account_group: "Indirect Expense", color: "#0d9488", icon: "grid" },
  { id: "personal-care", name: "Personal Care", account_group: "Indirect Expense", color: "#1d4ed8", icon: "handPlus" },
  { id: "recharge", name: "Recharge", account_group: "Indirect Expense", color: "#f97316", icon: "phone" },
  { id: "shopping", name: "Shopping", account_group: "Indirect Expense", color: "#9333ea", icon: "cart" },
  { id: "taxes", name: "Taxes", account_group: "Direct Expense", color: "#22c55e", icon: "tax" },
  { id: "travel", name: "Travel", account_group: "Indirect Expense", color: "#eab308", icon: "plane" },
];

export function categoryIcon(icon) {
  switch (icon) {
    case "receipt":
      return Receipt;
    case "utensils":
      return UtensilsCrossed;
    case "gift":
      return Gift;
    case "heart":
      return HeartPulse;
    case "handCoins":
      return HandCoins;
    case "grid":
      return Grid2X2;
    case "handPlus":
      return HandCoins;
    case "phone":
      return Smartphone;
    case "cart":
      return ShoppingCart;
    case "tax":
      return FileText;
    case "plane":
      return Plane;
    default:
      return Grid2X2;
  }
}

const PREF_KEY = "expense_categories_v1";

/** Sync helper for initial render — prefers defaults until API loads. */
export function loadExpenseCategories() {
  return DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c }));
}

export async function fetchExpenseCategories() {
  try {
    const res = await getTenantPref(PREF_KEY);
    const value = res.data?.value;
    if (Array.isArray(value) && value.length) return value;
  } catch {
    /* fall through */
  }
  return DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c }));
}

export async function saveExpenseCategories(list) {
  await putTenantPref(PREF_KEY, list);
  return list;
}

/** @deprecated expenses persist via /accounts/expenses */
export function loadExpenses() {
  return [];
}

/** @deprecated */
export function saveExpenses() {}
