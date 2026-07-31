import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Calendar,
  ChevronDown,
  Info,
  RefreshCw,
  X,
} from "lucide-react";

import { loadChartOfAccounts } from "../../data/chartOfAccounts";
import {
  REPORT_TYPES,
  addAccountingReport,
} from "../../data/accountingReports";
import { useToast } from "../../context/ToastContext";
import useSettings from "../../context/SettingsContext";

const PAGE_BG = "#F5F5F5";
const HEADER_YELLOW = "#fff8e1";
const COL_HEADER = "#f0edff";
const CR = "#b91c1c";
const DR = "#0f766e";
const YELLOW = "#F5C518";

/** Screenshot order for P&L accounts (balances filled from chart). */
const EXPENSE_STRUCTURE = [
  {
    group: "Direct Expense",
    side: "DR",
    names: ["Wages", "Purchase Accounts", "Additional Charges (purchases)"],
  },
  {
    group: "Indirect Expense",
    side: "DR",
    names: [
      "Bank Charges",
      "Travel",
      "Taxes",
      "Other Indirect Expenses",
      "Health & Fitness",
      "Food & Dining",
      "Shopping",
      "Round Off (purchase)",
      "Investments",
      "Bill & Utilities",
      "Cash Discount",
      "Personal Care",
      "Gifts & Decorations",
      "Item Discount",
      "Recharge",
      "Salary",
      "Other",
    ],
  },
];

const INCOME_STRUCTURE = [
  {
    group: "Direct Income",
    side: "CR",
    names: ["Additional Charges", "Sales Accounts"],
  },
  {
    group: "Indirect Income",
    side: "CR",
    names: [
      "Item Discount (received)",
      "Interest Received",
      "Round Off",
      "Cash Discount (received)",
      "Other Indirect Income",
    ],
  },
];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fyLabel(isoDate) {
  const d = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = m >= 3 ? y : y - 1;
  return `${start}-${start + 1}`;
}

function fyStartIso(isoDate) {
  const d = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const startY = m >= 3 ? y : y - 1;
  return `${startY}-04-01`;
}

