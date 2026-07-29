import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2, FileText } from "lucide-react";
import { createInvoice, getCustomers } from "../../api/salesApi";
import { useToast } from "../../context/ToastContext";
import useTenantId from "../../hooks/useTenantId";

const DEFAULT_CGST = 9;
const DEFAULT_SGST = 9;
const SELLER_STATE_CODE = "36";

const genBillNumber = () => `BILL-${Date.now().toString().slice(-6)}`;
const EMPTY_ITEM = () => ({ item_description: "", qty: "1", unit: "pcs", rate: "0", amount: 0 });

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";

const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider";

const sectionClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4";

const sectionTitle = (title) => (
  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">{title}</h2>
);

const fmt = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(v) || 0);

export default function CreateBill() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const tenantId = useTenantId();
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([EMPTY_ITEM()]);
  const [form, setForm] = useState({
    invoice_number: genBillNumber(),
    customer_id: "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    cgst_pct: String(DEFAULT_CGST),
    sgst_pct: String(DEFAULT_SGST),
    igst_pct: "0",
    discount: "0",
    round_off: "0",
    notes: "",
    billing_address: "",
    shipping_address: "",
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  useEffect(() => {
    getCustomers()
      .then((res) => {
        const arr = Array.isArray(res?.data) ? res.data : [];
        setCustomers(arr);
      })
      .catch(() => setCustomers([]));
  }, []);

  const selectedCustomer = customers.find(
    (c) => String(c.id) === String(form.customer_id)
  );

  useEffect(() => {
    if (!selectedCustomer) return;
    const addr = [selectedCustomer.address_line1, selectedCustomer.address_line2, selectedCustomer.state]
      .filter(Boolean).join(", ");
    const inter = String(selectedCustomer.state_code || "").trim() !== "" &&
      String(selectedCustomer.state_code || "").trim() !== SELLER_STATE_CODE;
    setForm((f) => ({
      ...f,
      billing_address: addr,
      shipping_address: addr,
      cgst_pct: inter ? "0" : String(DEFAULT_CGST),
      sgst_pct: inter ? "0" : String(DEFAULT_SGST),
      igst_pct: inter ? "18" : "0",
    }));
  }, [selectedCustomer?.id]); // eslint-disable-line

  const updateItem = (idx, field, val) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: val };
      if (field === "qty" || field === "rate")
        updated.amount = Math.round((Number(updated.qty) || 0) * (Number(updated.rate) || 0) * 100) / 100;
      return updated;
    }));
  };

  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const discount = Number(form.discount) || 0;
  const cgst = Math.round(subtotal * (Number(form.cgst_pct) / 100) * 100) / 100;
  const sgst = Math.round(subtotal * (Number(form.sgst_pct) / 100) * 100) / 100;
  const igst = Math.round(subtotal * (Number(form.igst_pct) / 100) * 100) / 100;
  const roundOff = Number(form.round_off) || 0;
  const grandTotal = Math.round((subtotal - discount + cgst + sgst + igst + roundOff) * 100) / 100;

  const handleSave = async () => {
    setError("");
    const validItems = items.filter((i) => String(i.item_description || "").trim());
    if (validItems.length === 0) { setError("Add at least one item with a description."); return; }

    let customerIdInt = form.customer_id ? parseInt(form.customer_id, 10) : null;
    if (!customerIdInt || isNaN(customerIdInt)) {
      const matched = customers.find((c) => c.name === form.customer_id || String(c.id) === form.customer_id);
      customerIdInt = matched?.id ? parseInt(matched.id, 10) : null;
    }
    if (!customerIdInt || isNaN(customerIdInt)) {
      setError("Please select a valid customer.");
      return;
    }

    setSaving(true);
    const billNo = (form.invoice_number || "").trim() || genBillNumber();
    const custName = selectedCustomer?.name || "Walk-in Customer";

    const apiPayload = {
      invoice_number: billNo,
      tenant_id: tenantId || 1,
      customer_id: customerIdInt,
      issue_date: form.issue_date,
      due_date: form.due_date || new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      subtotal,
      discount,
      cgst_pct: Number(form.cgst_pct) || 0,
      sgst_pct: Number(form.sgst_pct) || 0,
      igst_pct: Number(form.igst_pct) || 0,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      round_off: roundOff,
      grand_total: grandTotal,
      amount_paid: 0,
      status: "draft",
      items: validItems.map((i) => ({
        item_description: String(i.item_description).trim(),
        qty: Number(i.qty) || 1,
        unit: i.unit || "pcs",
        rate: Number(i.rate) || 0,
        amount: Number(i.amount) || 0,
      })),
    };

    try {
      const res = await createInvoice(apiPayload);
      const savedId = res?.data?.id || res?.id || billNo;
      const localPayload = {
        ...apiPayload,
        id: savedId,
        bill_number: billNo,
        customer_name: custName,
        billing_address: form.billing_address,
        shipping_address: form.shipping_address,
        amount: grandTotal,
        document_type: "bill",
        type: "bill",
        notes: form.notes,
      };
      try {
        const existing = JSON.parse(localStorage.getItem("smrt_sales_bills") || "[]");
        localStorage.setItem("smrt_sales_bills", JSON.stringify([
          localPayload,
          ...existing.filter((b) => b.invoice_number !== billNo),
        ]));
      } catch { /* ignore */ }
      addToast("Bill created successfully!", "success");
      navigate("/sales/bills", { state: { newBill: localPayload } });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg || JSON.stringify(d)).join("; ")
        : detail || err?.message || "Failed to save bill.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* Header */}
      <header className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/sales/bills")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Bill</h1>
          <p className="mt-0.5 text-sm text-slate-500">Fill in the details below to create a new bill.</p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Bill Information */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Bill Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">Basic bill details and customer selection.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Bill Number</label>
            <input type="text" value={form.invoice_number} onChange={set("invoice_number")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Customer *</label>
            <select value={form.customer_id} onChange={set("customer_id")} className={inputClass}>
              <option value="">— Select customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {customers.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-600">
                No customers found.{" "}
                <Link to="/sales/customers/create" className="font-semibold underline">Add one</Link> first.
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Issue Date</label>
            <input type="date" value={form.issue_date} onChange={set("issue_date")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <input type="date" value={form.due_date} onChange={set("due_date")} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className={sectionClass}>
        {sectionTitle("Address Details")}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Billing Address</label>
            <textarea rows={3} value={form.billing_address} onChange={set("billing_address")}
              placeholder="Billing address" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Shipping Address</label>
            <textarea rows={3} value={form.shipping_address} onChange={set("shipping_address")}
              placeholder="Shipping address" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Line Items <span className="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">{items.length}</span>
          </h2>
          <button
            type="button"
            onClick={() => setItems((p) => [...p, EMPTY_ITEM()])}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2563EB] hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Create Item
          </button>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid sm:grid-cols-[2fr_80px_80px_110px_120px_40px] gap-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span>Unit</span>
          <span className="text-right">Rate (₹)</span>
          <span className="text-right">Amount (₹)</span>
          <span />
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[2fr_80px_80px_110px_120px_40px] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
            >
              <input
                type="text"
                placeholder="Item name"
                value={item.item_description}
                onChange={(e) => updateItem(idx, "item_description", e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                inputMode="decimal"
                value={item.qty}
                onChange={(e) => updateItem(idx, "qty", e.target.value)}
                className={`${inputClass} text-right`}
              />
              <select value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} className={inputClass}>
                {["pcs", "kg", "ltr", "box", "set", "hr", "KGS", "MTR", "nos"].map((u) => <option key={u}>{u}</option>)}
              </select>
              <input
                type="text"
                inputMode="decimal"
                value={item.rate}
                onChange={(e) => updateItem(idx, "rate", e.target.value)}
                className={`${inputClass} text-right`}
              />
              <div className="mt-1.5 flex items-center justify-end rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800">
                {Number(item.amount).toLocaleString("en-IN")}
              </div>
              <button
                type="button"
                onClick={() => setItems((p) => p.length > 1 ? p.filter((_, i) => i !== idx) : p)}
                className="mx-auto mt-1.5 flex h-9 w-9 items-center justify-center rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tax & Summary */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Tax */}
        <div className={sectionClass}>
          {sectionTitle("Tax & Adjustments")}
          <div className="space-y-3">
            {[
              { label: "CGST %", key: "cgst_pct" },
              { label: "SGST %", key: "sgst_pct" },
              { label: "IGST %", key: "igst_pct" },
              { label: "Discount (₹)", key: "discount" },
              { label: "Round Off (₹)", key: "round_off" },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form[key]}
                  onChange={set(key)}
                  className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className={sectionClass}>
          {sectionTitle("Bill Summary")}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Amount</span><span className="font-semibold">{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount</span><span className="font-semibold">−{fmt(discount)}</span>
              </div>
            )}
            {cgst > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>CGST ({form.cgst_pct}%)</span><span className="font-semibold">+{fmt(cgst)}</span>
              </div>
            )}
            {sgst > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>SGST ({form.sgst_pct}%)</span><span className="font-semibold">+{fmt(sgst)}</span>
              </div>
            )}
            {igst > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>IGST ({form.igst_pct}%)</span><span className="font-semibold">+{fmt(igst)}</span>
              </div>
            )}
            <div className="mt-3 flex justify-between rounded-xl bg-blue-50 px-4 py-3 text-base font-bold text-slate-900 border border-blue-100">
              <span>Grand Total</span>
              <span className="text-[#2563EB]">{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className={sectionClass}>
        {sectionTitle("Declaration")}
        <textarea
          value={form.notes}
          onChange={set("notes")}
          rows={3}
          placeholder="Declaration for this bill…"
          className={inputClass}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-2">
        <button
          type="button"
          onClick={() => navigate("/sales/bills")}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {saving
            ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving…</>
            : <><Save className="h-4 w-4" /> Save Bill</>}
        </button>
      </div>
    </div>
  );
}
