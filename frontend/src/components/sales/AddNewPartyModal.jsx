import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, X } from "lucide-react";

import AddBasicDetailsModal from "./AddBasicDetailsModal";
import AddCustomFieldModal from "./AddCustomFieldModal";
import AddOtherDetailsModal from "./AddOtherDetailsModal";
import { createCustomer } from "../../api/salesApi";
import { lookupIndianPincode } from "../../api/addressLookupApi";
import { INDIAN_STATES } from "../../data/customersMasterData";
import { useToast } from "../../context/ToastContext";
import useTenantId from "../../hooks/useTenantId";

const YELLOW = "#F5C518";
const PURPLE = "#6b4eff";

const inputClass =
  "w-full rounded-lg border border-[#e4e4ea] bg-[#f3f3f6] px-3 py-2.5 text-[13px] text-[#1a1a1f] placeholder:text-[#a0a0ab] focus:border-[#c4b5fd] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#c4b5fd]";

const EMPTY = {
  gstin: "",
  name: "",
  phone: "",
  address_line1: "",
  pincode: "",
  city: "",
  state: "",
};

const EMPTY_BASIC = {
  payment_terms_days: "",
  opening_balance: "",
  balance_type: "to_receive",
  email: "",
};

const EMPTY_OTHER = {
  party_type: "Buyer",
  gst_treatment: "",
  tax_preference: "Taxable",
  tds: false,
  tcs: false,
};

