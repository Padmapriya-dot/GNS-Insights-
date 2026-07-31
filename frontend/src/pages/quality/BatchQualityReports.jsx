import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CheckCircle, Layers, RefreshCw, RotateCcw, Trash2, XCircle } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import QualityFilters from "../../components/quality/QualityFilters";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { getBatchEnriched, getBatchSummary } from "../../api/qualityApi";
import { DEMO_BATCH_LIST, DEMO_BATCH_SUMMARY, formatPct } from "../../data/qualityMasterData";

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</p></div>
        {Icon && <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5 text-white" /></div>}
      </div>
    </div>
  );
}

const monthlyYield = [
  { month: "Jan", yield: 92, failures: 8 }, { month: "Feb", yield: 93, failures: 7 },
  { month: "Mar", yield: 93.5, failures: 6 }, { month: "Apr", yield: 94, failures: 6 },
  { month: "May", yield: 94.5, failures: 5 }, { month: "Jun", yield: 95, failures: 5 },
];

export default function BatchQualityReports() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(DEMO_BATCH_SUMMARY);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, listRes] = await Promise.allSettled([getBatchSummary(), getBatchEnriched()]);
      if (sumRes.status === "fulfilled" && sumRes.value?.data && Object.keys(sumRes.value.data).length > 0 && sumRes.value.data.total_batches > 0) {
        setSummary({ ...DEMO_BATCH_SUMMARY, ...sumRes.value.data });
      } else {
        setSummary(DEMO_BATCH_SUMMARY);
      }
      if (listRes.status === "fulfilled" && listRes.value?.data?.length > 0) {
        setRows(listRes.value.data);
      } else {
        setRows(DEMO_BATCH_LIST);
      }
    } catch {
      setSummary(DEMO_BATCH_SUMMARY);
      setRows(DEMO_BATCH_LIST);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (q && ![r.batch_code, r.product_name, r.inspector].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      if (resultFilter === "pass" && r.yield_pct < 95) return false;
      if (resultFilter === "fail" && r.yield_pct >= 95) return false;
      return true;
    });
  }, [rows, search, resultFilter]);

  const columns = [
    { key: "batch_code", label: "Batch" },
    { key: "product_name", label: "Product" },
    { key: "shift", label: "Shift" },
    { key: "production_qty", label: "Production Qty" },
    { key: "pass_qty", label: "Pass Qty" },
    { key: "reject_qty", label: "Reject Qty" },
    { key: "yield_pct", label: "Yield", render: (r) => <span className={r.yield_pct >= 95 ? "font-semibold text-green-700" : r.yield_pct >= 90 ? "font-semibold text-orange-600" : "font-semibold text-red-600"}>{formatPct(r.yield_pct)}</span> },
    { key: "inspector", label: "Inspector" },
    { key: "report_date", label: "Date", render: (r) => String(r.report_date || "").slice(0, 10) },
  ];

  if (loading) return <Loader label="Loading batch reports..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Batch Quality Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Batch-wise yield, rejection, and quality trend analysis.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Batches" value={summary.total_batches} icon={Layers} color="bg-blue-600" />
        <KpiCard label="Passed" value={summary.passed} icon={CheckCircle} color="bg-green-600" />
        <KpiCard label="Failed" value={summary.failed} icon={XCircle} color="bg-red-500" />
        <KpiCard label="Yield %" value={formatPct(summary.yield_pct)} icon={CheckCircle} color="bg-teal-600" />
        <KpiCard label="Scrap %" value={formatPct(summary.scrap_pct)} icon={Trash2} color="bg-red-600" />
        <KpiCard label="Rework %" value={formatPct(summary.rework_pct)} icon={RotateCcw} color="bg-amber-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Monthly Yield</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyYield}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[85, 100]} />
                <Tooltip />
                <Bar dataKey="yield" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Batch Quality Trend</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyYield}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="yield" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Failure / Rejection Trend</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyYield}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="failures" name="Failures" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <QualityFilters search={search} onSearchChange={setSearch} resultFilter={resultFilter} onResultFilterChange={setResultFilter} searchPlaceholder="Search batch, product, inspector..." />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <DataTable columns={columns} data={filtered} searchPlaceholder="" searchKeys={[]} />
      </div>
    </div>
  );
}
