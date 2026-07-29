import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Mail, Printer, X } from "lucide-react";

import { convertQuotationToSalesOrder } from "../../api/salesApi";
import { getProducts } from "../../api/productionApi";
import { formatInr, statusColor } from "../../data/salesMasterData";
import { useToast } from "../../context/ToastContext";

export default function QuoteDetailModal({ quote, onClose, onStatusChange, onConverted }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [products, setProducts] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  if (!quote) return null;

  const loadProducts = async () => {
    if (productsLoaded) return;
    try {
      const res = await getProducts();
      setProducts(res.data || []);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoaded(true);
    }
  };

  const handleConvert = async () => {
    if (quote.status !== "accepted") {
      setError("Only accepted quotations can be converted to a Sales Order. Please change the status to 'Accepted' first.");
      return;
    }

    setConverting(true);
    setError("");

    try {
      if (typeof quote.id === "number") {
        const payload = {};
        if (productId) {
          const product = products.find((p) => String(p.id) === String(productId));
          payload.product_id = Number(productId);
          payload.quantity = Number(quantity) || 1;
          payload.item_description = product?.name;
          payload.unit_price = product?.unit_price != null ? Number(product.unit_price) : 0;
        }
        const res = await convertQuotationToSalesOrder(quote.id, payload);
        const so = res.data;
        onConverted?.(so);
        onClose?.();
        if (so?.id) navigate(`/sales/orders/${so.id}`);
        else navigate("/sales/orders");
      } else {
        onStatusChange?.(quote, "accepted");
        const newSo = {
          order_number: `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          customer_name: quote.customer_name,
          order_date: new Date().toISOString().slice(0, 10),
          total_amount: quote.amount || quote.total_amount || 0,
          status: "pending",
          line_items: (quote.items || []).map((it) => ({
            item_description: it.description || it.name || it.item_description || "",
            quantity: Number(it.quantity) || 0,
            unit: it.unit || "pcs",
            unit_price: Number(it.unit_price) || 0,
            line_total: (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
          })),
        };
        const storedSO = localStorage.getItem("smrt_sales_orders");
        const currentSO = storedSO ? JSON.parse(storedSO) : [];
        localStorage.setItem("smrt_sales_orders", JSON.stringify([newSo, ...currentSO]));

        if (addToast) addToast(`Quotation ${quote.quote_number} converted to Sales Order ${newSo.so_number}`, "success");
        onConverted?.(newSo);
        onClose?.();
        navigate("/sales/orders");
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Convert failed";
      setError(typeof msg === "string" ? msg : "Convert failed");
    } finally {
      setConverting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    const companyEmail = "sales@gnsinsights.com";
    const customerEmail = `${(quote.customer_name || "client").toLowerCase().replace(/[^a-z0-9]/g, "")}@company.com`;
    const subject = encodeURIComponent(`Commercial Quotation ${quote.quote_number} - GNS Insights`);
    const body = encodeURIComponent(
      `Dear ${quote.customer_name || "Customer"},\n\nPlease find attached Commercial Quotation ${quote.quote_number} for total amount ${formatInr(quote.amount ?? quote.total_amount)}.\n\nQuote Date: ${quote.quote_date || "—"}\nValid Until: ${quote.valid_until || "—"}\nSales Representative: ${quote.sales_person || "Vikram Sharma"}\n\nTerms & Notes:\n${quote.notes || "30% advance deposit, 70% upon dispatch. Validity: 30 days."}\n\nBest regards,\nGNS Insights Sales Team\nCompany Email: ${companyEmail}`
    );

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${customerEmail}&cc=${companyEmail}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank");

    if (addToast) addToast(`Opening Gmail compose from Company Mail (${companyEmail}) to ${quote.customer_name}!`, "success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-[#2563EB]">{quote.quote_number}</p>
            <h2 className="text-xl font-bold text-slate-900">{quote.customer_name || "Customer"}</h2>
            <p className="text-sm text-slate-500">
              Sales Person: {quote.sales_person || "—"} · Valid until {quote.valid_until || "—"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 print:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-400">Quote date</dt>
              <dd className="font-medium">{quote.quote_date || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Amount</dt>
              <dd className="font-medium">{formatInr(quote.amount ?? quote.total_amount)}</dd>
            </div>
          </dl>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(quote.status)}`}>
              {quote.status}
            </span>
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 print:hidden">
            <p className="mb-1 text-sm font-semibold text-slate-800">Convert to Sales Order</p>
            <p className="text-xs text-slate-500">
              Converts this accepted quotation into an official Sales Order to trigger manufacturing and dispatch.
            </p>
            {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t px-5 py-4 print:hidden">
          <button type="button" onClick={handlePrint} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Printer className="h-4 w-4" /> Preview
          </button>
          <button type="button" onClick={handlePrint} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button type="button" onClick={handleSendEmail} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Mail className="h-4 w-4" /> Email
          </button>

          {/* Workflow Stage Actions */}
          {quote.status === "draft" && (
            <button
              type="button"
              onClick={() => {
                onStatusChange?.(quote, "sent");
                if (addToast) addToast(`Quotation ${quote.quote_number} sent to customer!`, "success");
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Send to Customer
            </button>
          )}

          {quote.status === "sent" && (
            <>
              <button
                type="button"
                onClick={() => {
                  onStatusChange?.(quote, "accepted");
                  if (addToast) addToast(`Quotation ${quote.quote_number} marked as Accepted!`, "success");
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Mark Accepted
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusChange?.(quote, "rejected");
                  if (addToast) addToast(`Quotation ${quote.quote_number} marked as Rejected.`, "info");
                }}
                className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                Mark Rejected
              </button>
            </>
          )}

          {quote.status === "accepted" && (
            <button
              type="button"
              disabled={converting}
              onClick={handleConvert}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-700"
            >
              {converting ? "Converting…" : "Convert to Sales Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
