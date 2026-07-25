import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import ManufacturingWorkflowBar from "../../components/manufacturing/ManufacturingWorkflowBar";
import { createSalesOrder } from "../../api/salesApi";
import { getProducts } from "../../api/productionApi";
import { fetchCustomersWithFallback, resolveCustomerId } from "../../utils/customerOptions";
import { fetchProductsWithFallback } from "../../utils/productOptions";
import useTenantId from "../../hooks/useTenantId";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

function emptyLine() {
  return {
    product_id: "",
    item_description: "",
    quantity: "1",
    unit: "pcs",
    unit_price: "",
  };
}

export default function CreateSalesOrder() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tenant_id: tenantId,
    customer_id: searchParams.get("customer_id") || "",
    order_number: "",
    reference_number: searchParams.get("reference") || "",
    order_date: new Date().toISOString().slice(0, 10),
    status: "draft",
  });
  const [lines, setLines] = useState([emptyLine()]);

  useEffect(() => {
    Promise.all([
      fetchCustomersWithFallback().catch(() => []),
      fetchProductsWithFallback().catch(() => []),
    ])
      .then(([custs, prods]) => {
        setCustomers(custs);
        setProducts(Array.isArray(prods) ? prods : []);
      })
      .catch(() => setError("Could not load customers/products."))
      .finally(() => setLoading(false));
  }, []);

  const totalAmount = useMemo(() => {
    return lines.reduce((sum, line) => {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unit_price) || 0;
      return sum + qty * price;
    }, 0);
  }, [lines]);

  const updateLine = (index, patch) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const next = { ...line, ...patch };
        if (patch.product_id !== undefined) {
          const product = products.find((p) => String(p.id) === String(patch.product_id));
          if (product) {
            next.item_description = product.name;
            next.unit_price =
              product.unit_price != null ? String(product.unit_price) : next.unit_price;
          }
        }
        return next;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validLines = lines.filter(
      (l) => l.product_id && Number(l.quantity) > 0 && l.item_description
    );
    if (!validLines.length) {
      setError("Add at least one product line so MRP and production can run on confirm.");
      return;
    }
    setSaving(true);

    const selectedCustomer = customers.find(
      (c) => String(c.id) === String(form.customer_id) || String(c.name) === String(form.customer_id) || String(c.company) === String(form.customer_id)
    );
    const custName = selectedCustomer?.company || selectedCustomer?.name || selectedCustomer?.customer_name || form.customer_id || "Customer";
    const soNo = form.order_number?.trim() || `SO-${Date.now()}`;
    const soDate = form.order_date || new Date().toISOString().slice(0, 10);

    let createdId = `so-${Date.now()}`;

    try {
      const customerId = await resolveCustomerId(form.customer_id, customers, tenantId);
      const res = await createSalesOrder({
        ...form,
        customer_id: customerId,
        order_number: soNo,
        total_amount: totalAmount,
        line_items: validLines.map((l) => {
          const qty = Number(l.quantity);
          const price = Number(l.unit_price) || 0;
          return {
            product_id: Number(l.product_id),
            item_description: l.item_description,
            quantity: qty,
            unit: l.unit || "pcs",
            unit_price: price,
            line_total: Math.round(qty * price * 100) / 100,
          };
        }),
      });
      if (res?.data?.id) createdId = res.data.id;
    } catch {
      /* local save handles fallback */
    }

    const newSO = {
      id: createdId,
      order_number: soNo,
      so_number: soNo,
      customer_name: custName,
      customer_id: form.customer_id,
      order_date: soDate,
      so_date: soDate,
      reference_number: form.reference_number || "—",
      total_amount: totalAmount,
      amount: totalAmount,
      status: "Pending",
      line_items: validLines.map((l) => ({
        product_id: l.product_id,
        item_description: l.item_description,
        quantity: Number(l.quantity),
        unit: l.unit || "pcs",
        unit_price: Number(l.unit_price) || 0,
        line_total: (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
      })),
      items_count: validLines.length,
      created_at: new Date().toISOString(),
    };

    const stored = localStorage.getItem("smrt_sales_orders");
    const localOrders = stored ? JSON.parse(stored) : [];
    const updated = [newSO, ...localOrders.filter((o) => String(o.order_number || o.so_number) !== String(soNo))];
    localStorage.setItem("smrt_sales_orders", JSON.stringify(updated));

    setSaving(false);
    navigate("/sales/orders");
  };

  if (loading) return <Loader label="Loading customers..." />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <Link
        to="/sales/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sales orders
      </Link>
      <PageHeader
        title="New sales order"
        subtitle="Add product lines so Confirm can run MRP and create production orders."
      />
      <ManufacturingWorkflowBar currentStepId="sales_order" compact />

      <form onSubmit={handleSubmit} className="ui-card space-y-4 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Customer *
          <select
            required
            value={form.customer_id}
            onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
            className={inputClass}
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {customers.length === 0 && (
          <p className="text-sm text-slate-500">
            No customers yet.{" "}
            <Link to="/sales/customers" className="font-medium text-teal-600 hover:underline">
              Add a customer first
            </Link>
            .
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Order number
            <input
              type="text"
              value={form.order_number}
              onChange={(e) => setForm((f) => ({ ...f, order_number: e.target.value }))}
              placeholder="Auto-generated if empty"
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Reference number
            <input
              type="text"
              value={form.reference_number}
              onChange={(e) => setForm((f) => ({ ...f, reference_number: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Order date
            <input
              type="date"
              value={form.order_date}
              onChange={(e) => setForm((f) => ({ ...f, order_date: e.target.value }))}
              className={inputClass}
            />
          </label>
          <div className="flex items-end">
            <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-100">
              Total: ₹{totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Product lines *</h3>
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB]"
            >
              <Plus className="h-4 w-4" /> Add line
            </button>
          </div>
          {lines.map((line, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-600 sm:grid-cols-12"
            >
              <label className="block text-xs font-medium text-slate-600 sm:col-span-4">
                Product
                <select
                  required
                  value={line.product_id}
                  onChange={(e) => updateLine(index, { product_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_code || p.sku ? `${p.product_code || p.sku} — ` : ""}{p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
                Qty
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  required
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
                Unit price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unit_price}
                  onChange={(e) => updateLine(index, { unit_price: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600 sm:col-span-3">
                Description
                <input
                  type="text"
                  required
                  value={line.item_description}
                  onChange={(e) => updateLine(index, { item_description: e.target.value })}
                  className={inputClass}
                />
              </label>
              <div className="flex items-end sm:col-span-1">
                <button
                  type="button"
                  disabled={lines.length === 1}
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                  className="rounded-lg border border-rose-200 p-2.5 text-rose-600 disabled:opacity-40"
                  title="Remove line"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {!products.length && (
            <p className="text-sm text-amber-700">
              No products in masters.{" "}
              <Link to="/masters/products" className="font-semibold underline">
                Add products
              </Link>{" "}
              before creating a manufacturing sales order.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !form.customer_id}
            className="ui-btn-primary disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create sales order"}
          </button>
          <Link
            to="/sales/orders"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}
