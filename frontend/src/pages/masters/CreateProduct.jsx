import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle, ImagePlus } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import { FormRow, Input, Select, Textarea } from "../../components/common/FormField";
import StoreManagerNav from "../../components/inventory/StoreManagerNav";
import { useToast } from "../../context/ToastContext";
import usePermissions from "../../hooks/usePermissions";
import useTenantId from "../../hooks/useTenantId";
import { createProduct, getProductDetail, updateProduct } from "../../api/productsApi";
import { PRODUCT_UNITS, WAREHOUSES } from "../../data/productsMasterData";
import { isStoreManager } from "../../config/permissions";

const CATEGORY_OPTIONS = [
  "Raw Material",
  "Packaging Material",
  "Finished Goods",
  "WIP",
  "Consumables",
  "Spare Parts",
  "Utility / Raw Material",
].map((c) => ({ value: c, label: c }));

const UNIT_OPTIONS = PRODUCT_UNITS.map((u) => ({ value: u, label: u }));
const WAREHOUSE_OPTIONS = WAREHOUSES.map((w) => ({ value: w, label: w }));
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const EMPTY = {
  product_code: "",
  name: "",
  category: "Raw Material",
  unit: "Pcs",
  warehouse: "Main Store",
  min_stock: "1",
  current_stock: "0",
  purchase_price: "",
  selling_price: "",
  description: "",
  status: "active",
  image_url: "",
};

function nextProductCode() {
  return `PRD-${Date.now().toString().slice(-6)}`;
}

