import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, FileText, Filter, Plus, RefreshCw } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import ManufacturingWorkflowBar from "../../components/manufacturing/ManufacturingWorkflowBar";
import CreateQuotationModal from "../../components/sales/CreateQuotationModal";
import QuoteDetailModal from "../../components/sales/QuoteDetailModal";
import { useToast } from "../../context/ToastContext";
import useTenantId from "../../hooks/useTenantId";
import { getQuotationSummary, getQuotationsEnriched, updateQuotationStatus, createQuotation } from "../../api/salesApi";
import { DEMO_QUOTE_LIST, formatInr, statusColor } from "../../data/salesMasterData";
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
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const tenantId = useTenantId();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "true" || window.location.pathname.endsWith("/create")) {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
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

  useEffect(() => { load(); }, [load]);

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

  const handleStatus = async (quote, status) => {
    if (typeof quote.id === "number") {
      try {
        await updateQuotationStatus(quote.id, status);
        addToast(`Quotation marked as ${status}`);
      } catch (err) {
        addToast(err.response?.data?.detail || "Update failed", "error");
      }
    } else {
      addToast(`Quotation status updated to ${status}`);
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

  if (loading) return <Loader label="Loading quotations..." />;

  return (
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
            {["draft", "sent", "accepted", "rejected", "expired"].map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
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
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={load}
      />
    </div>
  );
}
