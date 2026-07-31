import { useCallback, useEffect, useMemo, useState } from "react";
<<<<<<< HEAD
import { Link } from "react-router-dom";
import { Calendar, ChevronLeft, ChevronRight, FileText, Filter, ListFilter, Plus, Search, X } from "lucide-react";
=======
import { Link, useSearchParams } from "react-router-dom";
import { Download, FileText, Filter, Plus, RefreshCw } from "lucide-react";
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90

import Loader from "../../components/common/Loader";
import QuoteDetailModal from "../../components/sales/QuoteDetailModal";
import { useToast } from "../../context/ToastContext";
<<<<<<< HEAD
import {
  getQuotationSummary,
  getQuotationsEnriched,
  deleteQuotation,
  updateQuotationStatus,
} from "../../api/salesApi";
import { apiErrorMessage } from "../../utils/apiError";
import { formatInr, statusColor } from "../../data/salesMasterData";
=======
import useTenantId from "../../hooks/useTenantId";
import { getQuotationSummary, getQuotationsEnriched, updateQuotationStatus, createQuotation } from "../../api/salesApi";
import { DEMO_QUOTE_LIST, formatInr, statusColor } from "../../data/salesMasterData";
import { exportToExcel } from "../../utils/exportUtils";
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90

const YELLOW = "#F5C518";
const PURPLE = "#6b4eff";
const PAGE_SIZES = [10, 20, 50];

const SORT_OPTIONS = [
  { id: "date_desc", label: "Quotation date (Latest First)" },
  { id: "date_asc", label: "Quotation date (Oldest First)" },
  { id: "amount_desc", label: "Quotation Amount (High to Low)" },
  { id: "amount_asc", label: "Quotation Amount (Low to High)" },
];

const EMPTY_FILTERS = {
  quotationType: "",
  amountBand: "",
};

const AMOUNT_BANDS = [
  { id: "under_2k", label: "under ₹2,000", min: 0, max: 2000 },
  { id: "2k_5k", label: "₹2,000-₹5,000", min: 2000, max: 5000 },
  { id: "5k_10k", label: "₹5,000-₹10,000", min: 5000, max: 10000 },
  { id: "10k_20k", label: "₹10,000-₹20,000", min: 10000, max: 20000 },
  { id: "20k_above", label: "₹20,000-Above", min: 20000, max: Infinity },
];

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
        active
          ? "bg-[#2d2a4a] text-white"
          : "bg-[#f0f0f3] text-[#4a4a55] hover:bg-[#e4e4ea]"
      }`}
    >
      {label}
    </button>
  );
}

function FilterSection({ label, children }) {
  return (
    <div className="border-b border-[#d0d0d8] py-4 last:border-b-0">
      <p className="mb-2.5 text-[12px] font-medium text-[#9a9aa5]">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SummaryTab({ label, count, amount, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 flex-1 border-b-[3px] px-5 py-3.5 text-left transition ${
        active
          ? "border-[#6b4eff] bg-white text-[#6b4eff]"
          : "border-transparent bg-transparent text-[#6b6b76] hover:bg-white/70"
      }`}
    >
      <p className={`text-[13px] font-medium ${active ? "" : "text-[#6b6b76]"}`}>
        {label}{" "}
        <span className={active ? "opacity-70" : "text-[#a0a0ab]"}>({count})</span>
      </p>
      <p
        className={`mt-1 text-[18px] font-bold tabular-nums ${
          active ? "text-[#6b4eff]" : "text-[#1a1a1f]"
        }`}
      >
        {amount}
      </p>
    </button>
  );
}

function inAmountBand(amount, bandId) {
  const band = AMOUNT_BANDS.find((b) => b.id === bandId);
  if (!band) return true;
  const n = Number(amount) || 0;
  return n >= band.min && n < band.max;
}

