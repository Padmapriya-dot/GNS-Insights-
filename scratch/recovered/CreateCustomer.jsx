import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Phone, Receipt } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import { FormRow, Input, Select } from "../../components/common/FormField";
import { useToast } from "../../context/ToastContext";
import { createCustomer } from "../../api/salesApi";
import useTenantId from "../../hooks/useTenantId";
import { INDIAN_STATES } from "../../data/customersMasterData";

const STATE_CODES = {
  "Andhra Pradesh": "37",
  Telangana: "36",
  Karnataka: "29",
  Maharashtra: "27",
  "Tamil Nadu": "33",
  Gujarat: "24",
  Delhi: "07",
  "Uttar Pradesh": "09",
  "West Bengal": "19",
  Rajasthan: "08",
};

const STATE_OPTIONS = INDIAN_STATES.map((name) => ({
  value: name,
  label: `${name}${STATE_CODES[name] ? ` (${STATE_CODES[name]})` : ""}`,
}));

export default function CreateCustomer() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    customer_code: "",
    address_line1: "",
    address_line2: "",
    state: "",
    state_code: "",
    gstin: "",
    email: "",
    phone: "",
    credit_limit: "",
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onStateChange = (state) => {
    setForm((prev) => ({
      ...prev,
      state,
      state_code: STATE_CODES[state] || prev.state_code,
    }));
  };

  const gstinError = useMemo(() => {
    const g = (form.gstin || "").trim().toUpperCase();
    if (!g) return "";
    if (g.length !== 15) return "GSTIN should be 15 characters.";
    if (!/^[0-9A-Z]{15}$/.test(g)) return "Enter a valid GSTIN.";
    return "";
  }, [form.gstin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Company / customer name is required.");
      return;
    }
    if (gstinError) {
      setError(gstinError);
      return;
    }
    setSaving(true);
    try {
      await createCustomer({
        tenant_id: tenantId,
        name: form.name.trim(),
        contact_name: form.contact_name.trim() || null,
        customer_code: form.customer_code.trim() || null,
        address_line1: form.address_line1.trim() || null,
        address_line2: form.address_line2.trim() || null,
        state: form.state || null,
        state_code: form.state_code.trim() || null,
        gstin: form.gstin.trim().toUpperCase() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        credit_limit: form.credit_limit ? Number(form.credit_limit) : 0,
        status: "active",
      });
      addToast("Customer created successfully", "success");
      navigate("/sales/customers");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Failed to create customer.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <Link
        to="/sales/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Link>

      <PageHeader
        title="New customer"
        subtitle="Add a billing customer for quotations, sales orders, and invoices."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <section className="ui-card space-y-4 p-5 sm:p-6">
          <SectionTitle icon={Building2} title="Company" hint="Legal / trading name used on documents" />
          <Input
            label="Company / name"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Acme Manufacturing Pvt Ltd"
            autoFocus
          />
          <FormRow>
            <Input
              label="Contact person"
              value={form.contact_name}
              onChange={(e) => set("contact_name", e.target.value)}
              placeholder="Primary contact name"
            />
            <Input
              label="Customer code"
              value={form.customer_code}
              onChange={(e) => set("customer_code", e.target.value)}
              placeholder="Optional internal code"
              hint="Leave blank if you assign codes later"
            />
          </FormRow>
        </section>

        <section className="ui-card space-y-4 p-5 sm:p-6">
          <SectionTitle icon={MapPin} title="Billing address" hint="Used on invoices and delivery documents" />
          <Input
            label="Address line 1"
            value={form.address_line1}
            onChange={(e) => set("address_line1", e.target.value)}
            placeholder="Street, area, landmark"
          />
          <Input
            label="Address line 2"
            value={form.address_line2}
            onChange={(e) => set("address_line2", e.target.value)}
            placeholder="City / additional line"
          />
          <FormRow className="sm:grid-cols-[1fr_7rem]">
            <Select
              label="State"
              value={form.state}
              onChange={(e) => onStateChange(e.target.value)}
              options={STATE_OPTIONS}
              placeholder="Select state"
            />
            <Input
              label="Code"
              value={form.state_code}
              onChange={(e) => set("state_code", e.target.value)}
              placeholder="37"
              maxLength={2}
              hint="GST state code"
            />
          </FormRow>
        </section>

        <section className="ui-card space-y-4 p-5 sm:p-6">
          <SectionTitle icon={Receipt} title="Tax" hint="GST identification for India invoices" />
          <Input
            label="GSTIN"
            value={form.gstin}
            onChange={(e) => set("gstin", e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            error={gstinError || undefined}
            className="font-mono tracking-wide uppercase sm:max-w-sm"
          />
        </section>

        <section className="ui-card space-y-4 p-5 sm:p-6">
          <SectionTitle icon={Phone} title="Contact & credit" hint="How your team reaches this customer" />
          <FormRow>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="accounts@company.com"
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="10-digit mobile / landline"
            />
          </FormRow>
          <Input
            label="Credit limit (₹)"
            type="number"
            min="0"
            step="0.01"
            value={form.credit_limit}
            onChange={(e) => set("credit_limit", e.target.value)}
            placeholder="0"
            className="sm:max-w-xs"
          />
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button type="submit" disabled={saving} className="ui-btn-primary disabled:opacity-50">
            {saving ? "Saving…" : "Save customer"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/sales/customers")}
            className="ui-btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, hint }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-3 dark:border-slate-700">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </div>
    </div>
  );
}
