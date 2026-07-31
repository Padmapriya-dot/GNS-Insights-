import { Search } from "lucide-react";
import { BRANCHES, FINANCIAL_YEARS } from "../../data/financeMasterData";

const MONTHS = [
  "All Months", "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March",
];

export default function FinanceFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions = ["All", "Pending", "Due", "Overdue", "Paid"],
  vendorFilter,
  onVendorFilterChange,
  vendors = [],
  financialYear,
  onFinancialYearChange,
  month,
  onMonthChange,
  branch,
  onBranchChange,
  searchPlaceholder = "Search...",
  children,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3.5">
        <div className="flex-1 min-w-[220px]">
          <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {onStatusChange && (
          <div className="w-full sm:w-auto min-w-[140px]">
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
            <select
              value={status || "All"}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All Statuses" : s.toUpperCase()}</option>
              ))}
            </select>
          </div>
        )}

        {onVendorFilterChange && (
          <div className="w-full sm:w-auto min-w-[160px]">
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor / Supplier</label>
            <select
              value={vendorFilter || ""}
              onChange={(e) => onVendorFilterChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id || v.name} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="w-full sm:w-auto min-w-[130px]">
          <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Financial Year</label>
          <select
            value={financialYear || "All Years"}
            onChange={(e) => onFinancialYearChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All Years">All Financial Years</option>
            {FINANCIAL_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto min-w-[130px]">
          <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</label>
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {onBranchChange && (
          <div className="w-full sm:w-auto min-w-[140px]">
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch</label>
            <select
              value={branch || ""}
              onChange={(e) => onBranchChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Branches</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}

        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
