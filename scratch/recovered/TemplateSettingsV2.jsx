import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Check, ChevronDown, Settings2 } from "lucide-react";

import useSettings from "../../context/SettingsContext";
import { useToast } from "../../context/ToastContext";

const PAGE_BG = "#F5F5F5";
const YELLOW = "#F5C518";
const BTN_DARK = "#2f323a";
const STORAGE_KEY = "gns_template_settings_v2";

const TABS = [
  { id: "invoice", label: "INVOICE" },
  { id: "quotation", label: "QUOTATION" },
  { id: "purchase", label: "PURCHASE" },
];

const SIZES = ["SMALL", "MEDIUM", "LARGE"];

const TEMPLATE_COLORS = [
  "#93c5fd",
  "#166534",
  "#dc2626",
  "#5b21b6",
  "#84cc16",
  "#d2b48c",
  "#7f1d1d",
  "#ffffff",
  "#7c3aed",
  "#db2777",
  "#f9a8d4",
  "#ea580c",
  "#eab308",
  "#facc15",
  "#111827",
  "#9ca3af",
  "#2563eb",
  "#6b7280",
  "#c2410c",
  "#78350f",
];

const TEMPLATES = {
  invoice: [
    { id: "classic", name: "", style: "classic" },
    { id: "modern", name: "MODERN", style: "modern" },
    { id: "latest", name: "LATEST", style: "latest" },
  ],
  quotation: [
    { id: "classic", name: "", style: "classic" },
    { id: "modern", name: "Modern", style: "modern" },
  ],
  purchase: [
    { id: "classic", name: "PURCHASE-CLASSIC", style: "classic" },
    { id: "modern", name: "PURCHASE-MODERN", style: "modern" },
  ],
};

