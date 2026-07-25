import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { X, Plus, Trash2, Save, Calculator } from "lucide-react";
import { createQuotation } from "../../api/salesApi";
import { useToast } from "../../context/ToastContext";
import { formatInr } from "../../data/salesMasterData";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";

export default function CreateQuotationModal({ isOpen, onClose, onSuccess }) {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    sales_person: "Vikram Sharma",
    quote_date: new Date().toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
    status: "sent",
    gst_rate: 18,
    discount_percent: 0,
    notes: "Payment Terms: 30% advance, 70% upon dispatch. Validity: 30 days.",
  });

  const [items, setItems] = useState([
    { description: "Standard Steel Components / Finished Product", quantity: 10, unit_price: 1500 },
  ]);

  useEffect(() => {
    if (isOpen) {
      const custParam = searchParams.get("customer_name");
      if (custParam) {
        setForm((prev) => ({ ...prev, customer_name: custParam }));
      }
    }
  }, [isOpen, searchParams]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Financial Calculations
  const subtotal = items.reduce((acc, item) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.unit_price) || 0;
    return acc + q * p;
  }, 0);

  const discountAmount = (subtotal * (Number(form.discount_percent) || 0)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = (taxableAmount * (Number(form.gst_rate) || 0)) / 100;
  const totalAmount = taxableAmount + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name) {
      setError("Customer Name is required.");
      return;
    }
    if (items.some((it) => !it.description)) {
      setError("All item descriptions must be filled.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      ...form,
      quote_number: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: totalAmount,
      subtotal,
      gst_amount: gstAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      items,
      created_at: new Date().toISOString(),
    };

    try {
      // 1. Try Backend API
      await createQuotation(payload).catch(() => null);

      // 2. Save into LocalStorage fallback
      const stored = localStorage.getItem("smrt_quotations");
      const currentQuotes = stored ? JSON.parse(stored) : [];
      localStorage.setItem("smrt_quotations", JSON.stringify([payload, ...currentQuotes]));

      // 3. Automatically upgrade lead status to "qualified" when quotation is issued
      const storedLeads = localStorage.getItem("smrt_leads");
      if (storedLeads) {
        const localLeads = JSON.parse(storedLeads);
        const updatedLeads = localLeads.map((l) =>
          l.customer_name?.toLowerCase() === form.customer_name?.toLowerCase() ||
          l.company?.toLowerCase() === form.customer_name?.toLowerCase()
            ? { ...l, status: "qualified" }
            : l
        );
        localStorage.setItem("smrt_leads", JSON.stringify(updatedLeads));
      }

      if (addToast) addToast("New Quotation created successfully!", "success");
      if (onSuccess) onSuccess(payload);
      onClose();
    } catch (err) {
      setError("Failed to create quotation.");
      if (addToast) addToast("Failed to create quotation", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Create New Commercial Quotation</h3>
            <p className="text-xs text-slate-500 mt-0.5">Generate price quote with GST, discount, and itemized billing.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Customer / Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Precision Engineering Private Ltd"
                value={form.customer_name}
                onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Sales Person</label>
              <select
                value={form.sales_person}
                onChange={(e) => setForm((f) => ({ ...f, sales_person: e.target.value }))}
                className={inputClass}
              >
                {["Vikram Sharma", "Ananya Roy", "Rahul Verma", "Sneha Patel", "Amit Kumar"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Quote Date</label>
              <input
                type="date"
                required
                value={form.quote_date}
                onChange={(e) => setForm((f) => ({ ...f, quote_date: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Valid Until</label>
              <input
                type="date"
                required
                value={form.valid_until}
                onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={inputClass}
              >
                {["draft", "sent", "accepted", "rejected", "expired"].map((st) => (
                  <option key={st} value={st}>{st.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Itemized Products Table */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Quotation Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>

            {/* Column Headings */}
            <div className="flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span className="flex-1">Item Description / Product</span>
              <span className="w-16 text-center">Qty</span>
              <span className="w-24 text-right">Unit Price (₹)</span>
              <span className="w-24 text-right">Total (₹)</span>
              <span className="w-6"></span>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Product / Service description..."
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-center text-slate-800 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Unit Price (₹)"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-right text-slate-800 focus:outline-none"
                  />
                  <span className="w-24 text-right text-xs font-bold text-slate-900 tabular-nums">
                    {formatInr((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Subtotal Amount:</span>
              <span className="font-bold text-slate-900 tabular-nums">{formatInr(subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 py-1 border-t border-b border-slate-200/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discount_percent}
                  onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-center font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">GST Rate (%)</label>
                <select
                  value={form.gst_rate}
                  onChange={(e) => setForm((f) => ({ ...f, gst_rate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST (Standard)</option>
                  <option value={28}>28% GST</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between text-amber-700 font-medium">
              <span>Discount ({form.discount_percent || 0}%):</span>
              <span className="tabular-nums">- {formatInr(discountAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>Taxable Amount:</span>
              <span className="tabular-nums">{formatInr(taxableAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-blue-700 font-medium">
              <span>GST Tax ({form.gst_rate || 0}%):</span>
              <span className="tabular-nums">+ {formatInr(gstAmount)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Grand Total Amount:</span>
              <span className="text-[#2563EB] text-base tabular-nums">{formatInr(totalAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Terms & Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
