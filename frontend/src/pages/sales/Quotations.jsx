import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, Filter, Plus, RefreshCw } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import ManufacturingWorkflowBar from "../../components/manufacturing/ManufacturingWorkflowBar";
import CreateQuotationModal from "../../components/sales/CreateQuotationModal";
import QuoteDetailModal from "../../components/sales/QuoteDetailModal";
import { useToast } from "../../context/ToastContext";
import useTenantId from "../../hooks/useTenantId";
import {
  createQuotation,
  getQuotationSummary,
  getQuotationsEnriched,
  updateQuotationStatus,
} from "../../api/salesApi";
import { formatInr, statusColor } from "../../data/salesMasterData";
import { exportToExcel } from "../../utils/exportUtils";

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div>
        {Icon && <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5 text-white" /></div>}
      </div>
    </div>
  );
}

export default function Quotations() {
  const { addToast } = useToast();
  const tenantId = useTenantId();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, listRes] = await Promise.allSettled([getQuotationSummary(), getQuotationsEnriched()]);
      if (sumRes.status === "fulfilled" && sumRes.value?.data) setSummary(sumRes.value.data);
      else setSummary({});
      if (listRes.status === "fulfilled") setRows(listRes.value?.data || []);
      else setRows([]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const handleCreateQuotation = async (payload) => {
    setSaving(true);
    try {
      await createQuotation({
        ...payload,
        tenant_id: tenantId,
      });
      addToast("Quotation created successfully", "success");
      setShowCreate(false);
      await load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Could not create quotation", "error");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (quote, status) => {
    if (typeof quote.id === "number") {
      try {
        await updateQuotationStatus(quote.id, status);
        addToast(`Quotation marked as ${status}`);
        load();
      } catch (err) {
        addToast(err.response?.data?.detail || "Update failed", "error");
        return;
      }
    } else {
      addToast(`Quotation marked as ${status} (demo)`);
    }
    setSelected(null);
  };

  const columns = [
    { key: "quote_number", label: "Quote No", render: (r) => <span className="font-medium text-[#2563EB]">{r.quote_number}</span> },
    { key: "customer_name", label: "Customer" },
    { key: "sales_person", label: "Sales Person" },
    { key: "amount", label: "Amount", render: (r) => formatInr(r.amount) },
    { key: "valid_until", label: "Valid Until", render: (r) => String(r.valid_until || "").slice(0, 10) || "—" },
    { key: "status", label: "Status", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(r.status)}`}>{r.status}</span> },
    { key: "actions", label: "Actions", render: (r) => (
      <button type="button" onClick={() => setSelected(r)} className="text-xs font-semibold text-[#2563EB] hover:underline">View</button>
    )},
  ];

  if (loading) return <Loader label="Loading quotations..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
          <p className="mt-1 text-sm text-slate-500">Create, approve, and send quotations with GST, discount, and PDF export.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowCreate(true)} className="ui-btn-primary">
            <Plus className="h-4 w-4" /> New Quotation
          </button>
          <button type="button" onClick={() => exportToExcel(filtered, columns.filter((c) => !c.render), "quotations")} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" /> Export</button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>
      </header>

      <ManufacturingWorkflowBar currentStepId="quotation" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Quotations" value={summary.total_quotations ?? 0} icon={FileText} color="bg-blue-600" />
        <KpiCard label="Draft" value={summary.draft ?? 0} icon={FileText} color="bg-slate-500" />
        <KpiCard label="Sent" value={summary.sent ?? 0} icon={FileText} color="bg-indigo-600" />
        <KpiCard label="Accepted" value={summary.accepted ?? 0} icon={FileText} color="bg-green-600" />
        <KpiCard label="Rejected" value={summary.rejected ?? 0} icon={FileText} color="bg-red-500" />
        <KpiCard label="Expired" value={summary.expired ?? 0} icon={FileText} color="bg-orange-500" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">All Status</option>
            {["draft", "sent", "accepted", "rejected", "expired", "pending_approval", "approved"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <DataTable columns={columns} data={filtered} searchPlaceholder="Search quote, customer..." searchKeys={["quote_number", "customer_name", "sales_person"]} />
      </div>

      {selected && (
        <QuoteDetailModal
          quote={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatus}
          onConverted={() => {
            addToast("Quotation converted to sales order", "success");
            load();
          }}
        />
      )}

      <CreateQuotationModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateQuotation}
        saving={saving}
      />
    </div>
  );
}
