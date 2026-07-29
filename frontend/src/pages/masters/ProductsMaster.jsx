import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, Eye, Filter, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import ProductDetailModal from "../../components/masters/ProductDetailModal";
import StoreManagerNav from "../../components/inventory/StoreManagerNav";
import { useToast } from "../../context/ToastContext";
import usePermissions from "../../hooks/usePermissions";
import { getProducts, deleteProduct } from "../../api/productsApi";
import {
  PRODUCT_CATEGORIES,
  WAREHOUSES,
  computeSummary,
  enrichApiProduct,
} from "../../data/productsMasterData";
import { isStoreManager } from "../../config/permissions";
import { exportToExcel } from "../../utils/exportUtils";

function stockStatusOf(row) {
  const qty = Number(row.current_stock || 0);
  const min = Number(row.min_stock || 0);
  if (qty <= 0) return "out";
  if (min > 0 && qty <= min) return "low";
  return "healthy";
}

function StockStatusBadge({ status }) {
  const map = {
    healthy: { label: "Healthy", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    low: { label: "Low Stock", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
    out: { label: "Out of Stock", cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
  };
  const m = map[status] || map.healthy;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}

const secondaryBtn =
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50";

export default function ProductsMaster() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { user } = usePermissions();
  const storeMode = isStoreManager(user);

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    warehouse: "",
    stock_status: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 280);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      setProducts((res.data || []).map((row) => enrichApiProduct(row)));
    } catch {
      setProducts([]);
      addToast("Could not load products", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q) {
        const hay = `${p.product_code} ${p.name} ${p.category} ${p.warehouse}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.category && p.category !== filters.category) return false;
      if (filters.warehouse && p.warehouse !== filters.warehouse) return false;
      if (filters.stock_status && stockStatusOf(p) !== filters.stock_status) return false;
      return true;
    });
  }, [products, search, filters]);

  const summary = useMemo(() => computeSummary(filteredProducts), [filteredProducts]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      if (typeof product.id === "number") await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setSelected(null);
      addToast("Product deleted");
    } catch {
      addToast("Could not delete product", "error");
    }
  };

  const columns = [
    {
      key: "product_code",
      label: "Product Code",
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-600">{r.product_code}</span>,
    },
    {
      key: "name",
      label: "Product Name",
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelected(r)}
          className="text-left text-sm font-semibold text-slate-900 hover:text-[var(--color-primary)]"
        >
          {r.name}
        </button>
      ),
    },
    { key: "category", label: "Category" },
    { key: "warehouse", label: "Warehouse", render: (r) => r.warehouse || "—" },
    { key: "unit", label: "Unit" },
    {
      key: "current_stock",
      label: "Current Stock",
      render: (r) => <span className="font-semibold tabular-nums">{Number(r.current_stock || 0).toLocaleString("en-IN")}</span>,
    },
    {
      key: "min_stock",
      label: "Min Stock",
      render: (r) => Number(r.min_stock || 0).toLocaleString("en-IN"),
    },
    {
      key: "stock_status",
      label: "Stock Status",
      render: (r) => <StockStatusBadge status={stockStatusOf(r)} />,
    },
    {
      key: "created_at",
      label: "Last Updated",
      render: (r) => String(r.updated_at || r.created_at || "—").slice(0, 10),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (r) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setSelected(r)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="View">
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(typeof r.id === "number" ? `/masters/products/${r.id}/edit` : "/masters/products/create")}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => handleDelete(r)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        {storeMode ? <StoreManagerNav /> : null}
        <Loader label="Loading products…" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {storeMode ? <StoreManagerNav /> : null}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            Product master for store operations — stock levels by warehouse.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/masters/products/create" className="ui-btn-primary">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
          <button
            type="button"
            onClick={() => {
              exportToExcel(
                filteredProducts,
                [
                  { key: "product_code", label: "Product Code" },
                  { key: "name", label: "Product Name" },
                  { key: "category", label: "Category" },
                  { key: "warehouse", label: "Warehouse" },
                  { key: "unit", label: "Unit" },
                  { key: "current_stock", label: "Current Stock" },
                  { key: "min_stock", label: "Min Stock" },
                  { key: "status", label: "Status" },
                ],
                "products"
              );
              addToast("Exported to Excel");
            }}
            className={secondaryBtn}
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" onClick={loadProducts} className={secondaryBtn}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Products</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Low Stock</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600">{summary.lowStock}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Out of Stock</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-red-600">{summary.outOfStock}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600">{summary.active}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Search product name or code…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold ${
              showFilters ? "border-[var(--color-primary)] bg-sky-50 text-[var(--color-primary)]" : "border-slate-200 text-slate-700"
            }`}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
          {(filters.category || filters.warehouse || filters.stock_status || search) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setFilters({ category: "", warehouse: "", stock_status: "" });
              }}
              className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mb-4 grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-3">
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">All categories</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={filters.warehouse}
              onChange={(e) => setFilters((f) => ({ ...f, warehouse: e.target.value }))}
            >
              <option value="">All warehouses</option>
              {WAREHOUSES.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={filters.stock_status}
              onChange={(e) => setFilters((f) => ({ ...f, stock_status: e.target.value }))}
            >
              <option value="">All stock status</option>
              <option value="healthy">Healthy</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        )}

        <DataTable
          columns={columns}
          data={filteredProducts}
          searchPlaceholder=""
          searchKeys={[]}
          showSearch={false}
          pageSize={10}
        />
      </div>

      {selected && (
        <ProductDetailModal
          product={selected}
          storeMode
          onClose={() => setSelected(null)}
          onEdit={(p) => {
            setSelected(null);
            if (typeof p?.id === "number") navigate(`/masters/products/${p.id}/edit`);
          }}
          onDuplicate={() => addToast("Use Add Product to create a copy", "info")}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
