import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Plus, RefreshCw, Truck, XCircle } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import StoreManagerNav from "../../components/inventory/StoreManagerNav";
import {
  WhPageShell,
  WhStickyHeader,
  WhWorkflowStrip,
  WH_BTN_SECONDARY,
} from "../../components/inventory/warehouseUi";
import { useToast } from "../../context/ToastContext";
import {
  createStockTransfer,
  getInventoryDashboard,
  getStockTransfers,
  getWarehouses,
  updateStockTransferStatus,
} from "../../api/inventoryApi";
import { TRANSFER_STATUSES } from "../../data/inventoryMasterData";
import { TRANSFER_WORKFLOW } from "../../data/warehousesMasterData";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700",
  pending_approval: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  in_transit: "bg-indigo-100 text-indigo-800",
  received: "bg-teal-100 text-teal-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function itemLabel(item) {
  const code = item.product_code || item.code || item.item_code;
  const name = item.name || "Item";
  const stock = item.total_quantity ?? item.current_stock;
  const base = code ? `${code} — ${name}` : name;
  return stock != null ? `${base} (Stock: ${stock})` : base;
}

export default function StockTransfer() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    transfer_number: "",
    transfer_date: new Date().toISOString().slice(0, 10),
    from_warehouse_id: "",
    to_warehouse_id: "",
    item_id: "",
    batch_number: "",
    quantity: "",
    vehicle: "",
    driver: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [trRes, whRes, itemsRes] = await Promise.allSettled([
        getStockTransfers(),
        getWarehouses(),
        getInventoryDashboard(),
      ]);
      setTransfers(trRes.status === "fulfilled" ? asArray(trRes.value?.data) : []);
      setWarehouses(whRes.status === "fulfilled" ? asArray(whRes.value?.data) : []);
      setItems(itemsRes.status === "fulfilled" ? asArray(itemsRes.value?.data) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.from_warehouse_id === form.to_warehouse_id) {
      addToast("From & To warehouses must differ", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createStockTransfer({
        transfer_number: form.transfer_number || null,
        transfer_date: form.transfer_date || null,
        from_warehouse_id: Number(form.from_warehouse_id),
        to_warehouse_id: Number(form.to_warehouse_id),
        item_id: Number(form.item_id),
        batch_number: form.batch_number || null,
        quantity: Number(form.quantity),
        vehicle: form.vehicle || null,
        driver: form.driver || null,
        notes: form.notes || null,
      });
      addToast("Transfer created — pending approval");
      setForm({
        transfer_number: "",
        transfer_date: new Date().toISOString().slice(0, 10),
        from_warehouse_id: "",
        to_warehouse_id: "",
        item_id: "",
        batch_number: "",
        quantity: "",
        vehicle: "",
        driver: "",
        notes: "",
      });
      load();
    } catch {
      addToast("Transfer failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (transferId, newStatus) => {
    setUpdatingId(transferId);
    try {
      await updateStockTransferStatus(transferId, {
        status: newStatus,
        approved_by: "Store Manager",
      });
      addToast(`Transfer updated to ${newStatus.replace(/_/g, " ")}`);
      await load();
    } catch {
      addToast("Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const historyColumns = [
    { key: "transfer_number", label: "Transfer No" },
    { key: "transfer_date", label: "Date" },
    { key: "from_warehouse", label: "From" },
    { key: "to_warehouse", label: "To" },
    { key: "item_name", label: "Item" },
    { key: "quantity", label: "Qty" },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
            STATUS_COLORS[r.status] || "bg-slate-100 text-slate-700"
          }`}
        >
          {r.status?.replace(/_/g, " ")}
        </span>
      ),
    },
    { key: "approved_by", label: "Approved By", render: (r) => r.approved_by || "—" },
    {
      key: "actions",
      label: "Actions",
      render: (r) => {
        const isBusy = updatingId === r.id;
        if (r.status === "pending_approval") {
          return (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleStatusChange(r.id, "approved")}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleStatusChange(r.id, "rejected")}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          );
        }
        if (r.status === "approved") {
          return (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleStatusChange(r.id, "in_transit")}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              <Truck className="h-3.5 w-3.5" /> Dispatch
            </button>
          );
        }
        if (r.status === "in_transit") {
          return (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleStatusChange(r.id, "completed")}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </button>
          );
        }
        if (r.status === "draft") {
          return (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleStatusChange(r.id, "pending_approval")}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50"
            >
              Submit
            </button>
          );
        }
        if (r.status === "received" || r.status === "completed") {
          return (
            <span className="text-xs font-medium capitalize text-teal-700">
              {String(r.status).replace(/_/g, " ")}
            </span>
          );
        }
        return (
          <span className="text-xs capitalize text-slate-500">
            {String(r.status || "closed").replace(/_/g, " ")}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <WhPageShell>
        <StoreManagerNav />
        <Loader label="Loading stock transfers..." />
      </WhPageShell>
    );
  }

  return (
    <WhPageShell>
      <StoreManagerNav />
      <WhStickyHeader
        breadcrumb={[
          { label: "Inventory", to: "/inventory" },
          { label: "Stock Transfer" },
        ]}
        title="Stock Transfer"
        subtitle="Source → Destination → Product → Quantity → Approval → Confirmation."
        actions={
          <button type="button" onClick={load} className={WH_BTN_SECONDARY}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <WhWorkflowStrip title="Transfer Workflow" steps={TRANSFER_WORKFLOW} />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <Plus className="h-4 w-4" /> Create Transfer
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Transfer No <span className="text-xs text-slate-400">(Optional)</span>
              <input
                placeholder="Auto-generated if empty"
                value={form.transfer_number}
                onChange={(e) => setForm((f) => ({ ...f, transfer_number: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm">
              Transfer Date
              <input
                type="date"
                required
                value={form.transfer_date}
                onChange={(e) => setForm((f) => ({ ...f, transfer_date: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm">
              From Warehouse
              <select
                value={form.from_warehouse_id}
                onChange={(e) => setForm((f) => ({ ...f, from_warehouse_id: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              To Warehouse
              <select
                value={form.to_warehouse_id}
                onChange={(e) => setForm((f) => ({ ...f, to_warehouse_id: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm sm:col-span-2">
              Product
              <select
                value={form.item_id}
                onChange={(e) => setForm((f) => ({ ...f, item_id: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Select product</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {itemLabel(i)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              Batch
              <input
                value={form.batch_number}
                onChange={(e) => setForm((f) => ({ ...f, batch_number: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm">
              Qty
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm">
              Vehicle
              <input
                value={form.vehicle}
                onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm">
              Driver
              <input
                value={form.driver}
                onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm sm:col-span-2">
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                rows={2}
              />
            </label>

            <button type="submit" disabled={submitting} className="ui-btn-primary sm:col-span-2">
              {submitting ? "Creating..." : "Create Transfer"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-800">Status Flow</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            {TRANSFER_STATUSES.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 capitalize shadow-xs">
                  {s.replace(/_/g, " ")}
                </span>
                {i < TRANSFER_STATUSES.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                )}
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Truck className="h-4 w-4" /> Transfer History
          </h2>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="inline h-3 w-3" /> Refresh
          </button>
        </div>
        <DataTable columns={historyColumns} data={transfers} showSearch={false} />
      </section>
    </WhPageShell>
  );
}