function hiddenSku(name, code) {
  const base = String(code || name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return base || `ITEM-${Date.now().toString().slice(-6)}`;
}

export default function CreateProduct() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = usePermissions();
  const storeMode = isStoreManager(user);

  const [form, setForm] = useState(() => ({
    ...EMPTY,
    product_code: nextProductCode(),
  }));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [codeManual, setCodeManual] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    setLoading(true);
    getProductDetail(id)
      .then((res) => {
        if (cancelled) return;
        const p = res.data || {};
        setForm({
          product_code: p.product_code || p.code || nextProductCode(),
          name: p.name || "",
          category: p.category || "Raw Material",
          unit: p.unit || p.unit_of_measure || "Pcs",
          warehouse: p.warehouse || "Main Store",
          min_stock: String(p.min_stock ?? 1),
          current_stock: String(p.current_stock ?? 0),
          purchase_price: p.purchase_price != null ? String(p.purchase_price) : p.unit_cost != null ? String(p.unit_cost) : "",
          selling_price: p.selling_price != null ? String(p.selling_price) : p.unit_price != null ? String(p.unit_price) : "",
          description: p.description || "",
          status: p.status || "active",
          image_url: p.image_url || "",
        });
        setCodeManual(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load product.");
          addToast("Could not load product", "error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, addToast]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const isFinished = String(form.category || "").toLowerCase().includes("finish");
  const numericOk = (v) => v === "" || /^(0|[1-9]\d*)(\.\d+)?$/.test(String(v));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const errs = {};
    if (!form.name.trim()) errs.name = "Product name is required";
    if (!form.product_code.trim()) errs.product_code = "Product code is required";
    if (!numericOk(form.min_stock)) errs.min_stock = "Enter a valid number";
    if (!numericOk(form.current_stock)) errs.current_stock = "Enter a valid number";
    if (form.purchase_price && !numericOk(form.purchase_price)) errs.purchase_price = "Enter a valid price";
    if (isFinished && form.selling_price && !numericOk(form.selling_price)) errs.selling_price = "Enter a valid price";
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      document.querySelector(`[name="${first}"]`)?.focus?.();
      return;
    }

    const minStock = Number(form.min_stock) || 0;
    const currentStock = Number(form.current_stock) || 0;
    const purchase = form.purchase_price === "" ? null : Number(form.purchase_price);
    const selling = isFinished && form.selling_price !== "" ? Number(form.selling_price) : null;

    const payload = {
      tenant_id: Number(tenantId) || 1,
      sku: hiddenSku(form.name, form.product_code),
      product_code: form.product_code.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      warehouse: form.warehouse,
      unit_cost: purchase,
      unit_price: selling,
      purchase_price: purchase,
      selling_price: selling,
      min_stock: minStock,
      current_stock: currentStock,
      max_stock: Math.max(minStock * 10, currentStock, 100),
      unit: form.unit || "Pcs",
      status: form.status,
      image_url: form.image_url || null,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateProduct(id, payload);
        addToast("Product updated");
      } else {
        await createProduct(payload);
        addToast("Product created");
      }
      navigate("/masters/products");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg || d.message).filter(Boolean).join(", ")
            : isEdit
              ? "Failed to update product."
              : "Failed to create product.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading product…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      {storeMode ? <StoreManagerNav /> : null}

      <Link
        to="/masters/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <PageHeader
        title={isEdit ? "Edit Product" : "Add Product"}
        subtitle="Essential store fields only. Product code identifies the item."
      />

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" noValidate>
        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <section>
          <h3 className="mb-3 text-sm font-bold text-slate-800">Basic details</h3>
          <div className="space-y-4">
            <FormRow>
              <Input
                name="product_code"
                label="Product Code"
                required
                placeholder="Auto-generated"
                value={form.product_code}
                onChange={(e) => {
                  setCodeManual(true);
                  set("product_code", e.target.value);
                }}
                error={fieldErrors.product_code}
                hint={codeManual ? "Manual override" : "Auto-generated — you can edit"}
              />
              <Input
                name="name"
                label="Product Name"
                required
                autoFocus
                placeholder="e.g. HDPE Bottle Cap"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                error={fieldErrors.name}
              />
            </FormRow>

            <FormRow className="sm:grid-cols-3">
              <Select
                label="Product Category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                options={CATEGORY_OPTIONS}
              />
              <Select
                label="Unit of Measure"
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
                options={UNIT_OPTIONS}
              />
              <Select
                label="Warehouse"
                value={form.warehouse}
                onChange={(e) => set("warehouse", e.target.value)}
                options={WAREHOUSE_OPTIONS}
              />
            </FormRow>

            <Select
              label="Product Status"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold text-slate-800">Stock levels</h3>
          <FormRow>
            <Input
              name="current_stock"
              label="Current Stock"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={form.current_stock}
              onChange={(e) => set("current_stock", e.target.value)}
              error={fieldErrors.current_stock}
            />
            <Input
              name="min_stock"
              label="Minimum Stock"
              type="number"
              min="0"
              step="1"
              placeholder="1"
              value={form.min_stock}
              onChange={(e) => set("min_stock", e.target.value)}
              error={fieldErrors.min_stock}
              hint="Alert when stock falls to this level"
            />
          </FormRow>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold text-slate-800">Pricing</h3>
          <FormRow>
            <Input
              name="purchase_price"
              label="Purchase Price (optional)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.purchase_price}
              onChange={(e) => set("purchase_price", e.target.value)}
              error={fieldErrors.purchase_price}
            />
            {isFinished ? (
              <Input
                name="selling_price"
                label="Selling Price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.selling_price}
                onChange={(e) => set("selling_price", e.target.value)}
                error={fieldErrors.selling_price}
                hint="Shown for Finished Goods only"
              />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Selling price applies only to Finished Goods.
              </div>
            )}
          </FormRow>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold text-slate-800">Notes & image</h3>
          <Textarea
            label="Description"
            rows={3}
            placeholder="Optional notes for store team"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Product Image (optional)</label>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
              <ImagePlus className="h-5 w-5 text-slate-400" />
              <input
                type="url"
                placeholder="Paste image URL (upload coming soon)"
                value={form.image_url}
                onChange={(e) => set("image_url", e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Link
            to="/masters/products"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="ui-btn-primary min-w-[9rem] disabled:opacity-60">
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
