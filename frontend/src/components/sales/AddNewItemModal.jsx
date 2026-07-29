import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ImagePlus,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import AddCustomFieldModal from "./AddCustomFieldModal";
import { createProduct } from "../../api/productsApi";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from "../../data/productsMasterData";
import { useToast } from "../../context/ToastContext";
import useTenantId from "../../hooks/useTenantId";

const YELLOW = "#F5C518";
const PURPLE = "#6b4eff";
const BLUE = "#2563eb";

const GST_OPTIONS = ["0", "5", "12", "18", "28"];
const TAX_TYPES = ["Exclusive", "Inclusive"];
const CESS_MODES = ["Percent Wise", "Amount Wise"];

const inputClass =
  "w-full rounded-lg border border-[#dcdce3] bg-[#f3f3f6] px-3 py-2.5 text-[13px] text-[#1a1a1f] placeholder:text-[#a0a0ab] focus:border-[#c4b5fd] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#c4b5fd]";

const EMPTY = {
  item_type: "goods",
  name: "",
  description: "",
  sale_price: "",
  tax_type: "Exclusive",
  unit: "",
  gst_pct: "",
  hsn_sac: "",
  cess: "0",
  cess_mode: "Percent Wise",
  category: "",
  purchase_price: "0",
  purchase_tax_type: "Exclusive",
  opening_stock: "",
  barcode: "",
  track_inventory: "",
  low_stock_alert: false,
  secondary_unit_on: false,
  primary_unit: "",
  secondary_unit: "",
  unit_conversion: "",
  price_per_secondary: "",
  wholesale_pricing: false,
  image_url: "",
};

function SoftLabel({ children, required }) {
  return (
    <span className="mb-1.5 block text-[12px] font-semibold text-[#6b6b76]">
      {children}
      {required ? <span className="text-[#e11d48]"> *</span> : null}
    </span>
  );
}

