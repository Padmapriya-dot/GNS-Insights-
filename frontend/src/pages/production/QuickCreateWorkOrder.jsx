import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useToast } from "../../context/ToastContext";
import {
  getProducts,
  getMachines,
  quickCreateWorkOrder,
} from "../../api/productionApi";
import { getEmployees } from "../../api/hrApi";
import useTenantId from "../../hooks/useTenantId";
import { PRIORITIES } from "../../data/productionPlanningMasterData";

export default function QuickCreateWorkOrder() {
  const tenantId = useTenantId();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    work_order_number: "",
    product_id: "",
    customer_name: "",
    machine_id: "",
    operator_name: "",
    planned_quantity: "",
    priority: "medium",
    planned_start: "",
    planned_end: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, mRes] = await Promise.all([
          getProducts(tenantId).catch(() => ({ data: [] })),
          getMachines(tenantId).catch(() => ({ data: [] })),
        ]);
        setProducts(pRes?.data || []);
        setMachines(mRes?.data || []);
      } catch (e) {
        console.error(e);
        setProducts([]);
        setMachines([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(form.planned_quantity);
    if (!form.product_id || !form.planned_quantity || isNaN(qty) || qty <= 0) {
      setError("Product and planned quantity are required. Quantity must be greater than 0.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await quickCreateWorkOrder({
        tenant_id: tenantId,
        product_id: Number(form.product_id),
        planned_quantity: qty,
        work_order_number: form.work_order_number || null,
        customer_name: form.customer_name || null,
        machine_id: form.machine_id ? Number(form.machine_id) : null,
        operator_name: form.operator_name || null,
        priority: form.priority || "medium",
        planned_start: form.planned_start || null,
        planned_end: form.planned_end || null,
      });
      addToast("Work order created successfully", "success");
      navigate("/production/work-orders");
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg || d.message).join(", ")
        : typeof detail === "string"
          ? detail
          : err.response?.data?.message || "Unable to create work order.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="mt-6 space-y-4">
          <div className="h-10 rounded bg-slate-100" />
          <div className="h-10 rounded bg-slate-100" />
          <div className="h-10 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          {t("quickCreateWorkOrder.title", { defaultValue: "Create Work Order" })}
        </h2>
        <Link
          to="/production/work-orders"
          className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
        >
          ← Back to Work Orders
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="product_id"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Product <span className="text-red-500">*</span>
            </label>
            <select
              id="product_id"
              name="product_id"
              value={form.product_id}
              onChange={handleChange}
              required
              disabled={products.length === 0}
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
            >
              <option value="">
                {products.length === 0
                  ? "No products available – please add products first"
                  : t("quickCreateWorkOrder.selectProduct", { defaultValue: "Select product" })}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="work_order_number"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              WO Number
            </label>
            <input
              id="work_order_number"
              type="text"
              name="work_order_number"
              value={form.work_order_number}
              onChange={handleChange}
              placeholder="e.g. WO-2024-001 (auto-generated if empty)"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="customer_name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Customer Name
            </label>
            <input
              id="customer_name"
              type="text"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label
              htmlFor="planned_quantity"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Planned Qty <span className="text-red-500">*</span>
            </label>
            <input
              id="planned_quantity"
              type="number"
              name="planned_quantity"
              value={form.planned_quantity}
              onChange={handleChange}
              required
              min="1"
              step="1"
              placeholder="e.g. 100"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label
              htmlFor="machine_id"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Machine
            </label>
            <select
              id="machine_id"
              name="machine_id"
              value={form.machine_id}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Select Machine (Optional)</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="operator_name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Operator
            </label>
            <input
              id="operator_name"
              type="text"
              name="operator_name"
              value={form.operator_name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 capitalize"
            >
              {(PRIORITIES || ["low", "medium", "high", "critical"]).map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="planned_start"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Start Date
            </label>
            <input
              id="planned_start"
              type="datetime-local"
              name="planned_start"
              value={form.planned_start}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label
              htmlFor="planned_end"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Due Date
            </label>
            <input
              id="planned_end"
              type="datetime-local"
              name="planned_end"
              value={form.planned_end}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || products.length === 0}
            className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:bg-slate-400"
          >
            {saving ? "Saving..." : "Save & Done"}
          </button>
          <Link
            to="/production/work-orders"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}