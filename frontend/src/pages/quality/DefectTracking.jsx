import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, ClipboardList, RefreshCw, User } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import QualityFilters from "../../components/quality/QualityFilters";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { getDefectsEnriched, getDefectSummary, updateDefectStatus } from "../../api/qualityApi";
import { DEFECT_WORKFLOW, DEMO_DEFECT_LIST, DEMO_DEFECT_SUMMARY, qcStatusColor, severityColor } from "../../data/qualityMasterData";

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

const STATUS_NEXT = {
  open: "assigned",
  new: "assigned",
  assigned: "in_progress",
  in_progress: "verification",
  verification: "resolved",
  resolved: "closed",
};

export default function DefectTracking() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(DEMO_DEFECT_SUMMARY);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const emptySummary = { total_defects: 0, critical: 0, major: 0, minor: 0, defect_rate: "0%", top_cause: "None" };
      if (sumRes.status === "fulfilled" && sumRes.value?.data && Object.keys(sumRes.value.data).length > 0) {
        setSummary({ ...emptySummary, ...sumRes.value.data });
      } else {
        setSummary(emptySummary);
      }
      if (listRes.status === "fulfilled" && listRes.value?.data) {
        setRows(listRes.value.data);
      } else {
        setRows([]);
      }
    } catch {
      setSummary({ total_defects: 0, critical: 0, major: 0, minor: 0, defect_rate: "0%", top_cause: "None" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (q && ![r.defect_code, r.description, r.product_name, r.root_cause].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      if (resultFilter && r.status !== resultFilter && r.severity !== resultFilter) return false;
      return true;
    });
  }, [rows, search, resultFilter]);

  const advanceStatus = async (row) => {
    const next = STATUS_NEXT[row.status];
    if (!next) return;
    try {
      await updateDefectStatus(row.id, next);
      addToast(`Defect moved to ${next.replace("_", " ")}`);
      load();
    } catch {
      addToast("Status update failed", "error");
    }
  };

  const columns = [
    { key: "defect_code", label: "Defect ID" },
    { key: "description", label: "Description" },
    { key: "product_name", label: "Product" },
    { key: "batch_code", label: "Batch" },
    { key: "machine_name", label: "Machine" },
    { key: "department", label: "Department" },
    { key: "root_cause", label: "Root Cause" },
    { key: "corrective_action", label: "Corrective Action (CAPA)" },
    { key: "preventive_action", label: "Preventive Action" },
    { key: "assigned_to", label: "Assigned To" },
    { key: "due_date", label: "Due Date", render: (r) => String(r.due_date || "").slice(0, 10) },
    { key: "attachment", label: "Attachment", render: (r) => r.attachment ? <span className="text-xs text-[#2563EB]">{r.attachment}</span> : "—" },
    { key: "severity", label: "Severity", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${severityColor(r.severity)}`}>{r.severity}</span> },
    { key: "status", label: "Status", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${qcStatusColor(r.status)}`}>{r.status.replace("_", " ")}</span> },
    {
      key: "actions", label: "Action",
      render: (r) => STATUS_NEXT[r.status] ? (
        <button type="button" onClick={() => advanceStatus(r)} className="text-xs font-semibold text-[#2563EB] hover:underline capitalize">
          → {STATUS_NEXT[r.status].replace("_", " ")}
        </button>
      ) : <span className="text-xs text-slate-400">Closed</span>,
    },
  ];

  if (loading) return <Loader label="Loading defect tracking..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Defect Tracking & CAPA</h1>
          <p className="mt-1 text-sm text-slate-500">Non-conformance, root cause analysis, corrective/preventive actions, and NCR workflow.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Defects" value={summary.total_defects} icon={ClipboardList} color="bg-blue-600" />
        <KpiCard label="Open" value={summary.open} icon={AlertTriangle} color="bg-orange-500" />
        <KpiCard label="In Progress" value={summary.in_progress} icon={User} color="bg-indigo-600" />
        <KpiCard label="Resolved" value={summary.resolved} icon={CheckCircle} color="bg-green-600" />
        <KpiCard label="Critical" value={summary.critical} icon={AlertTriangle} color="bg-red-600" />
        <KpiCard label="CAPA Pending" value={summary.capa_pending} icon={ClipboardList} color="bg-amber-500" />
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-medium text-slate-600 sm:text-xs">
        {DEFECT_WORKFLOW.map((s, i) => (
          <span key={s} className="flex items-center gap-1">
            <span className="rounded bg-white px-1.5 py-0.5 shadow-sm">{s}</span>
            {i < DEFECT_WORKFLOW.length - 1 && <span className="text-slate-400">↓</span>}
          </span>
        ))}
      </div>

      <QualityFilters search={search} onSearchChange={setSearch} resultFilter={resultFilter} onResultFilterChange={setResultFilter} searchPlaceholder="Search defect, product, root cause..." />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        <DataTable columns={columns} data={filtered} searchPlaceholder="" searchKeys={[]} />
      </div>
    </div>
  );
}