function Accordion({ title, open, onToggle, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e8e8ee] bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-[#f3f3f6] px-4 py-3 text-left"
      >
        <span className="text-[14px] font-semibold text-[#1a1a1f]">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-[#6b6b76] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="space-y-3.5 px-4 py-4">{children}</div> : null}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition ${
        on ? "bg-[#6b4eff]" : "bg-[#d4d4d8]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function AddNewItemModal({ open, onClose, onSaved }) {
  const tenantId = useTenantId();
  const { addToast } = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [showDesc, setShowDesc] = useState(false);
  const [openExtra, setOpenExtra] = useState(false);
  const [openStocks, setOpenStocks] = useState(false);
  const [openOther, setOpenOther] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isGoods = form.item_type === "goods";

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setShowDesc(false);
    setOpenExtra(false);
    setOpenStocks(false);
    setOpenOther(false);
    setCustomFields([]);
    setCustomOpen(false);
  }, [open]);

  if (!open) return null;

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      addToast("Please choose a PNG or JPG image", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image_url: String(reader.result || "") }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const generateBarcode = () => {
    const code = `ITM${Date.now().toString().slice(-8)}`;
    setForm((f) => ({ ...f, barcode: code }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!form.name.trim()) {
      addToast("Item Name is required", "error");
      return;
    }
    if (!form.sale_price && form.sale_price !== "0") {
      addToast("Sale Price is required", "error");
      return;
    }

    setSaving(true);
    try {
      const sku =
        form.barcode.trim() ||
        `SKU-${Date.now().toString().slice(-8)}`;
      const stockQty = Number(form.opening_stock);
      const payload = {
        tenant_id: tenantId,
        sku,
        name: form.name.trim(),
        description: [
          form.description.trim(),
          form.item_type === "services" ? "Type: Service" : "Type: Goods",
          form.hsn_sac
            ? `${isGoods ? "HSN" : "SAC"}: ${form.hsn_sac}`
            : "",
          form.category ? `Category: ${form.category}` : "",
          form.cess && Number(form.cess) ? `CESS: ${form.cess} (${form.cess_mode})` : "",
          ...customFields.map((f) => `${f.label}: ${f.value}`),
        ]
          .filter(Boolean)
          .join(" | ") || null,
        unit_price: Number(form.sale_price) || 0,
        unit_cost: Number(form.purchase_price) || 0,
        unit: form.unit || form.primary_unit || "Pcs",
        current_stock:
          isGoods && Number.isFinite(stockQty) && stockQty >= 1
            ? Math.floor(stockQty)
            : 1,
        min_stock: form.low_stock_alert ? 1 : undefined,
      };

      let product = null;
      try {
        const res = await createProduct(payload);
        product = res?.data || null;
      } catch {
        // Still add to invoice line if master create fails (e.g. permission).
      }

      const line = {
        item_description: form.name.trim(),
        hsn: form.hsn_sac.trim(),
        qty: "1",
        unit: form.unit || "pcs",
        rate: String(form.sale_price || ""),
        tax_type: form.tax_type || "Exclusive",
        discount: "",
        discount_type: "₹",
        gst_pct: form.gst_pct || "",
        amount: 0,
        product_id: product?.id || null,
      };

      addToast("Item added");
      onSaved?.(line, product);
      onClose?.();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to save item", "error");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-new-item-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <form
        onSubmit={onSubmit}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#f3f3f6] shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#ececf0] bg-white px-5 py-4">
          <h2 id="add-new-item-title" className="text-[17px] font-bold text-[#1a1a1f]">
            Add New Item
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#9a9aa5] hover:bg-[#f5f5f7]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <div className="space-y-3.5 rounded-xl bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "goods", label: "Goods" },
                { id: "services", label: "Services" },
              ].map((opt) => {
                const active = form.item_type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, item_type: opt.id }))}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition ${
                      active
                        ? "border-[#F5C518] bg-[#FFF6D6] text-[#1a1a1f]"
                        : "border-[#e4e4ea] bg-white text-[#4a4a55]"
                    }`}
                  >
                    {active ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <span className="h-4 w-4 rounded-full border-2 border-[#c4c4cc]" />
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <label className="block">
              <SoftLabel required>Item Name</SoftLabel>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Enter Name"
                required
                className={inputClass}
              />
            </label>

            {!showDesc ? (
              <button
                type="button"
                onClick={() => setShowDesc(true)}
                className="inline-flex items-center gap-1 text-[13px] font-semibold"
                style={{ color: BLUE }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Description
              </button>
            ) : (
              <label className="block">
                <SoftLabel>Description</SoftLabel>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Enter Description"
                  className={inputClass}
                />
              </label>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <SoftLabel required>Sale Price</SoftLabel>
                <div className="flex overflow-hidden rounded-lg border border-[#dcdce3] bg-[#f3f3f6] focus-within:border-[#c4b5fd] focus-within:ring-1 focus-within:ring-[#c4b5fd]">
                  <span className="flex items-center pl-3 text-[13px] text-[#6b6b76]">₹</span>
                  <input
                    value={form.sale_price}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sale_price: e.target.value.replace(/[^\d.]/g, ""),
                      }))
                    }
                    placeholder="Enter Price"
                    required
                    className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-[13px] outline-none"
                  />
                  <select
                    value={form.tax_type}
                    onChange={(e) => setForm((f) => ({ ...f, tax_type: e.target.value }))}
                    className="border-l border-[#dcdce3] bg-white px-2 text-[12px] outline-none"
                  >
                    {TAX_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="block">
                <SoftLabel>Unit</SoftLabel>
                <select
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select Unit</option>
                  {PRODUCT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <SoftLabel>GST %</SoftLabel>
                <select
                  value={form.gst_pct}
                  onChange={(e) => setForm((f) => ({ ...f, gst_pct: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select GST</option>
                  {GST_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}%
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <div className="mb-1.5 flex items-center justify-between">
                  <SoftLabel>{isGoods ? "HSN" : "SAC"}</SoftLabel>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[12px] font-semibold"
                    style={{ color: BLUE }}
                  >
                    <Search className="h-3.5 w-3.5" />
                    Search
                  </button>
                </div>
                <input
                  value={form.hsn_sac}
                  onChange={(e) => setForm((f) => ({ ...f, hsn_sac: e.target.value }))}
                  placeholder={isGoods ? "Enter HSN" : "Enter SAC"}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <SoftLabel>CESS (Applied on Tax Value)</SoftLabel>
                <div className="flex overflow-hidden rounded-lg border border-[#dcdce3] bg-[#f3f3f6]">
                  <span className="flex items-center pl-3 text-[13px] text-[#6b6b76]">%</span>
                  <input
                    value={form.cess}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cess: e.target.value.replace(/[^\d.]/g, ""),
                      }))
                    }
                    className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-[13px] outline-none"
                  />
                  <select
                    value={form.cess_mode}
                    onChange={(e) => setForm((f) => ({ ...f, cess_mode: e.target.value }))}
                    className="border-l border-[#dcdce3] bg-white px-2 text-[12px] outline-none"
                  >
                    {CESS_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="block">
                <SoftLabel>Category</SoftLabel>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select Category</option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Services">Services</option>
                </select>
              </label>
            </div>

            {customFields.map((field) => (
              <div
                key={field.id}
                className="rounded-lg border border-[#e8e8ee] bg-[#fafafa] px-3 py-2 text-[13px]"
              >
                <span className="font-semibold text-[#1a1a1f]">{field.label}</span>
                {field.value ? (
                  <span className="text-[#6b6b76]"> — {field.value}</span>
                ) : null}
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

          {isGoods ? (
            <>
              <Accordion
                title="Additional Information"
                open={openExtra}
                onToggle={() => setOpenExtra((v) => !v)}
              >
                <label className="block">
                  <SoftLabel>Purchase Price</SoftLabel>
                  <div className="flex overflow-hidden rounded-lg border border-[#dcdce3] bg-[#f3f3f6]">
                    <span className="flex items-center pl-3 text-[13px] text-[#6b6b76]">₹</span>
                    <input
                      value={form.purchase_price}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          purchase_price: e.target.value.replace(/[^\d.]/g, ""),
                        }))
                      }
                      className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-[13px] outline-none"
                    />
                    <select
                      value={form.purchase_tax_type}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, purchase_tax_type: e.target.value }))
                      }
                      className="border-l border-[#dcdce3] bg-white px-2 text-[12px] outline-none"
                    >
                      {TAX_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </Accordion>

              <Accordion
                title="Stocks"
                open={openStocks}
                onToggle={() => setOpenStocks((v) => !v)}
              >
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <SoftLabel>Opening Stock</SoftLabel>
                    <input
                      value={form.opening_stock}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          opening_stock: e.target.value.replace(/[^\d.]/g, ""),
                        }))
                      }
                      placeholder="Enter stock quantity"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1.5 flex items-center justify-between">
                      <SoftLabel>Barcode / Item Code</SoftLabel>
                      <button
                        type="button"
                        onClick={generateBarcode}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ color: BLUE }}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate Barcode
                      </button>
                    </div>
                    <input
                      value={form.barcode}
                      onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                      placeholder="Item code"
                      className={inputClass}
                    />
                  </label>
                </div>
                <div>
                  <SoftLabel>Track Inventory</SoftLabel>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {[
                      { id: "batch", label: "Batch Wise" },
                      { id: "imei", label: "IMEI / Serial No." },
                    ].map((opt) => {
                      const active = form.track_inventory === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              track_inventory: active ? "" : opt.id,
                            }))
                          }
                          className={`rounded-full border px-3 py-1.5 text-[12px] font-medium ${
                            active
                              ? "border-[#F5C518] bg-[#FFF6D6] text-[#1a1a1f]"
                              : "border-[#d8d8e0] bg-white text-[#6b6b76]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#4a4a55]">Low Stock Alert</span>
                  <Toggle
                    on={form.low_stock_alert}
                    onChange={(v) => setForm((f) => ({ ...f, low_stock_alert: v }))}
                  />
                </div>
              </Accordion>
            </>
          ) : null}

          <Accordion
            title="Other details"
            open={openOther}
            onToggle={() => setOpenOther((v) => !v)}
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#4a4a55]">Secondary Unit</span>
              <Toggle
                on={form.secondary_unit_on}
                onChange={(v) => setForm((f) => ({ ...f, secondary_unit_on: v }))}
              />
            </div>

            {form.secondary_unit_on ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <SoftLabel>Primary Unit</SoftLabel>
                    <select
                      value={form.primary_unit}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, primary_unit: e.target.value }))
                      }
                      className={inputClass}
                    >
                      <option value="">Select Primary Unit</option>
                      {PRODUCT_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <SoftLabel>Secondary Unit</SoftLabel>
                    <select
                      value={form.secondary_unit}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, secondary_unit: e.target.value }))
                      }
                      className={inputClass}
                    >
                      <option value="">Select Secondary Unit</option>
                      {PRODUCT_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <SoftLabel>Unit Conversion Ratio</SoftLabel>
                    <input
                      value={form.unit_conversion}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, unit_conversion: e.target.value }))
                      }
                      placeholder="1 unit = ? secondary unit"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <SoftLabel>Price Per Secondary Unit</SoftLabel>
                    <input
                      value={form.price_per_secondary}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          price_per_secondary: e.target.value.replace(/[^\d.]/g, ""),
                        }))
                      }
                      placeholder="Enter Price Per secondary unit"
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {isGoods ? (
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#4a4a55]">Wholesale Pricing</span>
                <Toggle
                  on={form.wholesale_pricing}
                  onChange={(v) => setForm((f) => ({ ...f, wholesale_pricing: v }))}
                />
              </div>
            ) : null}

            <div>
              <SoftLabel>Item Photo (Image format PNG, JPG)</SoftLabel>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-1 flex h-[88px] w-[88px] flex-col items-center justify-center rounded-xl border border-dashed border-[#c8c8d0] bg-[#fafafa] text-[#9a9aa5] hover:border-[#a0a0ab]"
              >
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    alt="Item"
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <ImagePlus className="h-7 w-7" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={onPhoto}
              />
            </div>
          </Accordion>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#ececf0] bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#d8d8e0] bg-[#f0f0f4] py-3 text-[14px] font-semibold text-[#1a1a1f]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl py-3 text-[14px] font-semibold text-[#1a1a1f] disabled:opacity-60"
            style={{ background: YELLOW }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      <AddCustomFieldModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onSave={(field) => setCustomFields((rows) => [...rows, field])}
      />
    </div>,
    document.body
  );
}
