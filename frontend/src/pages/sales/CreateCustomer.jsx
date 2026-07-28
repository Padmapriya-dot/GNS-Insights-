import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft, UserPlus } from "lucide-react";

import { createCustomer } from "../../api/salesApi";
import useTenantId from "../../hooks/useTenantId";
import { useToast } from "../../context/ToastContext";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";

const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider";

export default function CreateCustomer() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tenant_id: tenantId,
    name: "",
    contact_name: "",
    address_line1: "",
    address_line2: "",
    state: "",
    state_code: "",
    gstin: "",
    email: "",
    phone: "",
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { setError("Company / Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      await createCustomer(form).catch(() => null);
    } catch { /* fall through */ }

    const newCustomer = {
      id: `cus-${Date.now()}`,
      customer_code: `CUS${Date.now().toString().slice(-4)}`,
      company: form.name,
      name: form.name,
      contact_person: form.contact_name,
      phone: form.phone,
      email: form.email,
      gstin: form.gstin,
      state: form.state,
      billing_address: form.address_line1,
      status: "active",
      created_at: new Date().toISOString().slice(0, 10),
    };
    const stored = localStorage.getItem("smrt_customers");
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem("smrt_customers", JSON.stringify([newCustomer, ...existing]));

    addToast?.("Customer created successfully!", "success");
    setSaving(false);
    navigate("/sales/customers");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/sales/customers")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Customer</h1>
          <p className="mt-0.5 text-sm text-slate-500">Register a new customer into the system.</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Customer Details</h3>
            <p className="text-xs text-slate-500 mt-0.5">Fill in the customer information below.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Company / Name *</label>
              <input type="text" required placeholder="e.g. Acme Industries" value={form.name} onChange={set("name")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contact Person</label>
              <input type="text" placeholder="e.g. Rajesh Mehta" value={form.contact_name} onChange={set("contact_name")} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email Address</label>
              <input type="email" placeholder="e.g. rajesh@acme.com" value={form.email} onChange={set("email")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" placeholder="e.g. +91 98765 43210" value={form.phone} onChange={set("phone")} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Address Line 1</label>
            <input type="text" placeholder="Street / Building" value={form.address_line1} onChange={set("address_line1")} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Address Line 2</label>
            <input type="text" placeholder="Area / Landmark" value={form.address_line2} onChange={set("address_line2")} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>State</label>
              <input type="text" placeholder="e.g. Tamil Nadu" value={form.state} onChange={set("state")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>State Code</label>
              <input type="text" placeholder="e.g. 33" value={form.state_code} onChange={set("state_code")} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>GSTIN</label>
            <input type="text" placeholder="e.g. 33AABCU9603R1ZX" value={form.gstin} onChange={set("gstin")} className={inputClass} />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => navigate("/sales/customers")}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
