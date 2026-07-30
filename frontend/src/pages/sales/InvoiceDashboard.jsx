import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, IndianRupee, Plus, RefreshCw } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import ManufacturingWorkflowBar from "../../components/manufacturing/ManufacturingWorkflowBar";
import TaxInvoiceCopy from "../../components/sales/TaxInvoiceCopy";
import { useToast } from "../../context/ToastContext";
import { getInvoiceDetail, getInvoiceSummary, getInvoicesEnriched } from "../../api/salesApi";
import { useCompanySettings } from "../../hooks/useCompanySettings";
import { formatInr, statusColor } from "../../data/salesMasterData";
import { mapDetailToInvoiceCopy } from "../../utils/invoiceCopyData";
import useManufacturingRefresh from "../../hooks/useManufacturingRefresh";

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value ?? 0}</p>
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

const emptySummary = {
  total_invoices: 0,
  draft: 0,
  paid: 0,
  pending: 0,
  overdue: 0,
  revenue: 0,
};

export default function InvoiceDashboard() {
  const { settings } = useCompanySettings();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(emptySummary);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState("table");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, listRes] = await Promise.allSettled([
        getInvoiceSummary(),
        getInvoicesEnriched(),
      ]);
      if (sumRes.status === "fulfilled" && sumRes.value?.data) {
        setSummary({ ...emptySummary, ...sumRes.value.data });
      } else setSummary(emptySummary);
      if (listRes.status === "fulfilled") setRows(listRes.value?.data || []);
      else setRows([]);
    } catch {
      addToast("Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);
  useManufacturingRefresh(load);

  useEffect(() => {
    if (selected && typeof selected === "number") {
      getInvoiceDetail(selected)
        .then((r) => setDetail(r.data))
        .catch(() => setDetail(null));
    } else {
      setDetail(null);
    }
  }, [selected]);

  const filtered = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const copyData = useMemo(() => {
    if (!detail?.invoice) return null;
    return mapDetailToInvoiceCopy(detail, settings || {});
  }, [detail, settings]);

  const columns = [
    {
      key: "invoice_number",
      label: "Invoice No",
      render: (r) => (
        <span className="font-medium text-[#2563EB]">{r.invoice_number}</span>
      ),
    },
    { key: "customer_name", label: "Customer" },
    { key: "sales_order_number", label: "Sales Order" },
    { key: "amount", label: "Amount", render: (r) => formatInr(r.amount) },
    { key: "gst_amount", label: "Goods & Services Tax (GST)", render: (r) => formatInr(r.gst_amount) },
    {
      key: "due_date",
      label: "Due Date",
      render: (r) => String(r.due_date || "").slice(0, 10) || "—",
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(r.status)}`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setSelected(r.id);
              setView("copy");
            }}
            className="text-xs font-semibold text-[#2563EB] hover:underline"
          >
            View
          </button>
          {typeof r.id === "number" && (
            <>
              <Link
                to={`/sales/invoices/${r.id}/copy`}
                className="text-xs text-slate-600 hover:underline"
              >
                Print
              </Link>
              {r.status !== "paid" && (
                <Link
                  to={`/sales/payments/create?invoice_id=${r.id}`}
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  Pay
                </Link>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <Loader label="Loading invoices..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tax invoices post AR journal entries and link to sales orders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/sales/invoices/create" className="ui-btn-primary">
            <Plus className="h-4 w-4" /> New Invoice
          </Link>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <ManufacturingWorkflowBar currentStepId="invoice" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Invoices" value={summary.total_invoices} icon={FileText} color="bg-blue-600" />
        <KpiCard label="Draft" value={summary.draft} icon={FileText} color="bg-slate-500" />
        <KpiCard label="Paid" value={summary.paid} icon={FileText} color="bg-green-600" />
        <KpiCard label="Pending" value={summary.pending} icon={FileText} color="bg-amber-500" />
        <KpiCard label="Overdue" value={summary.overdue} icon={FileText} color="bg-red-500" />
        <KpiCard label="Revenue" value={formatInr(summary.revenue)} icon={IndianRupee} color="bg-emerald-600" />
      </div>

      <div className="flex gap-1 self-start rounded-lg bg-slate-100 p-0.5">
        <button
          type="button"
          onClick={() => setView("table")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === "table" ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500"}`}
        >
          Table
        </button>
        <button
          type="button"
          onClick={() => setView("copy")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === "copy" ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500"}`}
        >
          Invoice Copy
        </button>
      </div>

      {view === "table" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              {["draft", "issued", "sent", "paid", "partial", "overdue"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <DataTable
            columns={columns}
            data={filtered}
            searchPlaceholder="Search invoice, customer..."
            searchKeys={["invoice_number", "customer_name", "sales_order_number"]}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="max-h-[calc(100vh-320px)] space-y-2 overflow-y-auto">
              {filtered.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => setSelected(inv.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${selected === inv.id ? "border-[#2563EB] bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <p className="font-semibold text-slate-800">{inv.customer_name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <span className="font-medium text-[#2563EB]">{inv.invoice_number}</span>
                  </p>
                  <p className="mt-1 text-sm font-bold">{formatInr(inv.amount)}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor(inv.status)}`}
                  >
                    {inv.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {selected ? (
              <>
                <div className="mb-4 flex flex-wrap gap-2 border-b pb-3">
                  <Link
                    to={`/sales/invoices/${selected}/copy`}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Print
                  </Link>
                  <Link
                    to={`/sales/payments/create?invoice_id=${selected}`}
                    className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Record Payment
                  </Link>
                </div>
                {copyData ? (
                  <TaxInvoiceCopy data={copyData} />
                ) : (
                  <p className="py-8 text-center text-slate-400">Loading invoice…</p>
                )}
              </>
            ) : (
              <p className="py-12 text-center text-slate-400">Select an invoice to preview</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
