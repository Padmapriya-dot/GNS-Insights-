import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Download, FileText } from "lucide-react";
import Loader from "../../components/common/Loader";
import { getInvoiceDetail } from "../../api/salesApi";

const fmt = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0);

const STATUS_STYLES = {
  paid: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  sent: "bg-blue-100 text-blue-700",
  partial: "bg-orange-100 text-orange-700",
};
const STATUS_LABEL = { paid: "Paid", draft: "Draft", pending_approval: "Pending", approved: "Approved", sent: "Sent", partial: "Partial" };

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billData, setBillData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);

    // 1. Check local storage for bill persistence
    const storedBills = localStorage.getItem("smrt_sales_bills");
    const localBills = storedBills ? JSON.parse(storedBills) : [];
    const storedInvoices = localStorage.getItem("smrt_invoices");
    const localInvoices = storedInvoices ? JSON.parse(storedInvoices) : [];
    const allLocal = [...localBills, ...localInvoices];

    const match = allLocal.find(
      (b) => String(b.id) === String(id) || String(b.invoice_number) === String(id) || String(b.bill_number) === String(id)
    );

    if (match) {
      setBillData({
        invoice: match,
        items: match.items?.length
          ? match.items
          : [
              {
                item_description: match.item_description || "Standard Steel Components",
                qty: match.qty || 1,
                unit: match.unit || "pcs",
                rate: match.rate || match.grand_total || match.amount || 0,
                amount: match.grand_total || match.amount || 0,
              },
            ],
        customer: {
          name: match.customer_name || "Customer",
          billing_address: match.billing_address || "Standard Company Billing Address",
          shipping_address: match.shipping_address || "Standard Company Delivery Address",
        },
      });
      setLoading(false);
      return;
    }

    // 2. Fall back to API
    getInvoiceDetail(id)
      .then((r) => {
        const payload = r?.data?.data ?? r?.data ?? null;
        if (!payload || payload.found === false || !payload.invoice) setNotFound(true);
        else setBillData(payload);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader label="Loading bill details…" />;

  if (notFound || !billData) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Bill not found</h1>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
      </div>
    );
  }

  const { invoice, items = [], customer } = billData;
  const billNumber = invoice.invoice_number || `BILL-${String(invoice.id).padStart(4, "0")}`;
  const statusKey = (invoice.status || "draft").toLowerCase();
  const isPaid = statusKey === "paid";

  const itemsSubtotal = Number(invoice.subtotal) || items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const discount = Number(invoice.discount) || 0;
  const sgstAmt = Number(invoice.sgst_amount) || 0;
  const cgstAmt = Number(invoice.cgst_amount) || 0;
  const igstAmt = Number(invoice.igst_amount) || 0;
  const roundOff = Number(invoice.round_off) || 0;
  const grandTotal = Number(invoice.grand_total) || 0;
  const amountPaid = Number(invoice.amount_paid) || 0;
  const balanceDue = Math.max(grandTotal - amountPaid, 0);

  const handleStatusChange = (newStatus) => {
    const updatedInvoice = {
      ...invoice,
      status: newStatus,
      amount_paid: newStatus === "paid" ? grandTotal : invoice.amount_paid || 0,
    };
    setBillData((prev) => ({ ...prev, invoice: updatedInvoice }));

    ["smrt_sales_bills", "smrt_invoices"].forEach((key) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        const list = JSON.parse(stored);
        const updatedList = list.map((b) =>
          String(b.id) === String(id) || String(b.invoice_number) === String(id) || String(b.bill_number) === String(id)
            ? updatedInvoice
            : b
        );
        localStorage.setItem(key, JSON.stringify(updatedList));
      }
    });
  };

  const handlePartialPayment = () => {
    const input = window.prompt(`Enter partial payment amount received (₹):`, "");
    if (!input) return;
    const paidVal = Number(input);
    if (isNaN(paidVal) || paidVal <= 0) return;

    const newAmountPaid = Math.min(amountPaid + paidVal, grandTotal);
    const newStatus = newAmountPaid >= grandTotal ? "paid" : "partial";

    const updatedInvoice = {
      ...invoice,
      status: newStatus,
      amount_paid: newAmountPaid,
    };
    setBillData((prev) => ({ ...prev, invoice: updatedInvoice }));

    ["smrt_sales_bills", "smrt_invoices"].forEach((key) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        const list = JSON.parse(stored);
        const updatedList = list.map((b) =>
          String(b.id) === String(id) || String(b.invoice_number) === String(id) || String(b.bill_number) === String(id)
            ? updatedInvoice
            : b
        );
        localStorage.setItem(key, JSON.stringify(updatedList));
      }
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bill {billNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">Billing details for {customer?.name || "Customer"}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/sales/bills")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Bills
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Download className="h-4 w-4" /> Print / Download
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className={`h-1.5 w-full ${isPaid ? "bg-emerald-500" : "bg-teal-600"}`} />

        <div className="space-y-6 p-6">
          {/* Seller + Invoice meta */}
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-center">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Bill Date</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{invoice.issue_date || "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-center">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Due Date</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{invoice.due_date || "—"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col justify-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Bill No.</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{billNumber}</p>
              </div>
              <div className="mt-4">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[statusKey] || "bg-slate-100 text-slate-600"}`}>
                  {STATUS_LABEL[statusKey] || invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Bill To</p>
            <h3 className="mt-2 text-base font-semibold text-slate-900">{customer?.name || "Customer"}</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm text-slate-600">
              <div>
                {customer?.address_line1 && <p>{customer.address_line1}</p>}
                {customer?.city && <p>{customer.city}</p>}
                {customer?.state && <p>{customer.state}</p>}
              </div>
              <div>
                {customer?.gstin && <p>GSTIN: {customer.gstin}</p>}
                {customer?.phone && <p>Phone: {customer.phone}</p>}
                {customer?.email && <p>Email: {customer.email}</p>}
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["#", "Description of Goods", "Qty", "Unit", "Rate", "Amount"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 ${i > 1 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No line items found.</td></tr>
                ) : items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.item_description}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{item.qty}</td>
                    <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmt(item.rate)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5">
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between border-b border-slate-200 pb-2"><span>Taxable Value</span><span>{fmt(itemsSubtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between border-b border-slate-200 py-2 text-rose-600"><span>Discount</span><span>−{fmt(discount)}</span></div>}
                {sgstAmt > 0 && <div className="flex justify-between border-b border-slate-200 py-2"><span>SGST ({invoice.sgst_pct}%)</span><span>{fmt(sgstAmt)}</span></div>}
                {cgstAmt > 0 && <div className="flex justify-between border-b border-slate-200 py-2"><span>CGST ({invoice.cgst_pct}%)</span><span>{fmt(cgstAmt)}</span></div>}
                {igstAmt > 0 && <div className="flex justify-between border-b border-slate-200 py-2"><span>IGST ({invoice.igst_pct}%)</span><span>{fmt(igstAmt)}</span></div>}
                {roundOff !== 0 && <div className="flex justify-between border-b border-slate-200 py-2"><span>Round Off</span><span>{fmt(roundOff)}</span></div>}
              </div>
              <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900">
                <div className="flex justify-between"><span>Total</span><span>{fmt(grandTotal)}</span></div>
                {amountPaid > 0 && <div className="flex justify-between text-emerald-700"><span>Paid</span><span>{fmt(amountPaid)}</span></div>}
                <div className="flex justify-between text-amber-700"><span>Balance Due</span><span>{fmt(balanceDue)}</span></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <Link
              to="/sales/bills"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 print:hidden"
            >
              <FileText className="h-4 w-4" /> All Bills
            </Link>
            <p className="text-sm text-slate-500">This bill is computer generated and does not require a signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