function formatInr(amount) {
  const n = Number(amount) || 0;
  return `₹ ${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDisplayDate(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-");
  return `${d}/${m}/${y}`;
}

function buildSections(accounts, structure) {
  const byName = new Map(accounts.map((a) => [a.name, a]));
  return structure.map((block) => {
    const items = block.names.map((name) => {
      const a = byName.get(name);
      return {
        id: a?.id || name,
        name,
        balance: Number(a?.balance) || 0,
        side: a?.side || block.side,
      };
    });
    const total = items.reduce((s, i) => s + i.balance, 0);
    return { group: block.group, items, total, side: block.side };
  });
}

function Amount({ value, side, bold = false }) {
  const color = side === "DR" ? DR : CR;
  return (
    <span
      className={`tabular-nums whitespace-nowrap ${bold ? "font-bold" : "font-medium"}`}
      style={{ color }}
    >
      {formatInr(value)} {side}
    </span>
  );
}

function SectionBlock({ section }) {
  return (
    <div className="border-b border-[#e8e8ee]">
      <div
        className="flex items-center justify-between gap-3 px-3 py-2.5"
        style={{ background: HEADER_YELLOW }}
      >
        <span className="text-[13px] font-bold text-[#1a1a1f]">{section.group}</span>
        <Amount value={section.total} side={section.side} bold />
      </div>
      {section.items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-3 border-t border-[#efeff4] px-3 py-2.5 pl-6"
        >
          <span className="text-[13px] text-[#4a4a55]">{item.name}</span>
          <Amount value={item.balance} side={item.side} />
        </div>
      ))}
    </div>
  );
}

function GenerateModal({ open, onClose, onGenerate, defaultFrom, defaultTo }) {
  const [reportName, setReportName] = useState("");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  useEffect(() => {
    if (!open) return;
    setReportName("");
    setFrom(defaultFrom);
    setTo(defaultTo);
  }, [open, defaultFrom, defaultTo]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl bg-[#f7f7f9] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[18px] font-bold text-[#1a1a1f]">
            Generate Profit &amp; Loss Report
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#d8d8e0] bg-white text-[#6b6b76] hover:bg-[#f0f0f4]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#3a3a42]">
              Report Name <span className="text-[#e11d48]">*</span>
            </label>
            <input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter Report Name"
              className="w-full rounded-lg border border-[#1a1a1f] bg-white px-3 py-2.5 text-[14px] outline-none placeholder:text-[#a0a0ab]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#3a3a42]">
              Select The Date Range For The Profit &amp; Loss Report{" "}
              <span className="text-[#e11d48]">*</span>
            </label>
            <div className="relative flex items-center gap-2 rounded-lg border border-[#cfcfd6] bg-white px-3 py-2.5">
              <Calendar className="h-4 w-4 shrink-0 text-[#9a9aa5]" />
              <span className="min-w-0 flex-1 text-[13px] text-[#1a1a1f]">
                {formatDisplayDate(from)} → {formatDisplayDate(to)}
              </span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="From date"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="absolute right-0 top-0 h-full w-1/2 cursor-pointer opacity-0"
                aria-label="To date"
              />
            </div>
          </div>

          <div className="flex gap-2.5 rounded-lg bg-[#ececf0] px-3 py-3 text-[12.5px] leading-relaxed text-[#5a5a66]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6b6b76]" />
            <p>
              The export may take time, so we&apos;ll notify and share with you on WhatsApp once
              it&apos;s ready. Once generated, you can also find the report in the Accounting
              Reports tab.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d0d0d8] bg-white px-4 py-2.5 text-[14px] font-medium text-[#1a1a1f] hover:bg-[#f0f0f4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onGenerate({ reportName: reportName.trim(), from, to })}
            className="rounded-lg px-4 py-2.5 text-[14px] font-bold text-[#1a1a1f]"
            style={{ background: YELLOW }}
          >
            Generate Report
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ProfitLossV2() {
  const { addToast } = useToast();
  const { companyName } = useSettings();
  const company = companyName?.trim() || "My Company";

  const [accounts, setAccounts] = useState(() => loadChartOfAccounts());
  const [asOf, setAsOf] = useState(todayIso());
  const [modalOpen, setModalOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const companyRef = useRef(null);

  const fy = fyLabel(asOf);
  const defaultFrom = fyStartIso(asOf);

  const expenses = useMemo(
    () => buildSections(accounts, EXPENSE_STRUCTURE),
    [accounts]
  );
  const incomes = useMemo(
    () => buildSections(accounts, INCOME_STRUCTURE),
    [accounts]
  );

  const totalExpense = useMemo(
    () => expenses.reduce((s, g) => s + g.total, 0),
    [expenses]
  );
  const totalIncome = useMemo(
    () => incomes.reduce((s, g) => s + g.total, 0),
    [incomes]
  );
  const netProfit = totalIncome - totalExpense;
  const expenseSideTotal = totalExpense + Math.max(0, netProfit);
  const incomeSideTotal = totalIncome + Math.max(0, -netProfit);

  useEffect(() => {
    if (!companyOpen) return undefined;
    const onDoc = (e) => {
      if (companyRef.current && !companyRef.current.contains(e.target)) setCompanyOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [companyOpen]);

  const refresh = () => {
    setAccounts(loadChartOfAccounts());
    addToast("Profit & Loss report refreshed", "success");
  };

  const handleGenerate = ({ reportName, from, to }) => {
    if (!reportName) {
      addToast("Report name is required", "error");
      return;
    }
    if (!from || !to) {
      addToast("Select a date range", "error");
      return;
    }
    setAsOf(to);
    setAccounts(loadChartOfAccounts());
    addAccountingReport({
      name: reportName,
      type: REPORT_TYPES.PROFIT_LOSS,
      from,
      to,
      status: "Ready",
    });
    setModalOpen(false);
    addToast(`"${reportName}" generated. Find it under Accounting Reports.`, "success");
  };

  return (
    <div className="min-h-full" style={{ background: PAGE_BG }}>
      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-semibold tracking-tight text-[#1a1a1f]">
              Profit &amp; Loss Report
            </h1>
            <span className="rounded-full bg-[#d4d4d8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5a5a66]">
              v2
            </span>
          </div>

          <div className="relative" ref={companyRef}>
            <button
              type="button"
              onClick={() => setCompanyOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-[#d0d0d8] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#1a1a1f]"
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-white"
                style={{ background: YELLOW }}
              >
                <Building2 className="h-4 w-4" />
              </span>
              {company}
              <ChevronDown className="h-4 w-4 text-[#9a9aa5]" />
            </button>
            {companyOpen ? (
              <div className="absolute right-0 z-20 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-[#d0d0d8] bg-white shadow-lg">
                <div className="px-3 py-2.5 text-[13px] font-medium text-[#1a1a1f]">{company}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#d0d0d8] bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#d0d0d8] px-5 py-4">
            <div>
              <h2 className="text-[18px] font-semibold text-[#1a1a1f]">
                Profit and Loss Report ({company})
              </h2>
              <p className="mt-0.5 text-[13px] text-[#8a8a96]">
                Profit and Loss Report for {fy} Fiscal Year
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#d0d0d8] bg-[#f3f3f6] px-3.5 py-2.5 text-[13px] font-semibold text-[#1a1a1f] hover:bg-[#ececf0]"
            >
              <Calendar className="h-4 w-4" />
              Select Date and Generate Report
            </button>
          </div>

          <div className="grid border-b border-[#d0d0d8] lg:grid-cols-2">
            <div
              className="border-b border-[#d0d0d8] px-4 py-2.5 text-center text-[12px] font-bold uppercase tracking-wide text-[#6b4eff] lg:border-b-0 lg:border-r"
              style={{ background: COL_HEADER }}
            >
              Expense
            </div>
            <div
              className="px-4 py-2.5 text-center text-[12px] font-bold uppercase tracking-wide text-[#6b4eff]"
              style={{ background: COL_HEADER }}
            >
              Income
            </div>
          </div>

          <div className="grid lg:grid-cols-2">
            <div className="border-b border-[#d0d0d8] lg:border-b-0 lg:border-r">
              {expenses.map((section) => (
                <SectionBlock key={section.group} section={section} />
              ))}

              <div className="flex items-center justify-between gap-3 border-b border-[#e8e8ee] px-3 py-2.5">
                <span className="text-[13px] font-semibold text-[#1a1a1f]">Opening Stock</span>
                <span className="tabular-nums text-[13px] font-medium text-[#4a4a55]">
                  {formatInr(0)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 border-b border-[#e8e8ee] px-3 py-2.5">
                <span className="text-[13px] font-semibold" style={{ color: DR }}>
                  Net Profit
                </span>
                <span className="tabular-nums text-[13px] font-bold" style={{ color: DR }}>
                  {formatInr(Math.max(0, netProfit))}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-[#f3f3f6] px-3 py-3">
                <span className="text-[13px] font-bold text-[#1a1a1f]">Total</span>
                <span className="tabular-nums text-[13px] font-bold text-[#1a1a1f]">
                  {formatInr(expenseSideTotal)}
                </span>
              </div>
            </div>

            <div>
              {incomes.map((section) => (
                <SectionBlock key={section.group} section={section} />
              ))}

              <div className="flex items-center justify-between gap-3 border-b border-[#e8e8ee] px-3 py-2.5">
                <span className="text-[13px] font-semibold text-[#1a1a1f]">Closing Stock</span>
                <span className="tabular-nums text-[13px] font-medium text-[#4a4a55]">
                  {formatInr(0)}
                </span>
              </div>

              {netProfit < 0 ? (
                <div className="flex items-center justify-between gap-3 border-b border-[#e8e8ee] px-3 py-2.5">
                  <span className="text-[13px] font-semibold" style={{ color: CR }}>
                    Net Loss
                  </span>
                  <span className="tabular-nums text-[13px] font-bold" style={{ color: CR }}>
                    {formatInr(Math.abs(netProfit))}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 bg-[#f3f3f6] px-3 py-3">
                <span className="text-[13px] font-bold text-[#1a1a1f]">Total</span>
                <span className="tabular-nums text-[13px] font-bold text-[#1a1a1f]">
                  {formatInr(incomeSideTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={refresh}
        className="fixed bottom-20 right-6 z-30 grid h-11 w-11 place-items-center rounded-xl border border-[#d0d0d8] bg-white shadow-lg hover:bg-[#f7f7f9] md:bottom-6"
        aria-label="Refresh profit and loss"
        title="Refresh"
      >
        <RefreshCw className="h-5 w-5 text-[#2563eb]" />
      </button>

      <GenerateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onGenerate={handleGenerate}
        defaultFrom={defaultFrom}
        defaultTo={asOf}
      />
    </div>
  );
}
