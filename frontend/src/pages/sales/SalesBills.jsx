import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, FileText, Plus, TrendingUp, Download, RefreshCw, Search, MoreVertical } from "lucide-react";
import Loader from "../../components/common/Loader";
import BillFormModal from "../../components/sales/BillFormModal";
import { getInvoices } from "../../api/salesApi";
import { exportToExcel } from "../../utils/exportUtils";

const isBillRecord = (row) => {
  const invoiceNumber = String(row?.invoice_number || row?.bill_number || "").trim().toUpperCase();
  const docType = String(row?.document_type || row?.type || "").trim().toLowerCase();
  return invoiceNumber.startsWith("BILL-") || docType === "bill";
};

const fmt = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v) || 0);

const STATUS_STYLES = {
  paid: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  sent: "bg-blue-100 text-blue-700",
  partial: "bg-orange-100 text-orange-700",
};

const STATUS_LABEL = {
  paid: "Paid", draft: "Draft", pending_approval: "Pending",
  approved: "Approved", sent: "Sent", partial: "Partial",
};

export default function SalesBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBills, setSelectedBills] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleSelectBill = (id) => {
    setSelectedBills((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInvoices().catch(() => ({ data: [] }));
      const apiBills = Array.isArray(res.data) ? res.data.filter(isBillRecord) : [];
      const stored = localStorage.getItem("smrt_sales_bills");
      const localBills = stored ? JSON.parse(stored) : [];
      const formatted = [...localBills, ...apiBills].map((item, idx) => ({
        ...item,
        id: item.id || item.invoice_number || item.bill_number || `bill-${idx}`,
      }));
      setBills(formatted);
    } catch {
      const stored = localStorage.getItem("smrt_sales_bills");
      const localBills = stored ? JSON.parse(stored) : [];
      const formatted = localBills.map((item, idx) => ({
        ...item,
        id: item.id || item.invoice_number || item.bill_number || `bill-${idx}`,
      }));
      setBills(formatted);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateBillStatus = (billId, newStatus) => {
    setBills((prev) =>
      prev.map((b) => {
        if (String(b.id) === String(billId)) {
          const grandTotal = Number(b.grand_total) || 0;
          let newPaid = b.amount_paid || 0;
          if (newStatus === "paid") newPaid = grandTotal;
          else if (newStatus === "partial") {
            const input = window.prompt(`Enter partial payment amount received (₹):`, "");
            if (!input) return b;
            const p = Number(input);
            if (!isNaN(p) && p > 0) {
              newPaid = Math.min((Number(b.amount_paid) || 0) + p, grandTotal);
            }
          }
          const updated = {
            ...b,
            status: newPaid >= grandTotal && grandTotal > 0 ? "paid" : newStatus,
            amount_paid: newPaid,
          };
          return updated;
        }
        return b;
      })
    );

    ["smrt_sales_bills", "smrt_invoices"].forEach((key) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        const list = JSON.parse(stored);
        const updatedList = list.map((b) => {
          if (String(b.id) === String(billId) || String(b.invoice_number) === String(billId) || String(b.bill_number) === String(billId)) {
            const grandTotal = Number(b.grand_total) || 0;
            let newPaid = b.amount_paid || 0;
            if (newStatus === "paid") newPaid = grandTotal;
            return {
              ...b,
              status: newStatus,
              amount_paid: newPaid,
            };
          }
          return b;
        });
        localStorage.setItem(key, JSON.stringify(updatedList));
      }
    });

    setOpenMenuId(null);
  };

  useEffect(() => {
    load();
  }, [load]);

  const filteredBills = useMemo(() => {
    return bills.filter(b => 
      String(b.invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
      String(b.customer_name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [bills, search]);

  const handleExport = () => {
    const exportColumns = [
      { key: "invoice_number", label: "Bill No." },
      { key: "customer_name", label: "Customer" },
      { key: "issue_date", label: "Issue Date" },
      { key: "due_date", label: "Due Date" },
      { key: "grand_total", label: "Total Amount" },
      { key: "status", label: "Status" },
    ];
    exportToExcel(filteredBills, exportColumns, "sales-bills");
  };

  if (loading) return <Loader label="Loading bills…" />;

  const totalAmount = bills.reduce((s, b) => s + (Number(b.grand_total) || 0), 0);
  const paidCount = bills.filter((b) => b.status === "paid").length;
  const pendingCount = bills.filter((b) => b.status !== "paid").length;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bills</h1>
          <p className="mt-1 text-sm text-slate-500">Review billing records and manage your bills.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create Bill
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Bills</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{bills.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Paid / Pending</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {paidCount} <span className="text-base font-normal text-slate-400">/ {pendingCount}</span>
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Combined Total</p>
              <p className="mt-1 text-xl font-bold text-[#2563EB]">{fmt(totalAmount)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Bill No. or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredBills.length} of {bills.length} bills
          </span>
        </div>

        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-semibold text-slate-700">No bills found</p>
            <p className="mt-1 text-sm text-slate-500">Create a bill or adjust your search query.</p>
            {bills.length === 0 && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Create Bill
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBills.map((b) => {
              const k = (b.status || "draft").toLowerCase();
              const billNo = b.invoice_number || `BILL-${String(b.id).padStart(4, "0")}`;
              return (
                <div
                  key={b.id}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedBills.includes(b.id)}
                          onChange={() => toggleSelectBill(b.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                          {billNo}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs font-semibold text-slate-500">
                          Due: {fmt(Number(b.grand_total || 0) - Number(b.amount_paid || 0))}
                        </span>
                        <span className="block text-base font-extrabold text-slate-900 leading-tight mt-1">
                          Total: {fmt(b.grand_total)}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Status */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {b.customer_name || "Unknown Customer"}
                        </h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize shrink-0 ${STATUS_STYLES[k] || "bg-slate-100 text-slate-600"}`}>
                          {STATUS_LABEL[k] || b.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-500">
                        <div>
                          <span className="block text-[10px] font-semibold text-slate-400 uppercase">Issued</span>
                          <span className="font-medium text-slate-700">{b.issue_date || "—"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold text-slate-400 uppercase">Due Date</span>
                          <span className="font-medium text-slate-700">{b.due_date || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Button: Continue to Bill & Status 3-dots menu */}
                  <div className="mt-5 flex items-center gap-2 border-t pt-4">
                    <Link
                      to={`/sales/bills/${b.id}`}
                      className="flex-1 text-center rounded-lg bg-blue-600 hover:bg-blue-700 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                    >
                      Continue to Bill
                    </Link>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === b.id ? null : b.id);
                        }}
                        className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                        title="Update status"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === b.id && (
                        <div className="absolute right-0 bottom-full mb-1 z-30 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                          {k === "draft" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateBillStatus(b.id, "sent")}
                              className="block w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Mark as Sent
                            </button>
                          )}
                          {k !== "paid" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateBillStatus(b.id, "partial")}
                                className="block w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Record Partial
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateBillStatus(b.id, "paid")}
                                className="block w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Mark as Paid
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <BillFormModal
          onClose={() => setShowCreate(false)}
          onSave={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}
