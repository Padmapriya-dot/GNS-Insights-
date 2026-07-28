import { useState } from "react";
import { X } from "lucide-react";

import { LEAD_INDUSTRIES, LEAD_REGIONS, LEAD_SOURCES } from "../../data/salesMasterData";

const EMPTY = {
  name: "",
  company: "",
  email: "",
  phone: "",
  source: "",
  industry: "",
  region: "",
  priority: "medium",
  sales_executive: "",
  opportunity_value: "",
  next_followup: "",
  notes: "",
};

export default function CreateLeadModal({ open, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  if (!open) return null;

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Contact / customer name is required.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      company: form.company.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      source: form.source || null,
      industry: form.industry || null,
      region: form.region || null,
      priority: form.priority || "medium",
      sales_executive: form.sales_executive.trim() || null,
      opportunity_value: form.opportunity_value ? Number(form.opportunity_value) : null,
      next_followup: form.next_followup || null,
      notes: form.notes.trim() || null,
      status: "new",
    };
    try {
      await onSubmit?.(payload);
      setForm(EMPTY);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Could not create lead.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">New Lead</h2>
            <p className="text-sm text-slate-500">Capture a customer enquiry to start the sales workflow.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-4">
          {error ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Contact name *" className="sm:col-span-2">
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Customer contact person"
              />
            </Field>
            <Field label="Company">
              <input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Company name"
              />
            </Field>
            <Field label="Phone">
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Mobile / landline"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="email@company.com"
              />
            </Field>
            <Field label="Sales executive">
              <input
                value={form.sales_executive}
                onChange={(e) => set("sales_executive", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Source">
              <select value={form.source} onChange={(e) => set("source", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">Select source</option>
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Industry">
              <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">Select industry</option>
                {LEAD_INDUSTRIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Region">
              <select value={form.region} onChange={(e) => set("region", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">Select region</option>
                {LEAD_REGIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                {["urgent", "high", "medium", "low"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Opportunity value (₹)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.opportunity_value}
                onChange={(e) => set("opportunity_value", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Next follow-up">
              <input
                type="date"
                value={form.next_followup}
                onChange={(e) => set("next_followup", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Requirement summary / enquiry notes"
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="ui-btn-primary disabled:opacity-60">
              {saving ? "Saving…" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}
