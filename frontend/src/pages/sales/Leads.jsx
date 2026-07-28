import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, LayoutGrid, List, Plus, RefreshCw, Target, TrendingUp, UserPlus, Users, XCircle } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import CreateLeadModal from "../../components/sales/CreateLeadModal";
import LeadDetailModal from "../../components/sales/LeadDetailModal";
import { useToast } from "../../context/ToastContext";
import useTenantId from "../../hooks/useTenantId";
import {
  convertLeadToQuotation,
  createLead,
  getLeadSummary,
  getLeadsEnriched,
  updateLeadStatus,
} from "../../api/salesApi";
import {
  DEMO_LEAD_LIST,
  DEMO_LEAD_SUMMARY,
  KANBAN_COLUMNS,
  LEAD_INDUSTRIES,
  LEAD_REGIONS,
  LEAD_SOURCES,
  formatInr,
  priorityColor,
  statusColor,
} from "../../data/salesMasterData";

function KpiCard({ label, value, icon: Icon, color, suffix }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{value}{suffix || ""}</p>
        </div>
        {Icon && <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5 text-white" /></div>}
      </div>
    </div>
  );
}

const defaultFilters = { sales_executive: "", source: "", industry: "", region: "", status: "", priority: "" };

export default function Leads() {
  const { addToast } = useToast();
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(DEMO_LEAD_SUMMARY);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState(null);
  const [converting, setConverting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, listRes] = await Promise.allSettled([getLeadSummary(), getLeadsEnriched()]);
      if (sumRes.status === "fulfilled" && sumRes.value?.data) setSummary({ ...DEMO_LEAD_SUMMARY, ...sumRes.value.data });
      if (listRes.status === "fulfilled" && listRes.value?.data?.length) setRows(listRes.value.data);
      else setRows([]);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = rows;
    Object.entries(filters).forEach(([k, v]) => {
      if (!v) return;
      list = list.filter((r) => String(r[k] || "").toLowerCase().includes(v.toLowerCase()));
    });
    return list;
  }, [rows, filters]);

  const handleStatus = async (lead, status) => {
    if (typeof lead.id === "number") {
      try {
        await updateLeadStatus(lead.id, status);
        addToast("Lead updated");
        load();
      } catch (err) {
        addToast(err.response?.data?.detail || "Update failed", "error");
        return;
      }
    } else {
      addToast(`Lead marked as ${status} (demo)`);
    }
    setSelected(null);
  };

  const handleCreateLead = async (payload) => {
    setSaving(true);
    try {
      await createLead({
        ...payload,
        tenant_id: tenantId,
      });
      addToast("Lead created successfully", "success");
      setShowCreate(false);
      await load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Could not create lead", "error");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToQuotation = async (lead) => {
    if (typeof lead.id !== "number") {
      addToast("Convert is available for live leads only", "error");
      return;
    }
    setConverting(true);
    try {
      const res = await convertLeadToQuotation(lead.id);
      const quote = res?.data;
      addToast(`Quotation ${quote?.quote_number || ""} created from lead`, "success");
      setSelected(null);
      navigate("/sales/quotations");
    } catch (err) {
      addToast(err.response?.data?.detail || "Convert failed", "error");
    } finally {
      setConverting(false);
    }
  };

  const columns = [
    { key: "lead_id", label: "Lead ID" },
    { key: "customer_name", label: "Customer" },
    { key: "company", label: "Company" },
    { key: "contact", label: "Contact" },
    { key: "source", label: "Source" },
    { key: "sales_executive", label: "Sales Executive" },
    { key: "priority", label: "Priority", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${priorityColor(r.priority)}`}>{r.priority}</span> },
    { key: "next_followup", label: "Next Follow-up", render: (r) => String(r.next_followup || "").slice(0, 10) || "—" },
    { key: "status", label: "Status", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(r.status)}`}>{r.status}</span> },
    { key: "actions", label: "Actions", render: (r) => (
      <button type="button" onClick={() => setSelected(r)} className="text-xs font-semibold text-[#2563EB] hover:underline">View</button>
    )},
  ];

  if (loading) return <Loader label="Loading leads..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads (CRM)</h1>
          <p className="mt-1 text-sm text-slate-500">Enterprise CRM pipeline with Kanban view, 360° lead profile, and opportunity tracking.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowCreate(true)} className="ui-btn-primary">
            <Plus className="h-4 w-4" /> New Lead
          </button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Leads" value={summary.total_leads} icon={Users} color="bg-blue-600" />
        <KpiCard label="New Leads" value={summary.new_leads} icon={UserPlus} color="bg-indigo-600" />
        <KpiCard label="Qualified" value={summary.qualified_leads} icon={Target} color="bg-purple-600" />
        <KpiCard label="Won Customers" value={summary.won_customers} icon={TrendingUp} color="bg-green-600" />
        <KpiCard label="Lost Leads" value={summary.lost_leads} icon={XCircle} color="bg-red-500" />
        <KpiCard label="Conversion Rate" value={summary.conversion_rate} suffix="%" icon={TrendingUp} color="bg-teal-600" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
        {["Lead", "Qualification", "Opportunity", "Quotation", "Sales Order"].map((s, i, arr) => (
          <span key={s} className="flex items-center gap-2">
            <span className="rounded-lg bg-white px-2 py-1 shadow-sm">{s}</span>
            {i < arr.length - 1 && <span className="text-slate-400">↓</span>}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><Filter className="h-4 w-4" /> Advanced Filters</button>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
            <button type="button" onClick={() => setView("table")} className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${view === "table" ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500"}`}><List className="h-3.5 w-3.5" /> Table</button>
            <button type="button" onClick={() => setView("kanban")} className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${view === "kanban" ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500"}`}><LayoutGrid className="h-3.5 w-3.5" /> Kanban</button>
          </div>
        </div>

        {showAdvanced && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input value={filters.sales_executive} onChange={(e) => setFilters({ ...filters, sales_executive: e.target.value })} placeholder="Sales Executive" className="rounded-lg border px-3 py-2 text-sm" />
            <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">All Sources</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.industry} onChange={(e) => setFilters({ ...filters, industry: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">All Industries</option>
              {LEAD_INDUSTRIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.region} onChange={(e) => setFilters({ ...filters, region: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">All Regions</option>
              {LEAD_REGIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">All Status</option>
              {["new", "contacted", "qualified", "converted", "lost"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">All Priority</option>
              {["urgent", "high", "medium", "low"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {view === "table" ? (
          <DataTable columns={columns} data={filtered} searchPlaceholder="Search leads..." searchKeys={["customer_name", "company", "sales_executive"]} />
        ) : (
          <div className="grid gap-4 overflow-x-auto lg:grid-cols-5">
            {KANBAN_COLUMNS.map((col) => (
              <div key={col.id} className={`min-w-[200px] rounded-xl border p-3 ${col.color}`}>
                <p className="mb-2 text-xs font-bold uppercase text-slate-600">{col.label}</p>
                <div className="space-y-2">
                  {filtered.filter((r) => r.status === col.id).map((r) => (
                    <button key={r.lead_id} type="button" onClick={() => setSelected(r)} className="w-full rounded-lg bg-white p-3 text-left shadow-sm hover:shadow">
                      <p className="text-sm font-semibold text-slate-800">{r.customer_name}</p>
                      <p className="text-xs text-slate-500">{r.company}</p>
                      {r.opportunity_value && <p className="mt-1 text-xs font-bold text-[#2563EB]">{formatInr(r.opportunity_value)}</p>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <LeadDetailModal
          lead={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatus}
          onConvertToQuotation={handleConvertToQuotation}
          converting={converting}
        />
      )}

      <CreateLeadModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateLead}
        saving={saving}
      />
    </div>
  );
}
