import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Clock, FileSearch, RefreshCw, Timer, XCircle } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import QualityFilters from "../../components/quality/QualityFilters";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { getIncomingEnriched, getIncomingSummary } from "../../api/qualityApi";
import { DEMO_INCOMING_LIST, DEMO_INCOMING_SUMMARY, QUALITY_FLOW, qcStatusColor } from "../../data/qualityMasterData";

function KpiCard({ label, value, icon: Icon, color, suffix }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}{suffix || ""}</p>
        </div>
        {Icon && <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5 text-white" /></div>}
      </div>
    </div>
  );
}

export default function IncomingInspection() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(DEMO_INCOMING_SUMMARY);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, listRes] = await Promise.allSettled([getIncomingSummary(), getIncomingEnriched()]);
      if (sumRes.status === "fulfilled" && sumRes.value?.data && Object.keys(sumRes.value.data).length > 0 && sumRes.value.data.todays_inspections > 0) {
        setSummary({ ...DEMO_INCOMING_SUMMARY, ...sumRes.value.data });
      } else {
        setSummary(DEMO_INCOMING_SUMMARY);
      }
      if (listRes.status === "fulfilled" && listRes.value?.data?.length > 0) {
        setRows(listRes.value.data);
      } else {
        setRows(DEMO_INCOMING_LIST);
      }
    } catch {
      setSummary(DEMO_INCOMING_SUMMARY);
      setRows(DEMO_INCOMING_LIST);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (q && ![r.inspection_number, r.vendor_name, r.material_name, r.po_reference].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      if (resultFilter && r.result !== resultFilter && r.status !== resultFilter) return false;
      return true;
    });
  }, [rows, search, resultFilter]);

  const columns = [
    { key: "inspection_number", label: "Inspection No" },
    { key: "po_reference", label: "PO" },
    { key: "vendor_name", label: "Vendor" },
    { key: "material_name", label: "Material" },
    { key: "batch_code", label: "Batch" },
    { key: "quantity", label: "Quantity" },
    { key: "inspector", label: "Inspector" },
    { key: "result", label: "Result", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${qcStatusColor(r.result)}`}>{r.result}</span> },
    { key: "status", label: "Status", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${qcStatusColor(r.status)}`}>{r.status}</span> },
    { key: "actions", label: "Action", render: (r) => r.attachment ? <span className="text-xs text-[#2563EB]">{r.attachment}</span> : <button type="button" className="text-xs font-semibold text-[#2563EB] hover:underline">Inspect</button> },
  ];

  if (loading) return <Loader label="Loading incoming inspections..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Incoming Inspection</h1>
          <p className="mt-1 text-sm text-slate-500">IQC for raw materials — PO, vendor, batch verification before inventory receipt.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Today's Inspections" value={summary.todays_inspections} icon={FileSearch} color="bg-blue-600" />
        <KpiCard label="Pending Inspection" value={summary.pending_inspection} icon={Clock} color="bg-orange-500" />
        <KpiCard label="Passed" value={summary.passed} icon={CheckCircle} color="bg-green-600" />
        <KpiCard label="Failed" value={summary.failed} icon={XCircle} color="bg-red-500" />
        <KpiCard label="Rejected Lots" value={summary.rejected_lots} icon={AlertCircle} color="bg-red-600" />
        <KpiCard label="Avg Inspection Time" value={summary.avg_inspection_time} suffix=" min" icon={Timer} color="bg-indigo-600" />
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-medium text-slate-600 sm:text-xs">
        {QUALITY_FLOW.map((s, i) => (
          <span key={s} className="flex items-center gap-1">
            <span className="rounded bg-white px-1.5 py-0.5 shadow-sm">{s}</span>
            {i < QUALITY_FLOW.length - 1 && <span className="text-slate-400">↓</span>}
          </span>
        ))}
      </div>

      <QualityFilters search={search} onSearchChange={setSearch} resultFilter={resultFilter} onResultFilterChange={setResultFilter} searchPlaceholder="Search inspection, vendor, material, PO..." />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <DataTable columns={columns} data={filtered} searchPlaceholder="" searchKeys={[]} />
      </div>
    </div>
  );
}