function statusBucket(status) {
  const s = String(status || "").toLowerCase();
  if (["accepted", "approved"].includes(s)) return "accepted";
  if (["rejected", "cancelled", "canceled", "expired"].includes(s)) return "cancelled";
  return "pending";
}

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  if (!y || !m || !d) return String(iso).slice(0, 10);
  return `${d}/${m}/${y}`;
}

export default function Quotations() {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
=======
  const [refreshing, setRefreshing] = useState(false);
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [selected, setSelected] = useState(null);
<<<<<<< HEAD
  const [kpiFilter, setKpiFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("2026-04-01");
  const [dateTo, setDateTo] = useState("2027-03-31");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortId, setSortId] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
=======
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "true" || window.location.pathname.endsWith("/create")) {
      setShowCreateModal(true);
    }
  }, [searchParams]);
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90

  const load = useCallback(async () => {
    setLoading(true);
    try {
<<<<<<< HEAD
      const [sumRes, listRes] = await Promise.allSettled([
        getQuotationSummary(),
        getQuotationsEnriched(),
      ]);
      if (sumRes.status === "fulfilled" && sumRes.value?.data) setSummary(sumRes.value.data);
      else setSummary({});
      if (listRes.status === "fulfilled") setRows(listRes.value?.data || []);
      else setRows([]);
=======
      const [sumRes, listRes] = await Promise.allSettled([getQuotationSummary(), getQuotationsEnriched()]);
      const stored = localStorage.getItem("smrt_quotations");
      const localQuotes = stored ? JSON.parse(stored) : [];
      let baseQuotes = DEMO_QUOTE_LIST || [];
      if (listRes.status === "fulfilled" && listRes.value?.data?.length) {
        baseQuotes = listRes.value.data;
      }
      const qMap = new Map();
      baseQuotes.forEach((q) => { const k = q.quote_number || q.id; if (k) qMap.set(String(k), q); });
      localQuotes.forEach((q) => { const k = q.quote_number || q.id; if (k) qMap.set(String(k), q); });
      setRows(Array.from(qMap.values()));
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90
    } catch {
      const stored = localStorage.getItem("smrt_quotations");
      const localQuotes = stored ? JSON.parse(stored) : [];
      const qMap = new Map();
      (DEMO_QUOTE_LIST || []).forEach((q) => { const k = q.quote_number || q.id; if (k) qMap.set(String(k), q); });
      localQuotes.forEach((q) => { const k = q.quote_number || q.id; if (k) qMap.set(String(k), q); });
      setRows(Array.from(qMap.values()));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

<<<<<<< HEAD
  useEffect(() => {
    setPage(1);
  }, [kpiFilter, search, filters, sortId, pageSize, dateFrom, dateTo]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (q) {
        const hay = `${r.quote_number || ""} ${r.customer_name || ""} ${r.sales_person || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const d = String(r.quote_date || r.valid_until || "").slice(0, 10);
      if (dateFrom && d && d < dateFrom) return false;
      if (dateTo && d && d > dateTo) return false;
      const bucket = statusBucket(r.status);
      if (kpiFilter === "pending" && bucket !== "pending") return false;
      if (kpiFilter === "accepted" && bucket !== "accepted") return false;
      if (kpiFilter === "cancelled" && bucket !== "cancelled") return false;
      if (filters.quotationType === "converted" && !r.converted_to_invoice) return false;
      if (filters.quotationType === "not_converted" && r.converted_to_invoice) return false;
      if (filters.amountBand && !inAmountBand(r.amount, filters.amountBand)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const da = String(a.quote_date || a.valid_until || "");
      const db = String(b.quote_date || b.valid_until || "");
      const aa = Number(a.amount) || 0;
      const ab = Number(b.amount) || 0;
      if (sortId === "date_asc") return da.localeCompare(db);
      if (sortId === "amount_desc") return ab - aa;
      if (sortId === "amount_asc") return aa - ab;
      return db.localeCompare(da);
    });
    return list;
  }, [rows, search, dateFrom, dateTo, kpiFilter, filters, sortId]);

  const tabStats = useMemo(() => {
    const base = rows;
    const sumAmt = (arr) => arr.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const pending = base.filter((r) => statusBucket(r.status) === "pending");
    const accepted = base.filter((r) => statusBucket(r.status) === "accepted");
    const cancelled = base.filter((r) => statusBucket(r.status) === "cancelled");
    return {
      all: { count: base.length, amount: sumAmt(base) },
      pending: { count: pending.length, amount: sumAmt(pending) },
      accepted: { count: accepted.length, amount: sumAmt(accepted) },
      cancelled: { count: cancelled.length, amount: sumAmt(cancelled) },
    };
  }, [rows]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = filteredSorted.slice((page - 1) * pageSize, page * pageSize);
=======
  const summary = useMemo(() => {
    const total_quotations = rows.length;
    const draft = rows.filter((r) => String(r.status || "").toLowerCase() === "draft").length;
    const sent = rows.filter((r) => String(r.status || "").toLowerCase() === "sent").length;
    const accepted = rows.filter((r) => String(r.status || "").toLowerCase() === "accepted").length;
    const rejected = rows.filter((r) => String(r.status || "").toLowerCase() === "rejected").length;
    const expired = rows.filter((r) => String(r.status || "").toLowerCase() === "expired").length;

    return { total_quotations, draft, sent, accepted, rejected, expired };
  }, [rows]);

  const filtered = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((r) => String(r.status || "").toLowerCase() === statusFilter.toLowerCase());
  }, [rows, statusFilter]);

  const handleCreateQuotation = async (payload) => {
    try {
      await createQuotation({ ...payload, tenant_id: tenantId });
      addToast("Quotation created successfully", "success");
      setShowCreateModal(false);
      await load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Could not create quotation", "error");
    }
  };
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90

  const handleStatus = async (quote, status) => {
    if (typeof quote.id === "number") {
      try {
        await updateQuotationStatus(quote.id, status);
        addToast(`Quotation marked as ${status}`);
      } catch (err) {
        addToast(err.response?.data?.detail || "Update failed", "error");
      }
<<<<<<< HEAD
=======
    } else {
      addToast(`Quotation status updated to ${status}`);
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90
    }

    // Update local state & localStorage so KPI cards update immediately
    const stored = localStorage.getItem("smrt_quotations");
    if (stored) {
      const localQuotes = JSON.parse(stored);
      const updatedLocal = localQuotes.map((q) => (q.quote_number === quote.quote_number ? { ...q, status } : q));
      localStorage.setItem("smrt_quotations", JSON.stringify(updatedLocal));
    }
    setRows((prev) => prev.map((q) => (q.quote_number === quote.quote_number ? { ...q, status } : q)));
    setSelected(null);
  };

<<<<<<< HEAD
  const handleDelete = async (row) => {
    if (!row?.id) return;
    if (!window.confirm(`Cancel quotation ${row.quote_number}?`)) return;
    try {
      await deleteQuotation(row.id);
      addToast("Quotation cancelled", "success");
      setSelected(null);
      await load();
    } catch (err) {
      addToast(apiErrorMessage(err, "Failed to cancel quotation"), "error");
    }
  };
=======
  const columns = [
    { key: "quote_number", label: "Quote No", render: (r) => <span className="font-semibold text-[#2563EB]">{r.quote_number}</span> },
    { key: "customer_name", label: "Customer", render: (r) => <span className="font-bold text-slate-900">{r.customer_name}</span> },
    { key: "sales_person", label: "Sales Rep", render: (r) => r.sales_person || "—" },
    { key: "quote_date", label: "Quote Date", render: (r) => String(r.quote_date || "").slice(0, 10) || "—" },
    { key: "valid_until", label: "Valid Until", render: (r) => String(r.valid_until || "").slice(0, 10) || "—" },
    {
      key: "line_items",
      label: "Quotation Line Items",
      render: (r) => {
        const itemText = r.items?.map((it) => it.description || it.name).filter(Boolean).join(", ") || r.line_items || "Standard Steel Components";
        return (
          <div className="max-w-[200px]" title={itemText}>
            <p className="text-xs font-semibold text-slate-800 truncate">{itemText}</p>
            {r.items && r.items.length > 1 && (
              <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                +{r.items.length - 1} more item(s)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "quantity",
      label: "Qty",
      render: (r) => (
        <span className="font-semibold text-slate-800 tabular-nums">
          {r.items?.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0) ?? r.quantity ?? 0}
        </span>
      ),
    },
    {
      key: "unit",
      label: "Unit",
      render: (r) => <span className="text-slate-600">{r.items?.[0]?.unit ?? r.unit ?? "—"}</span>,
    },
    {
      key: "unit_price",
      label: "Unit Price",
      render: (r) => (
        <span className="font-medium text-slate-700 tabular-nums">
          {formatInr(r.items?.[0]?.unit_price ?? r.unit_price ?? 0)}
        </span>
      ),
    },
    { key: "subtotal", label: "Subtotal", render: (r) => formatInr(r.subtotal ?? (r.amount ?? r.total_amount ?? 0)) },
    { key: "discount_percent", label: "Discount", render: (r) => <span className="text-amber-700 font-medium">{r.discount_percent != null ? `${r.discount_percent}%` : "0%"}</span> },
    { key: "gst_rate", label: "GST Tax", render: (r) => <span className="text-slate-600 font-medium">{r.gst_rate != null ? `${r.gst_rate}% (${formatInr(r.gst_amount || 0)})` : "18%"}</span> },
    { key: "amount", label: "Grand Total", render: (r) => <span className="font-bold text-slate-900 tabular-nums">{formatInr(r.total_amount ?? r.amount ?? 0)}</span> },
    { key: "notes", label: "Terms & Notes", render: (r) => <span className="text-xs text-slate-500 max-w-[140px] truncate block" title={r.notes}>{r.notes || "—"}</span> },
    { key: "status", label: "Status", render: (r) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor(r.status)}`}>{r.status}</span> },
    { key: "actions", label: "Actions", render: (r) => (
      <button type="button" onClick={() => setSelected(r)} className="text-xs font-semibold text-[#2563EB] hover:underline">View</button>
    )},
  ];
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F5F5F5]">
        <Loader label="Loading quotations..." />
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="min-h-full space-y-4 bg-[#F5F5F5] p-4 sm:p-6">
      <h1 className="text-[22px] font-bold text-[#1a1a1f]">Quotation</h1>

      <div className="overflow-hidden rounded-xl border border-[#d0d0d8] bg-[#f7f7f9]">
        <div className="flex overflow-x-auto">
          <SummaryTab
            label="All Quotations"
            count={tabStats.all.count}
            amount={formatInr(tabStats.all.amount)}
            active={kpiFilter === "all"}
            onClick={() => setKpiFilter("all")}
          />
          <SummaryTab
            label="Pending"
            count={tabStats.pending.count}
            amount={formatInr(tabStats.pending.amount)}
            active={kpiFilter === "pending"}
            onClick={() => setKpiFilter("pending")}
          />
          <SummaryTab
            label="Accepted"
            count={tabStats.accepted.count}
            amount={formatInr(tabStats.accepted.amount)}
            active={kpiFilter === "accepted"}
            onClick={() => setKpiFilter("accepted")}
          />
          <SummaryTab
            label="Cancelled"
            count={tabStats.cancelled.count}
            amount={formatInr(tabStats.cancelled.amount)}
            active={kpiFilter === "cancelled"}
            onClick={() => setKpiFilter("cancelled")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex items-center gap-2 rounded-lg border border-[#e4e4ea] bg-white px-3 py-2 text-[13px] text-[#4a4a55] shadow-sm">
          <Calendar className="h-4 w-4 shrink-0 text-[#9a9aa5]" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[118px] border-0 bg-transparent p-0 text-[13px] focus:outline-none"
          />
          <span className="text-[#9a9aa5]">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[118px] border-0 bg-transparent p-0 text-[13px] focus:outline-none"
          />
        </div>
        <Link
          to="/sales/quotations/create"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[14px] font-semibold text-[#1a1a1f] shadow-sm"
          style={{ background: YELLOW }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Create Quotation
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa5]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full rounded-full border border-[#e4e4ea] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#1a1a1f] shadow-sm placeholder:text-[#9a9aa5] focus:border-[#F5C518] focus:outline-none focus:ring-2 focus:ring-[#F5C518]/25"
          />
        </div>
        <div className="relative flex gap-2">
          <button
            type="button"
            onClick={() => {
              setDraftFilters(filters);
              setShowFilters(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#ececf0] px-3.5 py-2 text-[13px] font-medium text-[#4a4a55] hover:bg-[#e0e0e6]"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSort((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium ${
                showSort
                  ? "bg-[#dcdce3] text-[#1a1a1f]"
                  : "bg-[#ececf0] text-[#4a4a55] hover:bg-[#e0e0e6]"
              }`}
            >
              <ListFilter className="h-4 w-4" />
              Sort by
            </button>
            {showSort ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label="Close sort"
                  onClick={() => setShowSort(false)}
                />
                <div className="absolute right-0 z-20 mt-1.5 w-[280px] overflow-hidden rounded-xl border border-[#d0d0d8] bg-white py-1 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortId(opt.id);
                        setShowSort(false);
                      }}
                      className={`block w-full px-4 py-2.5 text-left text-[13px] hover:bg-[#f5f5f7] ${
                        sortId === opt.id ? "font-semibold text-[#1a1a1f]" : "text-[#4a4a55]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
=======
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
          <p className="mt-1 text-sm text-slate-500">Create, approve, and send commercial price quotations with GST, discount, and PDF export.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> New Quotation
          </button>
          <button type="button" onClick={() => exportToExcel(filtered, columns.filter((c) => !c.render), "quotations")} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" /> Export</button>
          <button type="button" onClick={async () => { setRefreshing(true); await load(); setRefreshing(false); }} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 transition-transform ${refreshing ? "animate-spin" : ""}`} /> Refresh</button>
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90
        </div>
      </div>

<<<<<<< HEAD
      <div className="overflow-hidden rounded-xl border border-[#d0d0d8] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-[13px]">
            <thead className="bg-[#f3f3f6] text-[12px] font-semibold uppercase tracking-wide text-[#6b6b76]">
              <tr>
                <th className="border-b border-r border-[#d0d0d8] px-4 py-3 last:border-r-0">Quotation No.</th>
                <th className="border-b border-r border-[#d0d0d8] px-4 py-3 last:border-r-0">Date</th>
                <th className="border-b border-r border-[#d0d0d8] px-4 py-3 last:border-r-0">Party Name</th>
                <th className="border-b border-r border-[#d0d0d8] px-4 py-3 last:border-r-0">Amount</th>
                <th className="border-b border-r border-[#d0d0d8] px-4 py-3 last:border-r-0">Status</th>
                <th className="border-b border-r border-[#d0d0d8] px-4 py-3 last:border-r-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <FileText className="mx-auto h-12 w-12 text-[#c4c4cc]" />
                    <p className="mt-3 text-[14px] text-[#6b6b76]">
                      No Quotations available, Create new quotation
                    </p>
                    <Link
                      to="/sales/quotations/create"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[14px] font-semibold text-[#1a1a1f]"
                      style={{ background: YELLOW }}
                    >
                      <Plus className="h-4 w-4" /> Create Quotation
                    </Link>
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#fafafa]">
                    <td className="border-t border-r border-[#d0d0d8] px-4 py-3 font-semibold" style={{ color: PURPLE }}>
                      {r.quote_number}
                    </td>
                    <td className="border-t border-r border-[#d0d0d8] px-4 py-3 text-[#4a4a55]">{fmtDate(r.quote_date)}</td>
                    <td className="border-t border-r border-[#d0d0d8] px-4 py-3 text-[#1a1a1f]">{r.customer_name || "—"}</td>
                    <td className="border-t border-r border-[#d0d0d8] px-4 py-3 tabular-nums font-medium text-[#1a1a1f]">
                      {formatInr(r.amount)}
                    </td>
                    <td className="border-t border-r border-[#d0d0d8] px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="border-t border-[#d0d0d8] px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelected(r)}
                          className="text-[12px] font-semibold hover:underline"
                          style={{ color: PURPLE }}
                        >
                          View
                        </button>
                        <Link
                          to={`/sales/quotations/${r.id}/edit`}
                          className="text-[12px] font-semibold text-[#4a4a55] hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(r)}
                          className="text-[12px] font-semibold text-[#dc2626] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#ececf0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#4a4a55]">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-md border border-[#e4e4ea] bg-white px-2 py-1 text-[13px]"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-[#9a9aa5]">
              {total === 0
                ? "1-0 of 0"
                : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-[#e4e4ea] p-1.5 text-[#4a4a55] disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[2rem] rounded-md bg-[#F5C518]/70 px-2.5 py-1 text-center text-[13px] font-semibold text-[#1a1a1f]">
              {page}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-[#e4e4ea] p-1.5 text-[#4a4a55] disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
=======
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">All Status</option>
            {["draft", "sent", "accepted", "rejected", "expired"].map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90
        </div>
      </div>

      {showFilters ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/35"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowFilters(false)}
        >
          <aside className="flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d0d0d8] px-5 py-4">
              <h2 className="text-[18px] font-bold text-[#1a1a1f]">Filters</h2>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-lg p-1 text-[#9a9aa5] hover:bg-[#f5f5f7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <FilterSection label="Quotation Type">
                <Chip
                  label="Converted to Invoice"
                  active={draftFilters.quotationType === "converted"}
                  onClick={() =>
                    setDraftFilters((f) => ({
                      ...f,
                      quotationType: f.quotationType === "converted" ? "" : "converted",
                    }))
                  }
                />
                <Chip
                  label="Not Converted"
                  active={draftFilters.quotationType === "not_converted"}
                  onClick={() =>
                    setDraftFilters((f) => ({
                      ...f,
                      quotationType: f.quotationType === "not_converted" ? "" : "not_converted",
                    }))
                  }
                />
              </FilterSection>
              <FilterSection label="Total Amount">
                {AMOUNT_BANDS.map((b) => (
                  <Chip
                    key={b.id}
                    label={b.label}
                    active={draftFilters.amountBand === b.id}
                    onClick={() =>
                      setDraftFilters((f) => ({
                        ...f,
                        amountBand: f.amountBand === b.id ? "" : b.id,
                      }))
                    }
                  />
                ))}
              </FilterSection>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-[#d0d0d8] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setDraftFilters(EMPTY_FILTERS);
                  setFilters(EMPTY_FILTERS);
                  setShowFilters(false);
                }}
                className="rounded-xl border border-[#d8d8e0] bg-[#f0f0f4] py-3 text-[14px] font-semibold text-[#1a1a1f]"
              >
                Clear Filter
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters(draftFilters);
                  setShowFilters(false);
                }}
                className="rounded-xl py-3 text-[14px] font-semibold text-[#1a1a1f]"
                style={{ background: YELLOW }}
              >
                Apply Filter
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {selected ? (
        <QuoteDetailModal
          quote={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatus}
        />
<<<<<<< HEAD
      ) : null}
=======
      )}

      <CreateQuotationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={load}
      />
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90
    </div>
  );
}