function defaultState() {
  return {
    selected: { invoice: "classic", quotation: "classic", purchase: "classic" },
    options: {
      companyNameSize: "SMALL",
      headerNameSize: "SMALL",
      logoSize: "LARGE",
      color: "#93c5fd",
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed, options: { ...defaultState().options, ...parsed.options } };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function DocPreview({ style, accent, title }) {
  const a = accent || "#2563eb";
  return (
    <div className="mx-auto aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded border border-[#d8d8e0] bg-white p-2 text-[5px] leading-tight text-[#1a1a1f] shadow-sm">
      <div
        className={`mb-1 flex items-start justify-between gap-1 border-b pb-1 ${
          style === "modern" ? "border-b-2" : "border-[#e5e5ea]"
        }`}
        style={style === "modern" || style === "latest" ? { borderColor: a } : undefined}
      >
        <div>
          <div className="h-3 w-3 rounded-sm" style={{ background: a }} />
          <div className="mt-0.5 font-bold">My Company</div>
          <div className="text-[#6b6b76]">GSTIN · Address</div>
        </div>
        <div className="text-right font-bold" style={{ color: a }}>
          {title}
        </div>
      </div>
      <div className="mb-1 grid grid-cols-2 gap-1">
        <div className="rounded border border-[#ececf0] p-0.5">
          <div className="font-semibold">Bill To</div>
          <div className="text-[#6b6b76]">Party Name</div>
        </div>
        <div className="rounded border border-[#ececf0] p-0.5">
          <div className="font-semibold">Ship To</div>
          <div className="text-[#6b6b76]">Address</div>
        </div>
      </div>
      <div className="mb-1 overflow-hidden rounded border border-[#ececf0]">
        <div className="grid grid-cols-4 px-0.5 py-0.5 font-semibold text-white" style={{ background: a }}>
          <span>Item</span>
          <span>Qty</span>
          <span>Rate</span>
          <span>Amt</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-4 border-t border-[#f0f0f4] px-0.5 py-0.5 text-[#4a4a55]">
            <span>Item {i}</span>
            <span>1</span>
            <span>100</span>
            <span>100</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <div className="text-[#6b6b76]">Terms &amp; Notes</div>
        <div className="text-right">
          <div>Subtotal 300</div>
          <div className="font-bold" style={{ color: a }}>
            Total 300
          </div>
        </div>
      </div>
      <div className="mt-2 border-t border-dashed border-[#d8d8e0] pt-1 text-right text-[#6b6b76]">
        Authorized Signatory
      </div>
    </div>
  );
}

function SizeRow({ label, value, onChange }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#d8d8e0]">
      <div className="bg-[#93c5fd] px-3 py-2 text-[13px] font-semibold text-[#1a1a1f]">{label}</div>
      <div className="flex flex-wrap gap-4 bg-white px-3 py-3">
        {SIZES.map((size) => (
          <label key={size} className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium text-[#1a1a1f]">
            <span
              className={`grid h-[16px] w-[16px] place-items-center rounded-full border ${
                value === size ? "border-[#1a1a1f]" : "border-[#b0b0b8]"
              }`}
            >
              {value === size ? <span className="h-2 w-2 rounded-full bg-[#1a1a1f]" /> : null}
            </span>
            <input
              type="radio"
              className="sr-only"
              checked={value === size}
              onChange={() => onChange(size)}
            />
            {size}
          </label>
        ))}
      </div>
    </div>
  );
}

function CustomiseModal({ open, onClose, options, onApply }) {
  const [draft, setDraft] = useState(options);
  const [colorOpen, setColorOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(options);
    setColorOpen(false);
  }, [open, options]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="max-h-[80vh] space-y-3 overflow-y-auto px-5 py-5">
          <SizeRow
            label="Company Name Size"
            value={draft.companyNameSize}
            onChange={(v) => setDraft((d) => ({ ...d, companyNameSize: v }))}
          />
          <SizeRow
            label="Header Name Size"
            value={draft.headerNameSize}
            onChange={(v) => setDraft((d) => ({ ...d, headerNameSize: v }))}
          />
          <SizeRow
            label="Logo Size"
            value={draft.logoSize}
            onChange={(v) => setDraft((d) => ({ ...d, logoSize: v }))}
          />

          <div>
            <button
              type="button"
              onClick={() => setColorOpen((v) => !v)}
              className="mb-3 w-full rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold text-[#1a1a1f]"
              style={{ background: "#93c5fd" }}
            >
              Select template Color
            </button>
            {colorOpen ? (
              <div className="flex flex-wrap justify-center gap-2.5 px-1 pb-1">
                {TEMPLATE_COLORS.map((c) => {
                  const active = draft.color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, color: c }))}
                      className={`grid h-8 w-8 place-items-center rounded-full border ${
                        c === "#ffffff" ? "border-[#d0d0d8]" : "border-transparent"
                      }`}
                      style={{ background: c }}
                      aria-label={`Color ${c}`}
                    >
                      {active ? (
                        <Check
                          className={`h-4 w-4 ${
                            c === "#ffffff" || c === "#facc15" || c === "#eab308" || c === "#84cc16"
                              ? "text-[#1a1a1f]"
                              : "text-white"
                          }`}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex justify-start px-1">
                <span
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#d0d0d8]"
                  style={{ background: draft.color }}
                >
                  <Check
                    className={`h-4 w-4 ${
                      draft.color === "#ffffff" || draft.color === "#facc15"
                        ? "text-[#1a1a1f]"
                        : "text-white"
                    }`}
                  />
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-[14px] font-medium text-[#1a1a1f] hover:underline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="rounded-lg px-5 py-2.5 text-[14px] font-semibold text-white"
            style={{ background: BTN_DARK }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function TemplateSettingsV2() {
  const { companyName } = useSettings();
  const { addToast } = useToast();
  const company = companyName?.trim() || "My Company";

  const [state, setState] = useState(() => loadState());
  const [tab, setTab] = useState("invoice");
  const [customiseFor, setCustomiseFor] = useState(null);

  const templates = TEMPLATES[tab] || [];
  const selectedId = state.selected[tab];
  const accent = state.options.color;

  const docTitle = useMemo(() => {
    if (tab === "quotation") return "Quotation";
    if (tab === "purchase") return "Purchase Order";
    return "Tax Invoice";
  }, [tab]);

  const persist = (next) => {
    setState(next);
    saveState(next);
  };

  const useTemplate = (id) => {
    try {
      const next = {
        ...state,
        selected: { ...state.selected, [tab]: id },
      };
      persist(next);
      addToast("Template Update successfully", "success");
    } catch {
      addToast("Failed to select template", "error");
    }
  };

  return (
    <div className="min-h-full" style={{ background: PAGE_BG }}>
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-semibold tracking-tight text-[#1a1a1f]">
              Template Settings
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

        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-5 py-2.5 text-[13px] font-bold tracking-wide ${
                  active ? "text-[#1a1a1f]" : "bg-[#ececf0] text-[#4a4a55]"
                }`}
                style={active ? { background: YELLOW } : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[#e4e4ea] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-6">
            {templates.map((tpl) => {
              const selected = selectedId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className={`w-full max-w-[260px] rounded-2xl p-4 ${
                    selected ? "bg-[#2f323a]" : "bg-transparent"
                  }`}
                >
                  <DocPreview style={tpl.style} accent={accent} title={docTitle} />
                  {tpl.name ? (
                    <div
                      className={`mt-3 text-center text-[14px] font-bold uppercase tracking-wide ${
                        selected ? "text-white" : "text-[#1a1a1f]"
                      }`}
                    >
                      {tpl.name}
                    </div>
                  ) : (
                    <div className="mt-3 h-5" />
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomiseFor(tpl.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d0d0d8] bg-white py-2 text-[12px] font-semibold text-[#1a1a1f]"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      Customise
                    </button>
                    <button
                      type="button"
                      onClick={() => useTemplate(tpl.id)}
                      className="rounded-lg py-2 text-[12px] font-semibold text-white"
                      style={{ background: BTN_DARK }}
                    >
                      Use This
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CustomiseModal
        open={Boolean(customiseFor)}
        onClose={() => setCustomiseFor(null)}
        options={state.options}
        onApply={(opts) => {
          persist({ ...state, options: opts });
          setCustomiseFor(null);
          addToast("Template Update successfully", "success");
        }}
      />
    </div>
  );
}
