import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, Clock, FileText, IndianRupee, RefreshCw, Plus, XCircle } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import FinanceFilters from "../../components/finance/FinanceFilters";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { getAPSummary } from "../../api/accountsApi";
import { getVendors, createSupplierPayment, getSupplierPayments } from "../../api/procurementApi";
import { createSupplier } from "../../api/inventoryApi";
import { FINANCE_FLOW, formatInr } from "../../data/financeMasterData";
import useTenantId from "../../hooks/useTenantId";
import { INITIAL_AP_SUMMARY, normalizeListPayload, normalizeSummaryPayload, normalizeVendorList } from "./accountsPayableUtils";

function KpiCard({ label, value, icon: Icon, color }) {
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

export default function AccountsPayable() {
  const tenantId = useTenantId();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(INITIAL_AP_SUMMARY);
  const [payments, setPayments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [showInlineSupplierModal, setShowInlineSupplierModal] = useState(false);
  const [inlineSupplier, setInlineSupplier] = useState({ name: "", contact: "", email: "", phone: "" });
  const [savingInlineSupplier, setSavingInlineSupplier] = useState(false);
  const [newPayment, setNewPayment] = useState({
    supplier_id: "",
    amount: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "bank",
    reference: "",
    notes: "",
  });
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [financialYear, setFinancialYear] = useState("All Years");
  const [month, setMonth] = useState("All Months");
  const [branch, setBranch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, vendorRes, payRes] = await Promise.allSettled([
        getAPSummary(),
        getVendors(),
        getSupplierPayments(),
      ]);

      setSummary(sumRes.status === "fulfilled"
        ? normalizeSummaryPayload(sumRes.value?.data ?? sumRes.value)
        : INITIAL_AP_SUMMARY);

      setVendors(vendorRes.status === "fulfilled"
        ? normalizeVendorList(vendorRes.value?.data ?? vendorRes.value)
        : []);

      setPayments(payRes.status === "fulfilled"
        ? normalizeListPayload(payRes.value?.data ?? payRes.value)
        : []);
    } catch {
      setSummary(INITIAL_AP_SUMMARY);
      setVendors([]);
      setPayments([]);
      addToast("Failed to load accounts payable data", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const handleCreatePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSupplierPayment({
        tenant_id: tenantId,
        supplier_id: Number(newPayment.supplier_id),
        amount: Number(newPayment.amount),
        payment_date: newPayment.payment_date,
        payment_method: newPayment.payment_method,
        reference: newPayment.reference || null,
        notes: newPayment.notes || null,
      });
      addToast("Supplier payment recorded successfully", "success");
      setShowCreatePayment(false);
      setNewPayment({
        supplier_id: "", amount: "",
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: "bank", reference: "", notes: "",
      });
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to record payment", "error");
    }
  };

  const handleInlineSupplierSubmit = async (e) => {
    e.preventDefault();
    setSavingInlineSupplier(true);
    try {
      const res = await createSupplier({ tenant_id: tenantId, ...inlineSupplier });
      addToast("Supplier created successfully", "success");
      setShowInlineSupplierModal(false);
      setInlineSupplier({ name: "", contact: "", email: "", phone: "" });
      await load();
      const createdId = res?.data?.id || res?.id;
      if (createdId) setNewPayment((prev) => ({ ...prev, supplier_id: String(createdId) }));
    } catch (err) {
      addToast(err.response?.data?.detail || err.message || "Failed to create supplier", "error");
    } finally {
      setSavingInlineSupplier(false);
    }
  };

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      const supplierName = vendors.find((v) => v.id === p.supplier_id)?.name || "";
      if (q && ![String(p.id), supplierName, p.payment_method, p.reference, p.notes].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      if (vendorFilter && String(supplierName).toLowerCase() !== vendorFilter.toLowerCase()) return false;
      const dateStr = p.payment_date || "";
      if (!dateStr) return true;
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return true;
      if (financialYear && financialYear !== "All Years") {
        const startYear = parseInt(financialYear.split("-")[0], 10);
        if (dateObj < new Date(startYear, 3, 1) || dateObj > new Date(startYear + 1, 2, 31, 23, 59, 59)) return false;
      }
      if (month && month !== "All Months") {
        const mi = ["January","February","March","April","May","June","July","August","September","October","November","December"].indexOf(month);
        if (mi !== -1 && dateObj.getMonth() !== mi) return false;
      }
      return true;
    });
  }, [payments, search, vendors, vendorFilter, financialYear, month]);

  const paymentColumns = [
    { key: "id", label: "Payment No", render: (r) => <span className="font-mono font-semibold text-blue-700">VPY-{String(r.id).padStart(5, "0")}</span> },
    { key: "payment_date", label: "Date", render: (r) => String(r.payment_date || "").slice(0, 10) },
    { key: "supplier_id", label: "Vendor", render: (r) => vendors.find((v) => v.id === r.supplier_id)?.name || `Supplier #${r.supplier_id}` },
    { key: "amount", label: "Amount", render: (r) => <span className="font-semibold text-slate-800">{formatInr(r.amount ?? 0)}</span> },
    { key: "payment_method", label: "Method", render: (r) => (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 uppercase">
        {String(r.payment_method || r.method || "BANK")}
      </span>
    )},
    { key: "reference", label: "Reference", render: (r) => r.reference || "—" },
    { key: "notes", label: "Notes", render: (r) => r.notes || "—" },
  ];

  if (loading) return <Loader label="Loading accounts payable..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts Payable</h1>
          <p className="mt-1 text-sm text-slate-500">Vendor payments management and outstanding payables.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowCreatePayment(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Record Payment
          </button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Payables" value={formatInr(summary.outstanding_payables)} icon={IndianRupee} color="bg-red-500" />
        <KpiCard label="Due This Week" value={summary.due_this_week} icon={Clock} color="bg-amber-500" />
        <KpiCard label="Overdue Bills" value={summary.overdue_bills} icon={AlertCircle} color="bg-orange-500" />
        <KpiCard label="Paid This Month" value={formatInr(summary.paid_this_month)} icon={IndianRupee} color="bg-green-600" />
        <KpiCard label="Pending Approvals" value={summary.pending_approvals} icon={FileText} color="bg-indigo-600" />
        <KpiCard label="Vendor Count" value={summary.vendor_count} icon={Building2} color="bg-teal-600" />
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-medium text-slate-600 sm:text-xs">
        {FINANCE_FLOW.map((s, i) => (
          <span key={s} className="flex items-center gap-1">
            <span className="rounded bg-white px-1.5 py-0.5 shadow-sm">{s}</span>
            {i < FINANCE_FLOW.length - 1 && <span className="text-slate-400">↓</span>}
          </span>
        ))}
      </div>

      <FinanceFilters
        search={search}
        onSearchChange={setSearch}
        status={null}
        onStatusChange={null}
        vendorFilter={vendorFilter}
        onVendorFilterChange={setVendorFilter}
        vendors={vendors}
        financialYear={financialYear}
        onFinancialYearChange={setFinancialYear}
        month={month}
        onMonthChange={setMonth}
        branch={branch}
        onBranchChange={setBranch}
        searchPlaceholder="Search payment, vendor, reference..."
      />

      {/* Supplier Payments Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Supplier Payments</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredPayments.length} record{filteredPayments.length !== 1 ? "s" : ""} found
              {payments.length !== filteredPayments.length ? ` (filtered from ${payments.length})` : ""}
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Total: {formatInr(filteredPayments.reduce((s, r) => s + Number(r.amount || 0), 0))}
          </span>
        </div>
        <div className="p-4">
          <DataTable
            columns={paymentColumns}
            data={filteredPayments}
            showSearch={false}
            searchKeys={["id", "supplier_name", "payment_method", "reference", "notes"]}
            emptyState={
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <FileText className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No payments recorded yet</p>
                <p className="mt-1 text-xs text-slate-400">Click &quot;Record Payment&quot; to add your first supplier payment.</p>
              </div>
            }
          />
        </div>
      </div>

      {/* Record Payment Modal */}
      {showCreatePayment && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <h2 className="text-xl font-bold text-slate-900">Record Supplier Payment</h2>
              <button type="button" onClick={() => setShowCreatePayment(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePaymentSubmit} className="overflow-y-auto p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Supplier *</label>
                  <button type="button" onClick={() => setShowInlineSupplierModal(true)} className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Create Supplier
                  </button>
                </div>
                {vendors.length === 0 ? (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    No suppliers available yet. Click &quot;Create Supplier&quot; above to create one instantly.
                  </div>
                ) : (
                  <select required value={newPayment.supplier_id} onChange={(e) => setNewPayment({ ...newPayment, supplier_id: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white">
                    <option value="">— Select supplier —</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}{v.vendor_code ? ` (${v.vendor_code})` : ""}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Amount (₹) *</label>
                  <input type="number" step="0.01" required value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="e.g. 5000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Payment Date *</label>
                  <input type="date" required value={newPayment.payment_date} onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Payment Method</label>
                  <select value={newPayment.payment_method} onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-2 text-sm bg-white">
                    {["bank", "cash", "cheque", "upi", "other"].map((m) => (
                      <option key={m} value={m}>{m.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Reference</label>
                  <input type="text" value={newPayment.reference} onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="e.g. Txn ID, cheque no" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Notes</label>
                <textarea value={newPayment.notes} onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" rows={2} placeholder="Add payment notes..." />
              </div>
              <div className="flex justify-end gap-2 border-t pt-4">
                <button type="button" onClick={() => setShowCreatePayment(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Supplier Modal */}
      {showInlineSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">Create New Supplier</h2>
              <button type="button" onClick={() => setShowInlineSupplierModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleInlineSupplierSubmit} className="overflow-y-auto p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Supplier Name *</label>
                <input type="text" required value={inlineSupplier.name} onChange={(e) => setInlineSupplier({ ...inlineSupplier, name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white" placeholder="e.g. Acme Industries" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Contact Person</label>
                <input type="text" value={inlineSupplier.contact} onChange={(e) => setInlineSupplier({ ...inlineSupplier, contact: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white" placeholder="e.g. John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Email</label>
                  <input type="email" value={inlineSupplier.email} onChange={(e) => setInlineSupplier({ ...inlineSupplier, email: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white" placeholder="email@supplier.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Phone</label>
                  <input type="text" value={inlineSupplier.phone} onChange={(e) => setInlineSupplier({ ...inlineSupplier, phone: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white" placeholder="+91 9876543210" />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t pt-4">
                <button type="button" onClick={() => setShowInlineSupplierModal(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={savingInlineSupplier} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {savingInlineSupplier ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
