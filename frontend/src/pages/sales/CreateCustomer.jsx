import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Phone, Receipt } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import { FormRow, Input, Select } from "../../components/common/FormField";
import { useToast } from "../../context/ToastContext";
import { createCustomer } from "../../api/salesApi";
import useTenantId from "../../hooks/useTenantId";
import { INDIAN_STATES } from "../../data/customersMasterData";
import CITIES_MAP from "../../data/indiaCitiesToStates.json";

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

// ── Validators ────────────────────────────────────────────────────────────────
const VALIDATORS = {
  name: (v) => {
    if (!v.trim()) return "Company / customer name is required.";
    return "";
  },
  contact_name: (v) => {
    if (!v.trim()) return "";
    if (!/^[A-Za-z\s.'-]+$/.test(v.trim()))
      return "Contact person name should contain only letters.";
    return "";
  },
  customer_code: (v) => {
    if (!v.trim()) return "";
    if (!/^[A-Za-z0-9_-]+$/.test(v.trim()))
      return "Customer code must be alphanumeric (letters, digits, - or _).";
    return "";
  },
  city: (v) => {
    if (!v.trim()) return "";
    if (!/^[A-Za-z\s.'-]+$/.test(v.trim()))
      return "City should contain only letters.";
    return "";
  },
  email: (v) => {
    if (!v.trim()) return "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))
      return "Enter a valid email address.";
    return "";
  },
  phone: (v) => {
    if (!v.trim()) return "";
    if (!/^\d{10}$/.test(v.trim()))
      return "Phone must be exactly 10 digits (numbers only).";
    return "";
  },
  credit_limit: (v) => {
    if (v === "" || v == null) return "";
    if (isNaN(Number(v)) || Number(v) < 0)
      return "Credit limit must be a non-negative number.";
    return "";
  },
  gstin: (v) => {
    const g = (v || "").trim().toUpperCase();
    if (!g) return "";
    if (g.length !== 15) return "GSTIN should be exactly 15 characters.";
    if (!/^[0-9A-Z]{15}$/.test(g)) return "Enter a valid GSTIN (alphanumeric, uppercase).";
    return "";
  },
};

export default function CreateCustomer() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    customer_code: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    state_code: "",
    gstin: "",
    email: "",
    phone: "",
    credit_limit: "",
  });

  const getStateForCity = (city) => {
    if (!city) return null;
    const key = String(city).trim().toLowerCase();
    return CITIES_MAP[key] || null;
  };

  // Validate a single field and update fieldErrors
  const validateField = (key, value) => {
    const fn = VALIDATORS[key];
    if (!fn) return "";
    const err = fn(value);
    setFieldErrors((prev) => ({ ...prev, [key]: err }));
    return err;
  };

  const set = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "city") {
        const mapped = getStateForCity(value);
        const prevMapped = getStateForCity(prev.city);
        if (mapped && (!prev.state || prev.state === "" || prev.state === prevMapped)) {
          next.state = mapped;
          next.state_code = STATE_CODES[mapped] || prev.state_code || "";
        }
      }
      return next;
    });
    // Live-validate on change (except on first keystroke to avoid annoying errors)
    if (value) validateField(key, value);
    else setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const onStateChange = (state) => {
    setForm((prev) => ({
      ...prev,
      state,
      state_code: STATE_CODES[state] || prev.state_code,
    }));
  };

  // Only allow digit keystrokes in phone field
  const onPhoneKeyDown = (e) => {
    const allowedKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (allowedKeys.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return; // allow copy/paste shortcuts
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  // Full form validation before submit
  const validateAll = () => {
    const keys = ["name", "contact_name", "customer_code", "city", "email", "phone", "credit_limit", "gstin"];
    const errors = {};
    let hasError = false;
    keys.forEach((key) => {
      const err = VALIDATORS[key] ? VALIDATORS[key](form[key]) : "";
      errors[key] = err;
      if (err) hasError = true;
    });
    setFieldErrors(errors);
    return !hasError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateAll()) {
      addToast("Please fix the highlighted fields before saving.", "error");
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
        city: form.city.trim() || null,
        state: form.state || null,
        state_code: form.state_code.trim() || null,
        gstin: form.gstin.trim().toUpperCase() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        credit_limit:
          form.credit_limit != null && form.credit_limit !== ""
            ? Number(form.credit_limit)
            : undefined,
        status: "active",
      });
      addToast("Customer created successfully", "success");
      navigate("/sales/customers");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Failed to create customer.";
      setSubmitError(msg);
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

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {submitError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {submitError}
          </div>
        ) : null}

        {/* ── Company ────────────────────────────────── */}
        <section className="ui-card space-y-4 p-5 sm:p-6">
          <SectionTitle icon={Building2} title="Company" hint="Legal / trading name used on documents" />
          <Input
            label="Company / name"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Acme Manufacturing Pvt Ltd"
            autoFocus
            error={fieldErrors.name}
          />
          <FormRow>
            <Input
              label="Contact person"
              value={form.contact_name}
              onChange={(e) => set("contact_name", e.target.value)}
              placeholder="Primary contact name"
              error={fieldErrors.contact_name}
              hint="Letters only"
            />
            <Input
              label="Customer code"
              value={form.customer_code}
              onChange={(e) => set("customer_code", e.target.value)}
              placeholder="Optional internal code"
              hint="Alphanumeric, - or _"
              error={fieldErrors.customer_code}
            />
          </FormRow>
        </section>

        {/* ── Billing address ────────────────────────── */}
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
          <Input
            label="City"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="e.g. Lucknow"
            error={fieldErrors.city}
            hint="Letters only"
          />
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
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
          </div>
        </section>

        {/* ── Tax ───────────────────────────────────── */}
        <section className="ui-card space-y-4 p-5 sm:p-6">
          <SectionTitle icon={Receipt} title="Tax" hint="GST identification for India invoices" />
          <Input
            label="GSTIN"
            value={form.gstin}
            onChange={(e) => set("gstin", e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            error={fieldErrors.gstin}
            className="font-mono tracking-wide uppercase sm:max-w-sm"
            hint="15-character alphanumeric GST number"
          />
        </section>

        {/* ── Contact & Credit ──────────────────────── */}
        <section className="ui-card space-y-4 p-5 sm:p-6">
          <SectionTitle icon={Phone} title="Contact & credit" hint="How your team reaches this customer" />
          <FormRow>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="accounts@company.com"
              error={fieldErrors.email}
            />
            <Input
              label="Phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={(e) => {
                // Strip non-digits on paste/autofill too
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                set("phone", digits);
              }}
              onKeyDown={onPhoneKeyDown}
              placeholder="10-digit mobile number"
              error={fieldErrors.phone}
              hint="Numbers only, 10 digits"
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
            error={fieldErrors.credit_limit}
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
