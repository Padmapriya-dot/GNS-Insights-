import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Filter, IndianRupee, Plus, RefreshCw, ShoppingCart, Truck } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import EmptyState from "../../components/common/EmptyState";
import SkeletonTable from "../../components/common/SkeletonTable";
import { ErrorState, NoResultsState, OfflineState } from "../../components/common/states";
import ManufacturingWorkflowBar from "../../components/manufacturing/ManufacturingWorkflowBar";
import { useNetworkStatus } from "../../context/NetworkStatusContext";
import { useToast } from "../../context/ToastContext";
import { getSOSummary, getSalesOrdersEnriched } from "../../api/salesApi";
import { formatInr, statusColor } from "../../data/salesMasterData";
import { exportToExcel } from "../../utils/exportUtils";

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

const defaultFilters = { customer: "", status: "", sales_person: "" };

export default function SalesOrders() {
  const { addToast } = useToast();
  const { online, markRequestStart, markRequestEnd, registerRetry } = useNetworkStatus();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [summary, setSummary] = useState({});
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    markRequestStart();
    try {
      const [sumRes, listRes] = await Promise.allSettled([
        getSOSummary(),
        getSalesOrdersEnriched(),
      ]);
      if (sumRes.status === "fulfilled" && sumRes.value?.data) setSummary(sumRes.value.data);
      else setSummary({});
      if (listRes.status === "fulfilled") setRows(listRes.value?.data || []);
      else {
        setRows([]);
        if (listRes.status === "rejected") {
          setLoadError("Failed to load sales orders.");
        }
      }
    } catch {
      setRows([]);
      setLoadError("Failed to load sales orders.");
    } finally {
      markRequestEnd();
      setLoading(false);
    }
  }, [markRequestStart, markRequestEnd]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => registerRetry(load), [registerRetry, load]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filters.customer) {
      list = list.filter((r) =>
        r.customer_name?.toLowerCase().includes(filters.customer.toLowerCase())
      );
    }
    if (filters.status) list = list.filter((r) => r.status === filters.status);
    if (filters.sales_person) {
      list = list.filter((r) =>
        r.sales_person?.toLowerCase().includes(filters.sales_person.toLowerCase())
      );
    }
    return list;
  }, [rows, filters]);

  const hasAdvancedFilters = Boolean(
    filters.customer || filters.status || filters.sales_person
  );

  const columns = [
    {
      key: "order_number",
      label: "SO No",
      render: (r) =>
        typeof r.id === "number" ? (
          <Link to={`/sales/orders/${r.id}`} className="font-medium text-[#2563EB] hover:underline">
            {r.order_number}
          </Link>
        ) : (
          <span className="font-medium text-[#2563EB]">{r.order_number}</span>
        ),
    },
    { key: "customer_name", label: "Customer" },
    {
      key: "order_date",
      label: "Date",
      render: (r) => String(r.order_date || "").slice(0, 10),
    },
    {
      key: "delivery_date",
      label: "Delivery Date",
      render: (r) => r.delivery_date || "—",
    },
    { key: "amount", label: "Amount", render: (r) => formatInr(r.amount) },
    {
      key: "payment_terms",
      label: "Payment",
      render: (r) => r.payment_terms || "—",
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(r.status)}`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) =>
        typeof r.id === "number" ? (
          <Link to={`/sales/orders/${r.id}`} className="text-xs font-semibold text-[#2563EB] hover:underline">
            Open
          </Link>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage orders from quotation to dispatch with production and inventory integration.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/sales/orders/create" className="ui-btn-primary">
            <Plus className="h-4 w-4" /> New Sales Order
          </Link>
          <button
            type="button"
            onClick={() =>
              exportToExcel(
                filtered,
                columns.filter((c) => !c.render),
                "sales-orders"
              )
            }
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      <ManufacturingWorkflowBar currentStepId="sales_order" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <KpiCard label="Total Orders" value={summary.total_orders ?? 0} icon={ShoppingCart} color="bg-blue-600" />
        <KpiCard label="Pending" value={summary.pending ?? 0} icon={ShoppingCart} color="bg-amber-500" />
        <KpiCard label="Confirmed" value={summary.confirmed ?? 0} icon={ShoppingCart} color="bg-indigo-600" />
        <KpiCard label="Packed" value={summary.packed ?? 0} icon={ShoppingCart} color="bg-purple-600" />
        <KpiCard label="Shipped" value={summary.shipped ?? 0} icon={Truck} color="bg-teal-600" />
        <KpiCard label="Delivered" value={summary.delivered ?? 0} icon={Truck} color="bg-green-600" />
        <KpiCard label="Cancelled" value={summary.cancelled ?? 0} icon={ShoppingCart} color="bg-red-500" />
        <KpiCard label="Revenue" value={formatInr(summary.revenue ?? 0)} icon={IndianRupee} color="bg-emerald-600" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
        >
          <Filter className="h-4 w-4" /> Filters
        </button>
        {showAdvanced && (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <input
              value={filters.customer}
              onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
              placeholder="Customer"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              {["draft", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
            <input
              value={filters.sales_person}
              onChange={(e) => setFilters({ ...filters, sales_person: e.target.value })}
              placeholder="Sales Person"
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        )}

        {loading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : !online && loadError ? (
          <OfflineState onRetry={load} />
        ) : loadError ? (
          <ErrorState description={loadError} onRetry={load} />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            searchPlaceholder="Search SO, customer..."
            searchKeys={["order_number", "customer_name", "sales_person"]}
            emptyState={
              rows.length === 0 ? (
                <EmptyState
                  icon="clipboard"
                  title="No sales orders yet"
                  description="Create your first sales order to start the order-to-cash flow."
                  actionLabel="New Sales Order"
                  actionHref="/sales/orders/create"
                />
              ) : hasAdvancedFilters ? (
                <NoResultsState
                  query={filters.customer || filters.status || filters.sales_person}
                  onClear={() => setFilters(defaultFilters)}
                />
              ) : (
                <EmptyState
                  title="No sales orders yet"
                  description="Create your first sales order to get started."
                  actionLabel="New Sales Order"
                  actionHref="/sales/orders/create"
                />
              )
            }
          />
        )}
      </div>
    </div>
  );
}
