import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpDown,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  REPORT_TYPES,
  deleteAccountingReport,
  loadAccountingReports,
} from "../../data/accountingReports";
import { useToast } from "../../context/ToastContext";
import useSettings from "../../context/SettingsContext";

const PAGE_BG = "#F5F5F5";
const PAGE_SIZES = [10, 20, 50];

const SORT_OPTIONS = [
  { id: "created-desc", label: "Report Generated Date (Latest First)" },
  { id: "created-asc", label: "Report Generated Date (Oldest First)" },
];

function fyStartIso() {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-04-01`;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatSlash(iso) {
  if (!iso) return "—";
  const datePart = String(iso).slice(0, 10);
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

function formatCreated(iso) {
  if (!iso) return "—";
  try {
    const dt = new Date(iso);
    return dt.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return formatSlash(iso);
  }
}

function Pagination({ page, pageSize, total, onPage, onPageSize }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#6b6b76]">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="rounded-md border border-[#d0d0d8] bg-white px-2.5 py-1.5 outline-none"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>
          {from}-{to} of {total}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d0d8] bg-white disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="grid h-8 min-w-8 place-items-center rounded-md border border-[#e0b400] px-2 text-[13px] font-semibold text-[#1a1a1f]"
          style={{ background: "#F5C518" }}
        >
          {page}
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d0d8] bg-white disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function FiltersDrawer({ open, draftTypes, onToggleType, onClear, onApply, onClose }) {
  if (!open) return null;

  const types = [REPORT_TYPES.BALANCE_SHEET, REPORT_TYPES.PROFIT_LOSS];

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-[360px] flex-col border-l border-[#d0d0d8] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#d0d0d8] px-5 py-4">
          <h2 className="text-[17px] font-semibold text-[#1a1a1f]">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#6b6b76] hover:bg-[#f7f7f9]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-3 text-[14px] font-bold text-[#1a1a1f]">Document Type</div>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => {
              const active = draftTypes.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onToggleType(t)}
                  className={`rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
                    active
                      ? "border-[#6b4eff] bg-[#f3f0ff] text-[#6b4eff]"
                      : "border-[#d0d0d8] bg-white text-[#1a1a1f] hover:bg-[#f7f7f9]"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[#d0d0d8] px-5 py-4">
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg bg-[#f3f3f6] px-4 py-2.5 text-[14px] font-bold text-[#1a1a1f] hover:bg-[#ececf0]"
          >
            Clear Filter
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-lg px-4 py-2.5 text-[14px] font-bold text-[#1a1a1f]"
            style={{ background: "#F5C518" }}
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function RowMenu({ report, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-30 mt-1 min-w-[150px] rounded-lg border border-[#e4e4ea] bg-white py-1 shadow-lg"
    >
      <button
        type="button"
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#b91c1c] hover:bg-[#fef2f2]"
        onClick={() => {
          onDelete?.(report);
          onClose?.();
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "Ready").toLowerCase();
  const styles =
    s === "generating"
      ? "bg-[#fff8e1] text-[#a16207]"
      : s === "failed"
        ? "bg-[#fef2f2] text-[#b91c1c]"
        : "bg-[#ecfdf5] text-[#047857]";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${styles}`}>
      {status || "Ready"}
    </span>
  );
}

export default function AccountingReportsV2() {
  const { addToast } = useToast();
  const { companyName } = useSettings();
  const company = companyName?.trim() || "My Company";

  const [rows, setRows] = useState(() => loadAccountingReports());
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(fyStartIso());
  const [dateTo, setDateTo] = useState(todayIso());
  const [sortId, setSortId] = useState("created-desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedTypes, setAppliedTypes] = useState([]);
  const [draftTypes, setDraftTypes] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [menuId, setMenuId] = useState(null);
  const [companyOpen, setCompanyOpen] = useState(false);

  const sortRef = useRef(null);
  const companyRef = useRef(null);

  const reload = () => setRows(loadAccountingReports());

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (!sortOpen && !companyOpen) return undefined;
    const onDoc = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
      if (companyRef.current && !companyRef.current.contains(e.target)) setCompanyOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [sortOpen, companyOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (appliedTypes.length && !appliedTypes.includes(r.type)) return false;
      if (dateFrom && r.to && r.to < dateFrom) return false;
      if (dateTo && r.from && r.from > dateTo) return false;
      if (!q) return true;
      return (
        String(r.referenceNo || "").toLowerCase().includes(q) ||
        String(r.name || "").toLowerCase().includes(q) ||
        String(r.type || "").toLowerCase().includes(q) ||
        String(r.status || "").toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      const ta = new Date(a.createdOn || 0).getTime();
      const tb = new Date(b.createdOn || 0).getTime();
      return sortId === "created-asc" ? ta - tb : tb - ta;
    });
    return list;
  }, [rows, search, appliedTypes, dateFrom, dateTo, sortId]);

  useEffect(() => {
    setPage(1);
  }, [search, appliedTypes, dateFrom, dateTo, sortId, pageSize]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openFilters = () => {
    setDraftTypes([...appliedTypes]);
    setFiltersOpen(true);
  };

  const handleDelete = (report) => {
    deleteAccountingReport(report.id);
    reload();
    addToast("Report deleted", "success");
  };

  return (
    <div className="min-h-full" style={{ background: PAGE_BG }}>
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-semibold tracking-tight text-[#1a1a1f]">
              Accounting Reports
            </h1>
            <span className="rounded bg-[#d4d4d8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              v2
            </span>
          </div>

          <div className="relative" ref={companyRef}>
            <button
              type="button"
              onClick={() => setCompanyOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-[#d0d0d8] bg-white px-3 py-2 text-[13px] font-medium text-[#1a1a1f] hover:bg-[#f7f7f9]"
            >
              <span
                className="grid h-7 w-7 place-items-center rounded-full text-[#1a1a1f]"
                style={{ background: "#F5C518" }}
              >
                <Building2 className="h-3.5 w-3.5" />
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
          <div className="flex flex-wrap items-center gap-2 border-b border-[#d0d0d8] px-4 py-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa5]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports…"
                className="w-full rounded-lg border border-[#d0d0d8] bg-[#f7f7f9] py-2.5 pl-9 pr-3 text-[13px] outline-none placeholder:text-[#a0a0ab] focus:border-[#6b4eff] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-[#d0d0d8] bg-white px-2.5 py-2 text-[13px]">
              <Calendar className="h-4 w-4 shrink-0 text-[#9a9aa5]" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[118px] bg-transparent outline-none"
              />
              <span className="text-[#9a9aa5]">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[118px] bg-transparent outline-none"
              />
            </div>

            <button
              type="button"
              onClick={openFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-[#d0d0d8] bg-[#f3f3f6] px-3.5 py-2.5 text-[13px] font-semibold text-[#1a1a1f] hover:bg-[#ececf0]"
            >
              <Filter className="h-4 w-4" />
              Filters
              {appliedTypes.length ? (
                <span className="rounded-full bg-[#6b4eff] px-1.5 text-[10px] font-bold text-white">
                  {appliedTypes.length}
                </span>
              ) : null}
            </button>

            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen((o) => !o)}
                className={`inline-flex items-center gap-2 rounded-lg border border-[#d0d0d8] px-3.5 py-2.5 text-[13px] font-semibold text-[#1a1a1f] ${
                  sortOpen ? "bg-[#e8e8ee]" : "bg-[#f3f3f6] hover:bg-[#ececf0]"
                }`}
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort By
              </button>
              {sortOpen ? (
                <div className="absolute right-0 z-30 mt-1 min-w-[280px] overflow-hidden rounded-lg border border-[#d0d0d8] bg-white py-1 shadow-lg">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortId(opt.id);
                        setSortOpen(false);
                      }}
                      className={`block w-full px-3.5 py-2.5 text-left text-[13px] hover:bg-[#f7f7f9] ${
                        sortId === opt.id ? "font-semibold text-[#6b4eff]" : "text-[#1a1a1f]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#d0d0d8] bg-[#fafafa] text-[#6b6b76]">
                  <th className="border-r border-[#e8e8ee] px-4 py-3 font-semibold">Reference No.</th>
                  <th className="border-r border-[#e8e8ee] px-4 py-3 font-semibold">Date Range</th>
                  <th className="border-r border-[#e8e8ee] px-4 py-3 font-semibold">Report Name</th>
                  <th className="border-r border-[#e8e8ee] px-4 py-3 font-semibold">Created On</th>
                  <th className="border-r border-[#e8e8ee] px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-[14px] text-[#8a8a96]">
                      No reports yet — generate one from the Balance Sheet or Profit &amp; Loss
                      page.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => (
                    <tr key={r.id} className="border-b border-[#e8e8ee] hover:bg-[#fafafa]">
                      <td className="border-r border-[#efeff4] px-4 py-3 font-medium text-[#1a1a1f]">
                        {r.referenceNo}
                      </td>
                      <td className="border-r border-[#efeff4] px-4 py-3 text-[#4a4a55]">
                        {formatSlash(r.from)} → {formatSlash(r.to)}
                      </td>
                      <td className="border-r border-[#efeff4] px-4 py-3">
                        <div className="font-medium text-[#1a1a1f]">{r.name}</div>
                        <div className="mt-0.5 text-[11px] text-[#9a9aa5]">{r.type}</div>
                      </td>
                      <td className="border-r border-[#efeff4] px-4 py-3 text-[#4a4a55]">
                        {formatCreated(r.createdOn)}
                      </td>
                      <td className="border-r border-[#efeff4] px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="relative px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setMenuId((id) => (id === r.id ? null : r.id))}
                          className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d0d8] text-[#6b6b76] hover:bg-[#f7f7f9]"
                          aria-label="Actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuId === r.id ? (
                          <RowMenu
                            report={r}
                            onDelete={handleDelete}
                            onClose={() => setMenuId(null)}
                          />
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#d0d0d8] px-4 py-3">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPage={setPage}
              onPageSize={(n) => {
                setPageSize(n);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          reload();
          addToast("Reports refreshed", "success");
        }}
        className="fixed bottom-6 right-6 z-30 grid h-11 w-11 place-items-center rounded-xl border border-[#d0d0d8] bg-white shadow-lg hover:bg-[#f7f7f9]"
        aria-label="Refresh reports"
        title="Refresh"
      >
        <RefreshCw className="h-5 w-5 text-[#2563eb]" />
      </button>

      <FiltersDrawer
        open={filtersOpen}
        draftTypes={draftTypes}
        onToggleType={(t) =>
          setDraftTypes((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
          )
        }
        onClear={() => setDraftTypes([])}
        onApply={() => {
          setAppliedTypes([...draftTypes]);
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}
