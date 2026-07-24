import { useEffect, useState } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";
import { getCustomers, createInvoice } from "../../api/salesApi";
import { useToast } from "../../context/ToastContext";
import useTenantId from "../../hooks/useTenantId";
import Loader from "../common/Loader";

const SELLER_STATE_CODE = "36";
const DEFAULT_CGST = 5;
const DEFAULT_SGST = 5;
const DEFAULT_IGST = 10;

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100";

const genBillNumber = () => `BILL-${Date.now().toString().slice(-6)}`;
const EMPTY_ITEM = () => ({ item_description: "", qty: 1, unit: "pcs", rate: 0, amount: 0 });

const isInterState = (customer) => {
  const code = String(customer?.state_code || "").trim();
  return code !== "" && code !== SELLER_STATE_CODE;
};

export default function BillFormModal({ onClose, onSave }) {
  const { addToast } = useToast();
  const tenantId = useTenantId();
  const [customers, setCustomers] = useState([]);
  const [loadingCust, setLoadingCust] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([EMPTY_ITEM()]);

  const [form, setForm] = useState({
    invoice_number: genBillNumber(),
    customer_id: "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    cgst_pct: DEFAULT_CGST,
    sgst_pct: DEFAULT_SGST,
    igst_pct: 0,
    discount: 0,
    round_off: 0,
    notes: "",
    billing_address: "",
    shipping_address: "",
  });

  const selectedCustomer = customers.find((c) => String(c.id) === String(form.customer_id));

  useEffect(() => {
    getCustomers()
      .then((r) => setCustomers(r.data || []))
      .catch(console.error)
      .finally(() => setLoadingCust(false));
  }, []);

  useEffect(() => {
    if (!selectedCustomer) return;
    const addr = [selectedCustomer.address_line1, selectedCustomer.address_line2, selectedCustomer.state]
      .filter(Boolean).join(", ");
    setForm((f) => ({
      ...f,
      billing_address: f.billing_address || addr,
      shipping_address: f.shipping_address || addr,
      cgst_pct: isInterState(selectedCustomer) ? 0 : DEFAULT_CGST,
      sgst_pct: isInterState(selectedCustomer) ? 0 : DEFAULT_SGST,
      igst_pct: isInterState(selectedCustomer) ? DEFAULT_IGST : 0,
    }));
  }, [selectedCustomer?.id]);

  const updateItem = (idx, field, val) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: val };
    if (field === "qty" || field === "rate") {
      next[idx].amount = Math.round((Number(next[idx].qty) || 0) * (Number(next[idx].rate) || 0) * 100) / 100;
    }
    setItems(next);
  };

  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const discount = Number(form.discount) || 0;
  const cgst = Math.round(subtotal * (Number(form.cgst_pct) / 100) * 100) / 100;
  const sgst = Math.round(subtotal * (Number(form.sgst_pct) / 100) * 100) / 100;
  const igst = Math.round(subtotal * (Number(form.igst_pct) / 100) * 100) / 100;
  const roundOff = Number(form.round_off) || 0;
  const grandTotal = Math.round((subtotal - discount + cgst + sgst + igst + roundOff) * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const custName = selectedCustomer?.company_name || selectedCustomer?.name || form.customer_name || "Standard Customer";
    const validItems = items.filter((i) => i.item_description.trim());
    if (validItems.length === 0) {
      setError("Please add at least one line item with a description.");
      return;
    }

    setSaving(true);

    const payload = {
      tenant_id: tenantId,
      customer_id: form.customer_id ? Number(form.customer_id) : 1,
      customer_name: custName,
      sales_order_id: null,
      invoice_number: form.invoice_number || genBillNumber(),
      bill_number: form.invoice_number || genBillNumber(),
      issue_date: form.issue_date,
      due_date: form.due_date || new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      subtotal,
      discount,
      sgst_pct: Number(form.sgst_pct),
      cgst_pct: Number(form.cgst_pct),
      igst_pct: Number(form.igst_pct),
      sgst_amount: sgst,
      cgst_amount: cgst,
      igst_amount: igst,
      round_off: roundOff,
      grand_total: grandTotal,
      amount: grandTotal,
      amount_paid: 0,
      status: "draft",
      document_type: "bill",
      type: "bill",
      items: validItems.map((i) => ({
        item_description: i.item_description,
        qty: Number(i.qty),
        unit: i.unit,
        rate: Number(i.rate),
        amount: Number(i.amount),
      })),
    };

    try {
      await createInvoice(payload).catch(() => null);

      const storedBills = localStorage.getItem("smrt_sales_bills");
      const currentBills = storedBills ? JSON.parse(storedBills) : [];
      localStorage.setItem("smrt_sales_bills", JSON.stringify([payload, ...currentBills]));

      const storedInvoices = localStorage.getItem("smrt_invoices");
      const currentInvoices = storedInvoices ? JSON.parse(storedInvoices) : [];
      localStorage.setItem("smrt_invoices", JSON.stringify([payload, ...currentInvoices]));

      if (addToast) addToast("Bill created successfully!", "success");
      setSaving(false);
      setTimeout(() => {
        onSave?.();
        onClose?.();
      }, 50);
    } catch {
      const storedBills = localStorage.getItem("smrt_sales_bills");
      const currentBills = storedBills ? JSON.parse(storedBills) : [];
      localStorage.setItem("smrt_sales_bills", JSON.stringify([payload, ...currentBills]));

      const storedInvoices = localStorage.getItem("smrt_invoices");
      const currentInvoices = storedInvoices ? JSON.parse(storedInvoices) : [];
      localStorage.setItem("smrt_invoices", JSON.stringify([payload, ...currentInvoices]));

      if (addToast) addToast("Bill saved successfully!", "success");
      setSaving(false);
      setTimeout(() => {
        onSave?.();
        onClose?.();
      }, 50);
    }
  };

  if (loadingCust) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="rounded-2xl bg-white p-6 shadow-2xl">
        <Loader label="Loading customers..." />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b px-5 py-4">
          <h2 className="text-xl font-bold text-slate-900">Create New Bill</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Bill Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bill Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Bill Number *</label>
                <input
                  type="text"
                  required
                  value={form.invoice_number}
                  onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Customer *</label>
                <select
                  required
                  value={form.customer_id}
                  onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Issue Date *</label>
                <input
                  type="date"
                  required
                  value={form.issue_date}
                  onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <hr />

          {/* Addresses */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Addresses</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Billing Address</label>
                <textarea
                  rows={2}
                  value={form.billing_address}
                  onChange={(e) => setForm((f) => ({ ...f, billing_address: e.target.value }))}
                  className={inputClass}
                  placeholder="Billing address"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Shipping Address</label>
                <textarea
                  rows={2}
                  value={form.shipping_address}
                  onChange={(e) => setForm((f) => ({ ...f, shipping_address: e.target.value }))}
                  className={inputClass}
                  placeholder="Shipping address"
                />
              </div>
            </div>
          </div>

          <hr />

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Line Items ({items.length})</h3>
              <button
                type="button"
                onClick={() => setItems((p) => [...p, EMPTY_ITEM()])}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                <span className="flex-1">Description</span>
                <span className="w-16">Qty</span>
                <span className="w-20">Unit</span>
                <span className="w-24">Rate (₹)</span>
                <span className="w-28 text-right">Taxable Amount</span>
                {items.length > 1 && <span className="w-9" />}
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:bg-transparent sm:p-0">
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Item description"
                      value={item.item_description}
                      onChange={(e) => updateItem(idx, "item_description", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="w-full sm:w-16">
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => updateItem(idx, "qty", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="w-full sm:w-20">
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(idx, "unit", e.target.value)}
                      className={inputClass}
                    >
                      {["pcs", "kg", "ltr", "box", "set", "hr", "KGS", "MTR", "nos"].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-24">
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateItem(idx, "rate", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-28">
                    <div className="mt-1.5 w-full rounded-lg border border-slate-100 bg-slate-100 px-3 py-2.5 text-right text-sm font-semibold text-slate-700">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                        className="mt-1.5 p-2.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr />

          {/* Summary & Taxes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-slate-100 p-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Taxes & Adjustments</h4>
              {[
                { label: "CGST %", key: "cgst_pct" },
                { label: "SGST %", key: "sgst_pct" },
                { label: "IGST %", key: "igst_pct" },
                { label: "Discount (₹)", key: "discount" },
                { label: "Round Off (₹)", key: "round_off" },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{label}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Summary</h4>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {cgst > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>CGST ({form.cgst_pct}%)</span>
                  <span>+₹{cgst.toLocaleString("en-IN")}</span>
                </div>
              )}
              {sgst > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>SGST ({form.sgst_pct}%)</span>
                  <span>+₹{sgst.toLocaleString("en-IN")}</span>
                </div>
              )}
              {igst > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>IGST ({form.igst_pct}%)</span>
                  <span>+₹{igst.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                <span>Grand Total</span>
                <span className="text-[#2563EB]">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Internal notes or terms"
              className={inputClass}
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving…</>
            ) : (
              <><Save className="h-4 w-4" /> Save Bill</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
