import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronDown } from "lucide-react";
import useSettings from "../../context/SettingsContext";

const YELLOW = "#F5C518";
const PAGE_BG = "#F3F4F6";
const ROW_BG = "#DBE2F0";
const TOGGLE_ON = "#3B82F6";
const STORAGE_KEY = "gns_invoice_settings_v2";

const SETTINGS = [
  {
    id: "autoSettlePayment",
    title: "Auto Settle Payment",
    description:
      "Automatically adjusts any available advance payments against the newly created invoice to reduce outstanding balances without manual entry.",
    defaultOn: false,
  },
  {
    id: "receivePaymentWhileCreating",
    title: "Receive Payment While Creating Invoice",
    description:
      "Allows you to directly record payment details at the time of invoice creation, so you don't need a separate payment step later.",
    defaultOn: true,
  },
  {
    id: "enableCashDiscount",
    title: "Enable Cash Discount",
    description:
      "Lets you apply a cash discount to invoices during creation, helping encourage early payments and flexible pricing.",
    defaultOn: true,
  },
  {
    id: "enableAdditionalCharges",
    title: "Enable Additional Charges",
    description:
      "Lets you add miscellaneous or additional charges (like packaging, transport, etc.) to invoices, ensuring all costs are covered.",
    defaultOn: true,
  },
  {
    id: "enableRoundOff",
    title: "Enable Round off",
    description:
      "Rounding off invoice totals to the nearest rupee or configurable value for simpler billing and accounting records.",
    defaultOn: true,
  },
  {
    id: "enablePartyBalance",
    title: "Enable Party Balance",
    description:
      "Shows and applies the current party balance during invoice workflows for faster reconciliation and payment tracking.",
    defaultOn: false,
  },
  {
    id: "autoGenerateEwaybill",
    title: "Auto Generate E-waybill",
    description:
      "Automatically creates an E-waybill along with the invoice, saving you an extra step during goods movement.",
    defaultOn: false,
  },
  {
    id: "enableTcsForAllBuyers",
    title: "Enable TCS For All Buyers",
    description:
      "Activates TCS (Tax Collected at Source) calculation on applicable invoices, ensuring compliance for buyers who fall under TCS rules.",
    defaultOn: false,
  },
  {
    id: "taxInclusiveRates",
    title: "Tax Inclusive Rates",
    description:
      "Control whether item rates in the invoice PDF are shown inclusive or exclusive of tax.",
    defaultOn: false,
  },
];

function defaultState() {
  const toggles = {};
  SETTINGS.forEach((s) => {
    toggles[s.id] = s.defaultOn;
  });
  return toggles;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-[22px] w-[40px] shrink-0 rounded-full transition-colors ${
        on ? "" : "bg-[#d1d5db]"
      }`}
      style={on ? { background: TOGGLE_ON } : undefined}
    >
      <span
        className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${
          on ? "left-[20px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}

export default function InvoiceSettingsV2() {
  const navigate = useNavigate();
  const { companyName } = useSettings();
  const company = companyName?.trim() || "My Company";
  const [state, setState] = useState(() => loadState());

  const setToggle = (id) => {
    const next = { ...state, [id]: !state[id] };
    setState(next);
    saveState(next);
  };

  return (
    <div className="min-h-full" style={{ background: PAGE_BG }}>
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-semibold tracking-tight text-[#1a1a1f]">
              Invoice Settings
            </h1>
            <span className="rounded-full bg-[#d4d4d8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5a5a66]">
              v2
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[#d0d0d8] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#1a1a1f]"
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-full"
              style={{ background: YELLOW }}
            >
              <Building2 className="h-4 w-4 text-white" />
            </span>
            {company}
            <ChevronDown className="h-4 w-4 text-[#9a9aa5]" />
          </button>
        </div>

        <div className="rounded-2xl border border-[#e4e4ea] bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-5">
            {SETTINGS.map((item) => (
              <div key={item.id}>
                <div
                  className="flex items-center justify-between gap-3 rounded-lg px-4 py-3"
                  style={{ background: ROW_BG }}
                >
                  <span className="text-[15px] font-semibold text-[#1a1a1f]">{item.title}</span>
                  <Toggle
                    on={!!state[item.id]}
                    label={item.title}
                    onChange={() => setToggle(item.id)}
                  />
                </div>
                <p className="mt-2 px-1 text-[13px] leading-relaxed text-[#6b7280]">
                  {item.description}
                </p>
              </div>
            ))}

            <div>
              <div
                className="flex items-center justify-between gap-3 rounded-lg px-4 py-2.5"
                style={{ background: ROW_BG }}
              >
                <span className="text-[15px] font-semibold text-[#1a1a1f]">Manage Prefixes</span>
                <button
                  type="button"
                  onClick={() => navigate("/settings/prefix-management")}
                  className="rounded-md border border-[#d0d0d8] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#1a1a1f] shadow-sm hover:bg-[#f9fafb]"
                >
                  Manage Prefixes
                </button>
              </div>
              <p className="mt-2 px-1 text-[13px] leading-relaxed text-[#6b7280]">
                Allows you to customize invoice number prefixes (like INV-, GST-, etc.) based on
                financial years, customer type, or invoice type for better organization and tracking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
