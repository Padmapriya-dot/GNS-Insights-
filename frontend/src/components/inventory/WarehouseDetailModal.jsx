import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownUp,
  Package,
  Truck,
  X,
} from "lucide-react";

import { INVENTORY_CATEGORIES } from "../../data/warehousesMasterData";
import { StockStatusBadge, resolveStockStatus, WhStatusPill } from "./warehouseUi";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "inventory", label: "Inventory" },
  { id: "ledger", label: "Stock Ledger" },
  { id: "transfers", label: "Transfers" },
  { id: "receipts", label: "Stock In (GRN)" },
  { id: "bins", label: "Locations" },
  { id: "documents", label: "Documents" },
  { id: "audit", label: "Audit Logs" },
];

function Field({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800 break-words">{value ?? "—"}</p>
    </div>
  );
}

function formatInr(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function categorizeItem(item) {
  const t = String(item.item_type || item.category || "").toLowerCase();
  if (t.includes("pack")) return "Packing Materials";
  if (t.includes("consum")) return "Consumables";
  if (t.includes("spare")) return "Spare Parts";
  if (t.includes("semi") || t.includes("wip")) return "Semi-Finished Goods";
  if (t.includes("finish") || t === "fg") return "Finished Goods";
  return "Raw Materials";
}

function LocationCards({ nodes }) {
  if (!nodes?.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No zone / aisle / rack / shelf / bin layout configured yet.
      </p>
    );
  }
  const flatten = (list, path = []) => {
    const out = [];
    (list || []).forEach((n) => {
      const next = [...path, n];
      if (!n.children?.length || n.type === "bin") out.push(next);
      else out.push(...flatten(n.children, next));
    });
    return out;
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {flatten(nodes).map((path, idx) => {
        const leaf = path[path.length - 1];
        return (
          <div key={`${leaf.name}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{leaf.type || "location"}</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{leaf.name}</p>
            <p className="mt-1 text-xs text-slate-500">{path.map((p) => p.name).join(" → ")}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function WarehouseDetailModal({ warehouse, detail, onClose, onEdit, onDeactivate }) {
  const [tab, setTab] = useState("overview");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const w = warehouse ? { ...warehouse, ...(detail || {}) } : {};
  const binTree = detail?.bin_tree || [];
  const stockItems = detail?.stock_items || [];

  const groupedInventory = useMemo(() => {
    const enriched = stockItems.map((item) => ({
      ...item,
      category: categorizeItem(item),
      stockStatus: resolveStockStatus({
        quantity: item.quantity,
        below_reorder: item.below_reorder,
        min_stock: item.min_stock,
      }),
    }));
    const filtered =
      categoryFilter === "All" ? enriched : enriched.filter((i) => i.category === categoryFilter);
    const groups = {};
    filtered.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [stockItems, categoryFilter]);

  if (!warehouse) return null;

  const utilization = w.utilization_pct != null ? Number(w.utilization_pct) : 0;

  const kpis = [
    { label: "Inventory Value", value: formatInr(w.inventory_value) },
    { label: "Utilization", value: w.utilization_pct != null ? `${w.utilization_pct}%` : "—" },
    { label: "Total Items", value: w.total_items ?? w.item_count ?? stockItems.length },
    { label: "Low Stock", value: w.low_stock ?? w.low_stock_items ?? 0 },
    { label: "Daily Inward", value: w.daily_inward ?? 0 },
    { label: "Daily Outward", value: w.daily_outward ?? 0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="font-mono text-xs font-semibold text-[var(--color-primary)]">{w.code}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{w.name}</h2>
              <WhStatusPill status={w.status} primary={w.is_primary} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {[w.warehouse_type, w.branch || w.city, w.manager_name].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 sm:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.label} className="text-center">
              <p className="text-[10px] font-medium text-slate-500">{k.label}</p>
              <p className="text-sm font-bold text-slate-800">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 border-b border-slate-100 px-5 py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === t.id
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "overview" && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-800">Warehouse Details</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field label="Warehouse Code" value={w.code} />
                  <Field label="Warehouse Name" value={w.name} />
                  <Field label="Warehouse Type" value={w.warehouse_type} />
                  <Field label="Manager" value={w.manager_name} />
                  <Field label="Contact Details" value={w.manager_phone} />
                  <Field label="Address" value={w.address || [w.city, w.state].filter(Boolean).join(", ")} />
                  <Field label="Capacity" value={w.capacity?.toLocaleString?.("en-IN") ?? w.capacity} />
                  <Field label="Current Utilization" value={w.utilization_pct != null ? `${w.utilization_pct}%` : "—"} />
                  <Field label="Active Status" value={w.status} />
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Capacity used</span>
                    <span>{utilization}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                      style={{ width: `${Math.min(100, utilization)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-800">Inventory Mix</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Raw Materials" value={w.raw_materials} />
                  <Field label="Finished Goods" value={w.finished_goods} />
                  <Field label="WIP / Semi-Finished" value={w.wip_items} />
                  <Field label="Total Items" value={w.total_items ?? w.item_count} />
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-800">Stock Alerts</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Low Stock" value={w.low_stock ?? w.low_stock_items} />
                  <Field label="Out of Stock" value={w.out_of_stock} />
                  <Field label="Overstock" value={w.overstock} />
                  <Field label="Inventory Value" value={formatInr(w.inventory_value)} />
                </div>
              </div>
            </div>
          )}

          {tab === "inventory" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("All")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    categoryFilter === "All"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  All
                </button>
                {INVENTORY_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategoryFilter(c)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      categoryFilter === c
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {Object.keys(groupedInventory).length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No stock items in this warehouse yet.
                </p>
              ) : (
                Object.entries(groupedInventory).map(([cat, items]) => (
                  <div key={cat}>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{cat}</h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-3 py-2">Product Code</th>
                            <th className="px-3 py-2">Product</th>
                            <th className="px-3 py-2">Batch</th>
                            <th className="px-3 py-2 text-right">Stock</th>
                            <th className="px-3 py-2 text-right">Value</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.item_id || item.product_code || item.name} className="border-t border-slate-100">
                              <td className="px-3 py-2.5">
                                <p className="font-mono text-xs font-semibold text-slate-600">
                                  {item.product_code || item.code || item.item_code || "—"}
                                </p>
                              </td>
                              <td className="px-3 py-2.5">
                                <p className="font-medium text-slate-900">{item.name}</p>
                                <p className="text-xs capitalize text-slate-500">{item.item_type?.replace("_", " ")}</p>
                              </td>
                              <td className="px-3 py-2.5 text-slate-600">{item.batch_number || "—"}</td>
                              <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{item.quantity}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatInr(item.stock_value)}</td>
                              <td className="px-3 py-2.5">
                                <StockStatusBadge status={item.stockStatus} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "ledger" && (
            <Link to="/inventory/stock-ledger" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
              View full stock ledger / movement history →
            </Link>
          )}

          {tab === "transfers" && (
            <Link to="/inventory/stock-transfer" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
              Create stock transfer →
            </Link>
          )}

          {tab === "receipts" && (
            <Link to="/procurement/goods-receipt" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
              View goods receipts (GRN) →
            </Link>
          )}

          {tab === "bins" && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-800">Zone · Aisle · Rack · Shelf · Bin</h3>
              <LocationCards nodes={binTree} />
            </div>
          )}

          {tab === "documents" && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Warehouse documents — link from Document Management.
            </p>
          )}

          {tab === "audit" && (
            <Link to="/admin/access-logs" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
              View audit logs →
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4">
          <Link to="/inventory/stock-transfer" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white hover:opacity-95">
            <ArrowDownUp className="h-3.5 w-3.5" /> Stock Transfer
          </Link>
          <Link to="/inventory/stock-ledger" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Package className="h-3.5 w-3.5" /> Stock History
          </Link>
          <Link to="/procurement/goods-receipt" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Truck className="h-3.5 w-3.5" /> GRN Receipt
          </Link>
          {onEdit && (
            <button type="button" onClick={() => onEdit(w)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              Edit
            </button>
          )}
          {onDeactivate && w.status === "active" && (
            <button type="button" onClick={() => onDeactivate(w)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
              Deactivate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

export function WarehouseFormModal({ warehouse, onClose, onSave }) {
  const isEdit = Boolean(warehouse?.id);
  const [form, setForm] = useState({
    name: warehouse?.name || "",
    code: warehouse?.code || (isEdit ? "" : `WH-${Date.now().toString().slice(-6)}`),
    branch: warehouse?.branch || "",
    plant: warehouse?.plant || "",
    warehouse_type: warehouse?.warehouse_type || "General",
    state: warehouse?.state || "",
    city: warehouse?.city || "",
    address: warehouse?.address || "",
    manager_name: warehouse?.manager_name || "",
    manager_phone: warehouse?.manager_phone || "",
    capacity: warehouse?.capacity || "",
    used_capacity: warehouse?.used_capacity ?? 0,
    available_capacity: warehouse?.available_capacity ?? "",
    is_primary: warehouse?.is_primary || false,
    status: warehouse?.status || "active",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit Warehouse" : "Create Warehouse"}</h2>
        <p className="mt-1 text-sm text-slate-500">New warehouse codes are auto-generated and editable.</p>
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Warehouse Code <span className="text-red-500">*</span>
              <input
                type="text"
                required
                placeholder="WH-0001"
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Status
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className={`${inputClass} bg-white`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="block sm:col-span-2 text-sm font-medium text-slate-700">
              Warehouse Name *
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Branch
              <input
                type="text"
                value={form.branch}
                onChange={(e) => set("branch", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Plant
              <input
                type="text"
                value={form.plant}
                onChange={(e) => set("plant", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Manager
              <input
                type="text"
                value={form.manager_name}
                onChange={(e) => set("manager_name", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Contact Number
              <input
                type="text"
                value={form.manager_phone}
                onChange={(e) => set("manager_phone", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Capacity
              <input
                type="number"
                min="0"
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Used Capacity
              <input
                type="number"
                min="0"
                value={form.used_capacity}
                onChange={(e) => set("used_capacity", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block sm:col-span-2 text-sm font-medium text-slate-700">
              Available Capacity
              <input
                type="number"
                min="0"
                placeholder={form.capacity && form.used_capacity != null ? Math.max(0, form.capacity - form.used_capacity) : "Auto-calculated"}
                value={form.available_capacity}
                onChange={(e) => set("available_capacity", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              City
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              State
              <input
                type="text"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block sm:col-span-2 text-sm font-medium text-slate-700">
              Address
              <input
                type="text"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm pt-1">
            <input type="checkbox" checked={form.is_primary} onChange={(e) => set("is_primary", e.target.checked)} />
            Primary warehouse
          </label>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="ui-btn-primary">Save Warehouse</button>
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
