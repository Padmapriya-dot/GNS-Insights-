import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Pause,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import BatchDetailModal from "../../components/production/BatchDetailModal";
import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { getBatchDetail, getBatchSummary, getBatchesEnriched } from "../../api/productionApi";
import {
  BATCH_TRACE_STEPS,
  DEMO_BATCH_DETAIL,
  DEMO_BATCH_SUMMARY,
  DEMO_BATCHES,
  batchStatusColor,
} from "../../data/batchTrackingMasterData";
import { exportToExcel } from "../../utils/exportUtils";

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BatchTracking() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(DEMO_BATCH_SUMMARY);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, listRes] = await Promise.allSettled([
        getBatchSummary(),
        getBatchesEnriched(),
      ]);
      if (sumRes.status === "fulfilled" && sumRes.value?.data) {
        setSummary({ ...DEMO_BATCH_SUMMARY, ...sumRes.value.data });
      }
      if (listRes.status === "fulfilled" && listRes.value?.data?.length) {
        setBatches(listRes.value.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return batches;
    const q = search.toLowerCase();
    return batches.filter((b) =>
      [b.batch_code, b.product_name, b.work_order_number, b.status]
        .some((v) => v && String(v).toLowerCase().includes(q))
    );
  }, [batches, search]);

  const openDetail = async (row) => {
    if (typeof row.id === "number") {
      try {
        const res = await getBatchDetail(row.id);
        setSelected(res.data);
        return;
      } catch {
        addToast("Could not load batch detail", "error");
      }
    }
    setSelected({ ...row, batch_code: row.batch_code });
  };

  const columns = [
    { key: "batch_code", label: "Batch" },
    { key: "product_name", label: "Product" },
    { key: "work_order_number", label: "Work Order", render: (r) => r.work_order_number || "—" },
    { key: "production_date", label: "Production Date", render: (r) => formatDate(r.production_date) },
    { key: "quantity", label: "Qty" },
    { key: "good_qty", label: "Good Qty" },
    { key: "scrap_qty", label: "Scrap" },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${batchStatusColor(r.status)}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (r) => (
        <button type="button" onClick={() => openDetail(r)} className="text-xs font-semibold text-[#2563EB] hover:underline">
          View
        </button>
      ),
    },
  ];

  const handleExport = () => {
    exportToExcel(filtered, columns.filter((c) => !c.render), "batch-tracking");
    addToast("Exported", "success");
  };

  if (loading) return <Loader label={t("production.loadingBatches")} />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("production.batchTracking")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Full batch traceability from raw material to customer dispatch.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total Batches" value={summary.total_batches} icon={Search} color="bg-[#2563EB]" />
        <SummaryCard label="Running" value={summary.running} icon={Clock} color="bg-green-500" />
        <SummaryCard label="Completed" value={summary.completed} icon={CheckCircle2} color="bg-emerald-500" />
        <SummaryCard label="Hold" value={summary.hold} icon={Pause} color="bg-amber-500" />
        <SummaryCard label="Rejected" value={summary.rejected} icon={XCircle} color="bg-red-500" />
        <SummaryCard label="Expired" value={summary.expired} icon={AlertTriangle} color="bg-slate-500" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <input
            type="search"
            placeholder="Search batch, product, work order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          searchKeys={["batch_code", "product_name", "work_order_number"]}
          showSearch={false}
        />
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 px-4 py-3">
        {BATCH_TRACE_STEPS.map((step, i) => (
          <span key={step} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-amber-600">{step}</span>
            {i < BATCH_TRACE_STEPS.length - 1 && <span className="text-slate-300">↓</span>}
          </span>
        ))}
      </div>

      {selected && <BatchDetailModal batch={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