function SoftField({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-[#8a8a95]">
        {label}
        {required ? <span className="text-[#e11d48]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

export default function AddNewPartyModal({ open, onClose, onSaved }) {
  const tenantId = useTenantId();
  const { addToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [cities, setCities] = useState([]);
  const [showBilling, setShowBilling] = useState(false);
  const [basicDetails, setBasicDetails] = useState(null);
  const [basicOpen, setBasicOpen] = useState(false);
  const [otherDetails, setOtherDetails] = useState(null);
  const [otherOpen, setOtherOpen] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setCities([]);
    setShowBilling(false);
    setBasicDetails(null);
    setBasicOpen(false);
    setOtherDetails(null);
    setOtherOpen(false);
    setCustomFields([]);
    setCustomOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open || !showBilling) return;
    const pin = String(form.pincode || "").replace(/\D/g, "");
    if (pin.length !== 6) return;
    let cancelled = false;
    lookupIndianPincode(pin)
      .then((data) => {
        if (cancelled || !data) return;
        setForm((f) => ({
          ...f,
          city: data.city || data.district || f.city,
          state: data.state || f.state,
        }));
        const opts = [];
        if (data.city) opts.push(data.city);
        if (data.district && data.district !== data.city) opts.push(data.district);
        if (data.post_office) opts.push(data.post_office);
        setCities([...new Set(opts.filter(Boolean))]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [form.pincode, open, showBilling]);

  if (!open) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast("Company Name is required", "error");
      return;
    }
    setSaving(true);
    try {
      const addressParts = [
        form.address_line1.trim(),
        form.city,
        form.pincode,
      ].filter(Boolean);
      const extraNotes = [
        basicDetails?.payment_terms_days
          ? `Payment Terms: ${basicDetails.payment_terms_days} Days`
          : "",
        basicDetails?.balance_type
          ? `Balance: ${basicDetails.balance_type === "to_pay" ? "To Pay" : "To Receive"}`
          : "",
        otherDetails?.party_type ? `Party type: ${otherDetails.party_type}` : "",
        otherDetails?.gst_treatment ? `GST Treatment: ${otherDetails.gst_treatment}` : "",
        otherDetails?.tax_preference ? `Tax Preference: ${otherDetails.tax_preference}` : "",
        otherDetails?.tds ? "TDS: Yes" : "",
        otherDetails?.tcs ? "TCS: Yes" : "",
        ...customFields.map((f) => `${f.label}: ${f.value}`),
      ]
        .filter(Boolean)
        .join(" | ");

      const opening = basicDetails?.opening_balance
        ? Number(basicDetails.opening_balance)
        : 0;

      const res = await createCustomer({
        tenant_id: tenantId,
        name: form.name.trim(),
        gstin: form.gstin.trim().toUpperCase() || null,
        phone: form.phone.trim() || null,
        email: basicDetails?.email?.trim() || null,
        address_line1: addressParts[0] || null,
        address_line2: [form.city, form.pincode, extraNotes].filter(Boolean).join(", ") || null,
        state: form.state || null,
        credit_limit: 0,
        outstanding: opening,
        status: "active",
      });
      addToast("Buyer added successfully");
      onSaved?.(res.data);
      onClose?.();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to add buyer", "error");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <form
        onSubmit={onSubmit}
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#ececf0] px-5 py-4">
          <h2 className="text-[17px] font-bold text-[#1a1a1f]">Add New Party</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#9a9aa5] hover:bg-[#f5f5f7]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3.5">
            <SoftField label="GSTIN">
              <input
                value={form.gstin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))
                }
                placeholder="Enter GSTIN"
                className={inputClass}
              />
            </SoftField>

            <div className="grid grid-cols-2 gap-3">
              <SoftField label="Company Name" required>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Enter Company Name"
                  required
                  className={inputClass}
                />
              </SoftField>
              <SoftField label="Mobile No.">
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    }))
                  }
                  placeholder="Enter Mobile No."
                  className={inputClass}
                />
              </SoftField>
            </div>

            {!showBilling ? (
              <button
                type="button"
                onClick={() => setShowBilling(true)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#1a1a1f]"
                style={{ background: YELLOW }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Billing Address
              </button>
            ) : (
              <div className="space-y-3 rounded-xl border border-[#ececf0] bg-[#fafafa] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-[#1a1a1f]">Billing Address</p>
                  <button
                    type="button"
                    onClick={() => setShowBilling(false)}
                    className="text-[12px] font-medium text-[#9a9aa5] hover:text-[#e11d48]"
                  >
                    Remove
                  </button>
                </div>
                <SoftField label="Address">
                  <input
                    value={form.address_line1}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address_line1: e.target.value }))
                    }
                    placeholder="Enter Address"
                    className={inputClass}
                  />
                </SoftField>
                <div className="grid grid-cols-2 gap-3">
                  <SoftField label="Pincode">
                    <input
                      value={form.pincode}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      placeholder="Enter Pincode"
                      className={inputClass}
                    />
                  </SoftField>
                  <SoftField label="City">
                    <select
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="">Select City</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      {form.city && !cities.includes(form.city) ? (
                        <option value={form.city}>{form.city}</option>
                      ) : null}
                    </select>
                  </SoftField>
                </div>
                <SoftField label="State">
                  <select
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </SoftField>
              </div>
            )}
          </div>

          <div className="border-t border-[#ececf0]">
            <div className="flex items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#1a1a1f]">Basic Details</p>
                <p className="truncate text-[12px] text-[#9a9aa5]">
                  {basicDetails
                    ? [
                        basicDetails.payment_terms_days
                          ? `${basicDetails.payment_terms_days} Days`
                          : null,
                        basicDetails.opening_balance
                          ? `₹${basicDetails.opening_balance}`
                          : null,
                        basicDetails.email || null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Opening Balance, Payment Terms, Credit Limit"
                    : "Opening Balance, Payment Terms, Credit Limit"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBasicOpen(true)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#1a1a1f]"
                style={{ background: YELLOW }}
              >
                <Plus className="h-3.5 w-3.5" />
                {basicDetails ? "Edit" : "Add"}
              </button>
            </div>
          </div>

          <div className="border-t border-[#ececf0]">
            <div className="flex items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#1a1a1f]">Other Details</p>
                <p className="truncate text-[12px] text-[#9a9aa5]">
                  {otherDetails
                    ? [
                        otherDetails.party_type,
                        otherDetails.gst_treatment,
                        otherDetails.tax_preference,
                        otherDetails.tds ? "TDS" : null,
                        otherDetails.tcs ? "TCS" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "Tax Settings, TDS / TCS, Party type"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOtherOpen(true)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#1a1a1f]"
                style={{ background: YELLOW }}
              >
                <Plus className="h-3.5 w-3.5" />
                {otherDetails ? "Edit" : "Add"}
              </button>
            </div>
          </div>

          <div className="border-t border-[#ececf0] pt-3.5">
            {customFields.map((field) => (
              <div
                key={field.id}
                className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-[#e8e8ee] bg-[#fafafa] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#1a1a1f]">
                    {field.label}
                  </p>
                  {field.value ? (
                    <p className="mt-0.5 truncate text-[12px] text-[#6b6b76]">{field.value}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCustomFields((rows) => rows.filter((x) => x.id !== field.id))
                  }
                  className="rounded p-1 text-[#9a9aa5] hover:bg-[#f0f0f4] hover:text-[#e11d48]"
                  aria-label={`Remove ${field.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCustomOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#c4b5fd] bg-white px-3 py-2 text-[13px] font-semibold"
              style={{ color: PURPLE }}
            >
              <Plus className="h-4 w-4" />
              Add Custom Field
            </button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#ececf0] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#d8d8e0] bg-[#e8e8ee] py-3 text-[14px] font-semibold text-[#1a1a1f]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl py-3 text-[14px] font-semibold text-[#1a1a1f] disabled:opacity-60"
            style={{ background: YELLOW }}
          >
            {saving ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>

      <AddBasicDetailsModal
        open={basicOpen}
        onClose={() => setBasicOpen(false)}
        initial={basicDetails || EMPTY_BASIC}
        onSave={setBasicDetails}
      />
      <AddOtherDetailsModal
        open={otherOpen}
        onClose={() => setOtherOpen(false)}
        initial={otherDetails || EMPTY_OTHER}
        onSave={setOtherDetails}
      />
      <AddCustomFieldModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onSave={(field) => setCustomFields((rows) => [...rows, field])}
      />
    </div>,
    document.body
  );
}
