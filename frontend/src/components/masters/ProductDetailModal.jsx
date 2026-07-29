import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, X } from "lucide-react";

function Field({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800 break-words">{value ?? "—"}</p>
    </div>
  );
}

function stockStatusOf(product) {
  const qty = Number(product.current_stock || 0);
  const min = Number(product.min_stock || 0);
  if (qty <= 0) return { label: "Out of Stock", cls: "bg-red-50 text-red-700 ring-red-200" };
  if (min > 0 && qty <= min) return { label: "Low Stock", cls: "bg-amber-50 text-amber-700 ring-amber-200" };
  return { label: "Healthy", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
}

const STORE_TABS = [
  { id: "general", label: "Overview" },
  { id: "inventory", label: "Stock" },
];

const FULL_TABS = [
  ...STORE_TABS,
  { id: "documents", label: "Documents" },
];

export default function ProductDetailModal({
  product,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  storeMode = false,
}) {
  const [tab, setTab] = useState("general");
  if (!product) return null;

  const tabs = storeMode ? STORE_TABS : FULL_TABS;
  const stock = stockStatusOf(product);
  const isFinished = String(product.category || "").toLowerCase().includes("finish");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="font-mono text-xs font-semibold text-[var(--color-primary)]">{product.product_code}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${stock.cls}`}>
                {stock.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {[product.category, product.warehouse].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-slate-100 px-5 py-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                tab === t.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "general" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Product Code" value={product.product_code} />
              <Field label="Product Name" value={product.name} />
              <Field label="Category" value={product.category} />
              <Field label="Unit" value={product.unit} />
              <Field label="Warehouse" value={product.warehouse} />
              <Field label="Status" value={product.status} />
              <Field label="Purchase Price" value={product.purchase_price != null ? `₹${product.purchase_price}` : "—"} />
              {isFinished ? (
                <Field label="Selling Price" value={product.selling_price != null ? `₹${product.selling_price}` : "—"} />
              ) : null}
              <div className="col-span-full">
                <Field label="Description" value={product.description} />
              </div>
            </div>
          )}

          {tab === "inventory" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Current Stock" value={product.current_stock} />
              <Field label="Minimum Stock" value={product.min_stock} />
              <Field label="Warehouse" value={product.warehouse} />
              <Field label="Unit" value={product.unit} />
              <Field label="Stock Status" value={stock.label} />
              <Field label="Last Updated" value={String(product.updated_at || product.created_at || "—").slice(0, 10)} />
            </div>
          )}

          {tab === "documents" && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Documents — open Document Management when needed.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button type="button" onClick={() => onEdit?.(product)} className="ui-btn-primary text-xs">
            Edit
          </button>
          <Link
            to="/inventory/stock-transfer"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Transfer Stock
          </Link>
          <Link
            to="/inventory/stock-adjustment"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Adjust Stock
          </Link>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(product)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
