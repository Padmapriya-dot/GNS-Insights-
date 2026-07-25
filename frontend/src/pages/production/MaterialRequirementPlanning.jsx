import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Package,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import ManufacturingWorkflowBar from "../../components/manufacturing/ManufacturingWorkflowBar";
import { useToast } from "../../context/ToastContext";
import { getProducts, runMrp } from "../../api/productionApi";
import {
  MANUFACTURING_EVENTS,
  notifyManufacturingSpine,
} from "../../utils/manufacturingEvents";
import { exportToExcel, exportToPdf } from "../../utils/exportUtils";

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100 sm:text-2xl">
            {value}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function MaterialRequirementPlanning() {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [createPr, setCreatePr] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await getProducts();
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setProducts(list);
      if (list.length && !productId) {
        setProductId(String(list[0].id));
      }
    } catch {
      setProducts([]);
      setError("Failed to load products from masters.");
    } finally {
      setLoadingProducts(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRun = async (e) => {
    e.preventDefault();
    setError("");
    const qty = Number(quantity);
    if (!productId || !qty || qty <= 0) {
      setError("Select a product and enter a quantity greater than zero.");
      return;
    }
    setRunning(true);
    try {
      const res = await runMrp(Number(productId), qty, createPr);
      const data = res.data;
      setResult(data);
      notifyManufacturingSpine(MANUFACTURING_EVENTS.MRP_RUN, data);
      if (data?.enough_stock) {
        addToast("Materials available — ready for production", "success");
      } else {
        addToast(
          data?.material_request_number
            ? `Shortage found — ${data.material_request_number} created`
            : "Shortage found — purchase required",
          "warning"
        );
      }
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "MRP run failed";
      setError(typeof msg === "string" ? msg : "MRP run failed");
      addToast("MRP run failed", "error");
    } finally {
      setRunning(false);
    }
  };

  const requirements = result?.requirements || [];
  const shortageCount = result?.shortage_count ?? requirements.filter((r) => !r.enough).length;

  const summary = useMemo(
    () => ({
      lines: requirements.length,
      shortages: shortageCount,
      action: result?.action || "—",
      mr: result?.material_request_number || "—",
    }),
    [requirements, shortageCount, result]
  );

  const columns = [
    { key: "sku", label: "SKU", render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
    { key: "component_name", label: "Component" },
    { key: "required_qty", label: "Required", render: (r) => r.required_qty },
    { key: "available_qty", label: "Available", render: (r) => r.available_qty },
    {
      key: "shortage_qty",
      label: "Shortage",
      render: (r) => (
        <span className={r.shortage_qty > 0 ? "font-semibold text-rose-600" : "text-emerald-600"}>
          {r.shortage_qty}
        </span>
      ),
    },
    {
      key: "enough",
      label: "Status",
      render: (r) =>
        r.enough ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">OK</span>
        ) : (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">Buy</span>
        ),
    },
  ];

  const exportCols = [
    { key: "sku", label: "SKU" },
    { key: "component_name", label: "Component" },
    { key: "required_qty", label: "Required" },
    { key: "available_qty", label: "Available" },
    { key: "shortage_qty", label: "Shortage" },
    { key: "unit", label: "Unit" },
  ];

  if (loadingProducts) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Material Requirement Planning"
        subtitle="Explode BOM against stock. Shortages automatically create a Purchase Request."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadProducts} className="ui-btn-secondary inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh products
            </button>
            <Link to="/procurement/material-requests" className="ui-btn-secondary inline-flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Purchase Requests
            </Link>
            <Link to="/production/planning" className="ui-btn-primary inline-flex items-center gap-2">
              Production Planning
            </Link>
          </div>
        }
      />

      <ManufacturingWorkflowBar currentStepId="mrp" />

      <form
        onSubmit={handleRun}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-300">Product</span>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800"
            required
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-300">Quantity</span>
          <input
            type="number"
            min="0.001"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800"
            required
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={createPr}
            onChange={(e) => setCreatePr(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Auto-create Purchase Request on shortage
          </span>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={running || !products.length}
            className="ui-btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {running ? "Running…" : (
              <>
                <Package className="h-4 w-4" />
                Run MRP
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!products.length && !error && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">No products in masters.</p>
          <Link to="/masters/products" className="ui-btn-primary mt-4 inline-flex">
            Add products
          </Link>
        </div>
      )}

      {result && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="BOM lines" value={summary.lines} icon={ClipboardList} color="bg-blue-500" />
            <SummaryCard label="Shortages" value={summary.shortages} icon={AlertTriangle} color="bg-rose-500" />
            <SummaryCard
              label="Action"
              value={summary.action === "produce" ? "Produce" : "Purchase"}
              icon={summary.action === "produce" ? CheckCircle2 : ShoppingCart}
              color={summary.action === "produce" ? "bg-emerald-500" : "bg-amber-500"}
            />
            <SummaryCard label="Purchase Request" value={summary.mr} icon={ShoppingCart} color="bg-indigo-500" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {result.product_name} × {result.quantity}
              </h2>
              <p className="text-sm text-slate-500">
                {result.enough_stock
                  ? "Enough stock — proceed to production planning / work orders."
                  : "Shortage detected — review purchase request, then GRN before material issue."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.material_request_id && (
                <Link to="/procurement/material-requests" className="ui-btn-primary">
                  Open Purchase Requests
                </Link>
              )}
              {result.enough_stock && (
                <Link to="/production/planning" className="ui-btn-primary">
                  Go to Production Planning
                </Link>
              )}
              <button
                type="button"
                className="ui-btn-secondary"
                onClick={() => exportToExcel(requirements, exportCols, "mrp-requirements")}
                disabled={!requirements.length}
              >
                Export Excel
              </button>
              <button
                type="button"
                className="ui-btn-secondary"
                onClick={() => exportToPdf(requirements, exportCols, "MRP Requirements")}
                disabled={!requirements.length}
              >
                Export PDF
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <DataTable
              columns={columns}
              data={requirements}
              emptyState={
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-600">No BOM components for this product.</p>
                  <Link to="/masters/bom" className="ui-btn-primary mt-4 inline-flex">
                    Maintain BOM
                  </Link>
                </div>
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
