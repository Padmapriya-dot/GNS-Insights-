import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, FileText, Plus, TrendingUp, Download, RefreshCw, Search } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import BillFormModal from "../../components/sales/BillFormModal";
import { exportToExcel } from "../../utils/exportUtils";
import { getInvoices } from "../../api/salesApi";
import { useToast } from "../../context/ToastContext";

const fmt = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v) || 0);

const STATUS_STYLES = {
  paid: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  partial: "bg-orange-100 text-orange-700",
  sent: "bg-blue-100 text-blue-700",
  approved: "bg-blue-100 text-blue-700",
};

const STATUS_LABEL = {
  paid: "Paid", draft: "Draft", partial: "Partial", sent: "Sent", approved: "Approved",
};

function readBillsFromStorage() {
  try {
    const stored = JSON.parse(localStorage.getItem("smrt_sales_bills") || "[]");
    const map = new Map();
    stored.forEach((item) => {
      const key = String(item.invoice_number || item.bill_number || item.id || "");
      if (key) map.set(key, { ...item, id: item.id || key });
    });
    return Array.from(map.values());
  } catch {
    return [];
  }
}

export default function SalesBills() {
  const location = useLocation();
  const { addToast } = useToast();
  const [bills, setBills] = useState(() => readBillsFromStorage());
  const [loadingBills, setLoadingBills] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const fetchBills = useCallback(async () => {
    setLoadingBills(true);
    try {
      const res = await getInvoices();
      const data = res?.data ?? res ?? [];
      const apiList = Array.isArray(data) ? data : [];

      // Merge: API records take priority; add any localStorage-only entries not yet synced
      const apiNumbers = new Set(apiList.map((b) => String(b.invoice_number || b.id)));
      const localOnly = readBillsFromStorage().filter(
        (b) => !apiNumbers.has(String(b.invoice_number || b.id))
      );

      const merged = [
        ...apiList.map((b) => ({
          ...b,
          id: b.id,
          bill_number: b.invoice_number,
          grand_total: b.grand_total ?? b.amount ?? 0,
          amount_paid: b.amount_paid ?? 0,
        })),
        ...localOnly,
      ];
      setBills(merged);

      // Update localStorage cache with the fresh API data
      try {
        localStorage.setItem("smrt_sales_bills", JSON.stringify(merged));
      } catch { /* ignore */ }
    } catch (err) {
      // Fall back to localStorage if API fails
      setBills(readBillsFromStorage());
      addToast("Could not refresh bills from server — showing cached data.", "warning");
    } finally {
      setLoadingBills(false);
    }
  }, [addToast]);

  // Reload every time user navigates to this page
  useEffect(() => {
    fetchBills();
  }, [fetchBills, location.key]);

  const handleUpdateBillStatus = useCallback((billId, newStatus) => {
    setBills((prev) => {
      const updated = prev.map((b) => {
        if (String(b.id) !== String(billId)) return b;
        const grandTotal = Number(b.grand_total) || 0;
        let newPaid = Number(b.amount_paid) || 0;
        if (newStatus === "paid") newPaid = grandTotal;
        else if (newStatus === "partial") {
          const input = window.prompt("Enter partial payment amount (₹):", "");
          if (!input) return b;
          const p = Number(input);
          if (!isNaN(p) && p > 0) newPaid = Math.min(newPaid + p, grandTotal);
        }
        return { ...b, status: newPaid >= grandTotal && grandTotal > 0 ? "paid" : newStatus, amount_paid: newPaid };
      });
      // Persist
      try {
        localStorage.setItem("smrt_sales_bills", JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const filteredBills = useMemo(() => {
    if (!search.trim()) return bills;
    const q = search.toLowerCase();
    return bills.filter((b) =>
      [b.invoice_number, b.bill_number, b.customer_name].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [bills, search]);

  const columns = useMemo(() => [
    {
      key: "invoice_number",
      label: "Bill No.",
      render: (r) => <span className="font-semibold text-[#2563EB]">{r.invoice_number || r.bill_number}</span>,
    },
    { key: "customer_name", label: "Customer" },
    {
      key: "issue_date",
      label: "Issue Date",
      render: (r) => String(r.issue_date || "—").slice(0, 10),
    },
    {
      key: "due_date",
      label: "Due Date",
      render: (r) => String(r.due_date || "—").slice(0, 10),
    },
    {
      key: "items",
      label: "Product",
      render: (r) => {
        const first = r.items?.[0]?.item_description;
        if (!first) return <span className="text-slate-400">—</span>;
        return (
          <span className="font-medium text-slate-800">
            {first}
            {r.items?.length > 1 && (
              <span className="ml-1.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                +{r.items.length - 1} more
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "qty",
      label: "Quantity",
      render: (r) => {
        const first = r.items?.[0];
        if (!first) return <span className="text-slate-400">—</span>;
        const qty = Number(first.qty || first.quantity || 0);
        const unit = first.unit || "pcs";
        return (
          <span className="font-medium text-slate-700">
            {qty % 1 === 0 ? qty : qty.toFixed(2)}
            <span className="ml-1 text-xs text-slate-400">{unit}</span>
          </span>
        );
      },
    },
    {
      key: "rate",
      label: "Unit Price",
      render: (r) => {
        const rate = Number(r.items?.[0]?.rate || 0);
        if (!rate) return <span className="text-slate-400">—</span>;
        return (
          <span className="font-semibold text-slate-800">
            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(rate)}
          </span>
        );
      },
    },
    {
      key: "grand_total",
      label: "Amount",
      render: (r) => fmt(r.grand_total),
    },
    {
      key: "amount_paid",
      label: "Paid",
      render: (r) => fmt(r.amount_paid),
    },
    {
      key: "balance",
      label: "Balance",
      render: (r) => fmt((Number(r.grand_total) || 0) - (Number(r.amount_paid) || 0)),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const k = String(r.status || "draft").toLowerCase();
        return (
          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLES[k] || "bg-slate-100 text-slate-600"}`}>
            {STATUS_LABEL[k] || r.status || "Draft"}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <Link to={`/sales/bills/${r.id}`} className="text-xs font-semibold text-[#2563EB] hover:underline">View</Link>
          {String(r.status || "").toLowerCase() !== "paid" && (
            <button type="button" onClick={() => handleUpdateBillStatus(r.id, "paid")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100">
              Mark Paid
            </button>
          )}
        </div>
      ),
    },
  ], [handleUpdateBillStatus]);

  const totalAmount = bills.reduce((s, b) => s + (Number(b.grand_total) || 0), 0);
  const paidCount = bills.filter((b) => String(b.status) === "paid").length;
  const pendingCount = bills.length - paidCount;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bills</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your billing records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/sales/bills/create"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
            <Plus className="h-4 w-4" /> Create Bill
          </Link>
          <button type="button" onClick={() => exportToExcel(
            filteredBills.map((b) => ({
              ...b,
              product: b.items?.[0]?.item_description || "—",
              quantity: b.items?.[0]?.qty ?? b.items?.[0]?.quantity ?? "—",
              unit: b.items?.[0]?.unit || "—",
              unit_price: b.items?.[0]?.rate || 0,
            })),
            [
              { key: "invoice_number", label: "Bill No." },
              { key: "customer_name", label: "Customer" },
              { key: "issue_date", label: "Issue Date" },
              { key: "product", label: "Product" },
              { key: "quantity", label: "Quantity" },
              { key: "unit", label: "Unit" },
              { key: "unit_price", label: "Unit Price (₹)" },
              { key: "grand_total", label: "Amount" },
              { key: "status", label: "Status" },
            ],
            "sales-bills"
          )}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" onClick={fetchBills}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${loadingBills ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div><p className="text-xs font-medium text-slate-500">Total Bills</p><p className="mt-1 text-xl font-bold text-slate-900">{bills.length}</p></div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600"><FileText className="h-5 w-5 text-white" /></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div><p className="text-xs font-medium text-slate-500">Paid / Pending</p><p className="mt-1 text-xl font-bold text-slate-900">{paidCount} <span className="text-base font-normal text-slate-400">/ {pendingCount}</span></p></div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600"><CheckCircle className="h-5 w-5 text-white" /></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div><p className="text-xs font-medium text-slate-500">Combined Total</p><p className="mt-1 text-xl font-bold text-[#2563EB]">{fmt(totalAmount)}</p></div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600"><TrendingUp className="h-5 w-5 text-white" /></div>
        </div>
      </div>

      {/* Search + Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search by Bill No. or Customer..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Showing {filteredBills.length} of {bills.length} bills</span>
        </div>

        {bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-slate-200 bg-white shadow-sm text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-semibold text-slate-700">No bills yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first bill to get started.</p>
            <Link to="/sales/bills/create"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Create Bill
            </Link>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredBills}
            showSearch={false}
            searchPlaceholder="Search bills..."
          />
        )}
      </div>

      {showCreate && (
        <BillFormModal
          onClose={() => setShowCreate(false)}
          onSave={() => {
            setShowCreate(false);
            fetchBills();
          }}
        />
      )}
    </div>
  );
}
