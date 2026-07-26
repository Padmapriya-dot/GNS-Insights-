import { useCallback, useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import * as XLSX from "xlsx";
import { FileText, IndianRupee, RefreshCw } from "lucide-react";

import ExportButtons from "../../components/finance/ExportButtons";
import FinanceFilters from "../../components/finance/FinanceFilters";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { getGSTExtended } from "../../api/accountsApi";
import { GST_REPORTS, formatInr } from "../../data/financeMasterData";

const PIE_COLORS = ["#2563EB", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const EMPTY_GST = {
  sgst: 0, cgst: 0, igst: 0, total_gst: 0,
  taxable_value: 0, gst_payable: 0, gst_receivable: 0,
  monthly_collection: [], gst_trend: [],
  gst_by_customer: [], gst_by_product: [],
};

function KpiCard({ label, value, icon: Icon, color, highlight }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${highlight ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-medium ${highlight ? "text-blue-700" : "text-slate-500"}`}>{label}</p>
          <p className={`mt-1 text-xl font-bold tabular-nums ${highlight ? "text-blue-900" : "text-slate-900"}`}>{value}</p>
        </div>
        {Icon && <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5 text-white" /></div>}
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <svg className="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

export default function TaxReports() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [financialYear, setFinancialYear] = useState("2025-26");
  const [month, setMonth] = useState("All Months");
  const [branch, setBranch] = useState("");
  const [activeReport, setActiveReport] = useState("GSTR-3B");
  const [data, setData] = useState(EMPTY_GST);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGSTExtended(year);
      if (res?.data && typeof res.data === "object") {
        setData({ ...EMPTY_GST, ...res.data });
      } else {
        setData(EMPTY_GST);
      }
    } catch {
      setData(EMPTY_GST);
      addToast("Failed to load GST report data", "error");
    } finally {
      setLoading(false);
    }
  }, [year, addToast]);

  useEffect(() => { load(); }, [load]);

  const hasMonthly = data.monthly_collection?.some((m) => m.amount > 0);
  const hasTrend   = data.gst_trend?.some((m) => m.sgst > 0 || m.cgst > 0 || m.igst > 0);
  const hasByCustomer = (data.gst_by_customer?.length ?? 0) > 0;
  const hasByProduct  = (data.gst_by_product?.length ?? 0) > 0;

  const exportExcel = () => {
    const rows = [
      ["GST Report", year],
      ["SGST", data.sgst], ["CGST", data.cgst], ["IGST", data.igst],
      ["Total GST", data.total_gst], ["Taxable Value", data.taxable_value],
      ["GST Payable", data.gst_payable], ["GST Receivable", data.gst_receivable],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GST Report");
    XLSX.writeFile(wb, `GST_Report_${year}.xlsx`);
  };

  if (loading) return <Loader label="Loading GST reports..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GST Reports</h1>
          <p className="mt-1 text-sm text-slate-500">GSTR-1, GSTR-2B, GSTR-3B, GSTR-9, HSN &amp; SAC summaries with trend analysis.</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons onExcel={exportExcel} />
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="SGST"           value={formatInr(data.sgst)}           icon={IndianRupee} color="bg-indigo-600" />
        <KpiCard label="CGST"           value={formatInr(data.cgst)}           icon={IndianRupee} color="bg-purple-600" />
        <KpiCard label="IGST"           value={formatInr(data.igst)}           icon={IndianRupee} color="bg-pink-600" />
        <KpiCard label="Total GST"      value={formatInr(data.total_gst)}      icon={IndianRupee} color="bg-blue-600" highlight />
        <KpiCard label="Taxable Value"  value={formatInr(data.taxable_value)}  icon={FileText}    color="bg-slate-600" />
        <KpiCard label="GST Payable"    value={formatInr(data.gst_payable)}    icon={IndianRupee} color="bg-red-500" />
        <KpiCard label="GST Receivable" value={formatInr(data.gst_receivable)} icon={IndianRupee} color="bg-green-600" />
      </div>

      <FinanceFilters
        search={search} onSearchChange={setSearch}
        financialYear={financialYear} onFinancialYearChange={setFinancialYear}
        month={month} onMonthChange={setMonth}
        branch={branch} onBranchChange={setBranch}
        searchPlaceholder="Search GSTIN, customer..."
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {[2026, 2025, 2024, 2023].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </FinanceFilters>

      {/* Report tabs */}
      <div className="flex flex-wrap gap-2">
        {GST_REPORTS.map((r) => (
          <button key={r} type="button" onClick={() => setActiveReport(r)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeReport === r ? "bg-[#2563EB] text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-semibold text-slate-900">{activeReport}</h2>
        <p className="text-sm text-slate-500">
          Summary for FY {financialYear} —{" "}
          {data.total_gst > 0
            ? `${formatInr(data.total_gst)} total GST collected.`
            : "No GST data available. Invoices with GST will appear here once synced from the API."}
        </p>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Monthly GST Collection</h2>
          <div className="h-52">
            {hasMonthly ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly_collection}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatInr(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatInr(v)} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No GST monthly data — invoices with GST will appear here" />}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">GST Trend (SGST / CGST / IGST)</h2>
          <div className="h-52">
            {hasTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.gst_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatInr(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatInr(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="sgst" name="SGST" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cgst" name="CGST" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="igst" name="IGST" stroke="#ec4899" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No GST trend data available yet" />}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">GST by Customer</h2>
          <div className="h-52">
            {hasByCustomer ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.gst_by_customer} dataKey="gst" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                    {data.gst_by_customer.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatInr(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No customer GST data available yet" />}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">GST by Product</h2>
          <div className="h-52">
            {hasByProduct ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gst_by_product} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => formatInr(v)} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatInr(v)} />
                  <Bar dataKey="gst" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No product GST data available yet" />}
          </div>
        </div>
      </div>
    </div>
  );
}
