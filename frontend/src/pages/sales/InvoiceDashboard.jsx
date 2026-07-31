import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, IndianRupee, Plus, RefreshCw } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import ManufacturingWorkflowBar from "../../components/manufacturing/ManufacturingWorkflowBar";
import Invoice from "../../components/sales/Invoice";
import RecordPaymentModal from "../../components/finance/RecordPaymentModal";
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
  issued: 0,
};

export default function InvoiceDashboard() {
  const { settings } = useCompanySettings();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(emptySummary);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState("table");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, listRes] = await Promise.allSettled([
        getInvoiceSummary(),
        getInvoicesEnriched(),
      ]);
      const storedBills = localStorage.getItem("smrt_sales_bills");
      const localBills = storedBills ? JSON.parse(storedBills) : [];
      const storedInvoices = localStorage.getItem("smrt_invoices");
      const localInvoices = storedInvoices ? JSON.parse(storedInvoices) : [];

      const invMap = new Map();

      // API rows first (lowest priority)
      if (listRes.status === "fulfilled" && listRes.value?.data) {
        listRes.value.data.forEach((item, idx) => {
          const key = String(item.invoice_number || item.id || `api-${idx}`);
          invMap.set(key, { ...item, id: item.id || item.invoice_number || `inv-api-${idx}` });
        });
      }

      // Local records overwrite API (local is always most up-to-date)
      [...localBills, ...localInvoices].forEach((item, idx) => {
        const key = String(item.invoice_number || item.bill_number || item.id || `local-${idx}`);
        invMap.set(key, { ...item, id: item.id || item.invoice_number || `bill-local-${idx}` });
      });

      const mergedRows = Array.from(invMap.values());
      setRows(mergedRows);

      const total_invoices = mergedRows.length;
      const draft   = mergedRows.filter((r) => String(r.status || "").toLowerCase() === "draft").length;
      const paid    = mergedRows.filter((r) => String(r.status || "").toLowerCase() === "paid").length;
      const issued  = mergedRows.filter((r) => ["issued", "sent", "approved"].includes(String(r.status || "").toLowerCase())).length;
      const revenue = mergedRows.reduce((acc, r) => acc + (Number(r.grand_total ?? r.amount ?? r.total_amount) || 0), 0);

      setSummary({ total_invoices, draft, paid, issued, overdue: 0, revenue });
    } catch {
      const storedBills = localStorage.getItem("smrt_sales_bills");
      const localBills = storedBills ? JSON.parse(storedBills) : [];
      setRows(
        localBills.map((item, idx) => ({
          ...item,
          id: item.id || item.invoice_number || `bill-local-${idx}`,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useManufacturingRefresh(load);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }

    const match = rows.find(
      (r) => String(r.id) === String(selected) || String(r.invoice_number) === String(selected) || String(r.bill_number) === String(selected)
    );

    if (match) {
      const itemsList = match.items?.length
        ? match.items
        : [
            {
              item_description: match.item_description || "Standard Components & Services",
              qty: match.qty || 1,
              unit: match.unit || "pcs",
              rate: match.rate || match.grand_total || match.amount || 0,
              amount: match.grand_total || match.amount || 0,
            },
          ];

      setDetail({
        invoice: {
          ...match,
          invoice_number: match.invoice_number || match.bill_number || `INV-${String(match.id).slice(0, 6)}`,
          issue_date: match.issue_date || new Date().toISOString().slice(0, 10),
          due_date: match.due_date || match.issue_date || new Date().toISOString().slice(0, 10),
          grand_total: Number(match.grand_total ?? match.amount ?? match.total_amount) || 0,
          igst_pct: Number(match.igst_pct) || (match.igst_amount ? 18 : 0),
          cgst_pct: Number(match.cgst_pct) || (match.cgst_amount ? 9 : 0),
          sgst_pct: Number(match.sgst_pct) || (match.sgst_amount ? 9 : 0),
          igst_amount: Number(match.igst_amount) || 0,
          cgst_amount: Number(match.cgst_amount) || 0,
          sgst_amount: Number(match.sgst_amount) || 0,
          round_off: Number(match.round_off) || 0,
        },
        items: itemsList,
        customer: {
          name: match.customer_name || "Customer",
          address_line1: match.billing_address || match.address || "Hyderabad, Telangana",
          address_line2: match.shipping_address || "",
          gstin: match.gstin || "36AABCG1234H1Z5",
          state: match.state || "Telangana",
          state_code: "36",
          phone: match.phone || "",
        },
      });
      return;
    }

    if (typeof selected === "number" || !isNaN(Number(selected))) {
      getInvoiceDetail(selected)
        .then((r) => setDetail(r.data))
        .catch(() => setDetail(null));
    }
  }, [selected, rows]);

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
      label: "Invoice / Bill No",
      render: (r) => (
        <span className="font-medium text-[#2563EB]">
          {r.invoice_number || r.bill_number || "—"}
        </span>
      ),
    },
    { key: "customer_name", label: "Customer" },
    { key: "sales_order_number", label: "Sales Order" },
    { key: "amount", label: "Amount", render: (r) => formatInr(r.amount) },
    { key: "gst_amount", label: "Goods & Services Tax (GST)", render: (r) => formatInr(r.gst_amount) },    {
      key: "due_date",
      label: "Due Date",
      render: (r) => String(r.due_date || "").slice(0, 10) || "—",
    },
    {
      key: "items",
      label: "Description",
      render: (r) => {
        const first = r.items?.[0]?.item_description;
        return first ? (r.items.length > 1 ? `${first} +${r.items.length - 1} more` : first) : "—";
      },
    },
    {
      key: "grand_total",
      label: "Amount",
      render: (r) => formatInr(r.grand_total ?? r.amount ?? r.total_amount),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(r.status)}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setSelected(r.id); setView("copy"); }}
            className="rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#2563EB] hover:bg-blue-100 transition-colors"
          >
            Generate Invoice
          </button>
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
          <button
            type="button"
            onClick={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 transition-transform ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      <ManufacturingWorkflowBar currentStepId="invoice" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Total Invoices" value={summary.total_invoices} icon={FileText} color="bg-blue-600" />
        <KpiCard label="Draft" value={summary.draft} icon={FileText} color="bg-slate-500" />
        <KpiCard label="Paid" value={summary.paid} icon={FileText} color="bg-green-600" />
        <KpiCard label="Issued" value={summary.issued} icon={FileText} color="bg-indigo-500" />
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
              {["draft", "paid", "issued"].map((s) => (
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
              {filtered.map((inv, idx) => (
                <button
                  key={inv.id || `inv-${idx}`}
                  type="button"
                  onClick={() => setSelected(inv.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${selected && selected === inv.id ? "border-[#2563EB] bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <p className="font-semibold text-slate-800">{inv.customer_name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <span className="font-medium text-[#2563EB]">{inv.invoice_number || inv.bill_number}</span>
                  </p>
                  <p className="mt-1 text-sm font-bold">{formatInr(inv.grand_total ?? inv.amount)}</p>
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
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Record Payment
                  </button>
                </div>
                {copyData ? (
                  <Invoice data={copyData} />
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

      {/* ── Record Payment popup modal ── */}
      <RecordPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          load();
        }}
        initialInvoice={selected ? String(selected) : ""}
        initialPartyType="customer"
      />
    </div>
  );
}
