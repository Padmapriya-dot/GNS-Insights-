import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Eye,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Warehouse,
} from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import WarehouseDetailModal, { WarehouseFormModal } from "../../components/inventory/WarehouseDetailModal";
import StoreManagerNav from "../../components/inventory/StoreManagerNav";
import { useToast } from "../../context/ToastContext";
import usePermissions from "../../hooks/usePermissions";
import useTenantId from "../../hooks/useTenantId";
import { isStoreManager } from "../../config/permissions";
import {
  createWarehouseFull,
  deactivateWarehouse,
  getWarehouseDetail,
  getWarehouses,
  getWarehouseSummary,
  updateWarehouse,
} from "../../api/inventoryApi";
import {
  BRANCHES,
  WAREHOUSE_STATUSES,
  WAREHOUSE_TYPES,
  computeWarehouseSummary,
  enrichApiWarehouse,
  formatCr,
} from "../../data/warehousesMasterData";
import { exportToExcel, exportToPdf } from "../../utils/exportUtils";

function SummaryCard({ label, value, icon: Icon, color, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold tabular-nums text-slate-900">
            {value ?? "—"}
          </p>
          {hint ? <p className="mt-0.5 text-xs text-slate-400">{hint}</p> : null}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status, primary }) {
  if (primary) {
    return (
      <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
        Primary
      </span>
    );
  }
  const active = (status || "").toLowerCase() === "active";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"
      }`}
    >
      {status || "—"}
    </span>
  );
}

const defaultFilters = {
  search: "",
  branch: "",
  warehouse_type: "",
  status: "",
};

const WRITE_ROLES = [
  "Admin",
  "Store Manager",
  "Warehouse Manager",
  "Store Keeper",
  "Production Manager",
];

const secondaryBtn =
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50";

export default function Warehouses() {
  const tenantId = useTenantId();
  const { addToast } = useToast();
  const { user, isAdmin } = usePermissions();
  const storeMode = isStoreManager(user);
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean);
  const canWrite = isAdmin || roles.some((r) => WRITE_ROLES.includes(r));

  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [apiSummary, setApiSummary] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [formWarehouse, setFormWarehouse] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [searchInput, setSearchInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, sRes] = await Promise.all([
        getWarehouses().catch(() => ({ data: [] })),
        getWarehouseSummary().catch(() => ({ data: null })),
      ]);
      setWarehouses((wRes.data || []).map((row, i) => enrichApiWarehouse(row, i)));
      setApiSummary(sRes.data);
    } catch {
      setWarehouses([]);
      setApiSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const openWarehouse = async (wh) => {
    setSelected(wh);
    setDetail(null);
    if (typeof wh.id === "number") {
      try {
        const res = await getWarehouseDetail(wh.id);
        setDetail(res.data);
      } catch {
        /* list data */
      }
    }
  };

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return warehouses.filter((w) => {
      if (q) {
        const hay = `${w.code} ${w.name} ${w.branch} ${w.manager_name} ${w.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.branch && w.branch !== filters.branch) return false;
      if (filters.warehouse_type && w.warehouse_type !== filters.warehouse_type) return false;
      if (filters.status && w.status !== filters.status) return false;
      return true;
    });
  }, [warehouses, filters]);

  const summary = useMemo(() => {
    if (apiSummary && !filters.search && !filters.branch && !filters.status && !filters.warehouse_type) {
      return {
        total: apiSummary.total_warehouses,
        active: apiSummary.active_warehouses,
        inventoryValue: apiSummary.total_inventory_value,
        utilizationPct: apiSummary.storage_utilization_pct,
      };
    }
    const local = computeWarehouseSummary(filtered);
    return {
      total: local.total,
      active: local.active,
      inventoryValue: local.inventoryValue,
      utilizationPct: local.utilizationPct,
    };
  }, [apiSummary, filtered, filters]);

  const hasFilters = Boolean(
    searchInput.trim() || filters.branch || filters.warehouse_type || filters.status
  );

  const exportColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Warehouse Name" },
    { key: "warehouse_type", label: "Type" },
    { key: "branch", label: "Location" },
    { key: "manager_name", label: "Manager" },
    { key: "capacity", label: "Capacity" },
    { key: "used_capacity", label: "Used" },
    { key: "status", label: "Status" },
  ];

  const handleExportExcel = () => {
    if (!filtered.length) return addToast("Nothing to export", "warning");
    exportToExcel(filtered, exportColumns, "warehouses");
    addToast("Exported to Excel");
    setExportOpen(false);
  };

  const handleExportPdf = () => {
    if (!filtered.length) return addToast("Nothing to export", "warning");
    exportToPdf(filtered, exportColumns, "Warehouses", "warehouses");
    addToast("Exported to PDF");
    setExportOpen(false);
  };

  const handleSave = async (form) => {
    const usedCap = form.used_capacity !== "" && form.used_capacity != null ? Number(form.used_capacity) : 0;
    const cap = form.capacity !== "" && form.capacity != null ? Number(form.capacity) : null;
    const payload = {
      tenant_id: tenantId,
      name: form.name,
      code: form.code,
      branch: form.branch,
      plant: form.plant,
      warehouse_type: form.warehouse_type,
      state: form.state,
      city: form.city,
      address: form.address,
      manager_name: form.manager_name,
      manager_phone: form.manager_phone,
      capacity: cap,
      used_capacity: usedCap,
      is_primary: form.is_primary,
      status: form.status,
    };
    try {
      if (formWarehouse?.id && typeof formWarehouse.id === "number") {
        await updateWarehouse(formWarehouse.id, payload);
        addToast("Warehouse updated");
      } else {
        await createWarehouseFull(payload);
        addToast("Warehouse created");
      }
      loadWarehouses();
      setFormWarehouse(null);
    } catch (err) {
      addToast(err.response?.data?.detail || "Could not save warehouse", "error");
    }
  };

  const handleDeactivate = async (wh) => {
    if (!canWrite) return;
    if (!window.confirm(`Deactivate ${wh.name}?`)) return;
    if (typeof wh.id === "number") {
      try {
        await deactivateWarehouse(wh.id);
        addToast("Warehouse deactivated");
        loadWarehouses();
        setSelected(null);
      } catch {
        addToast("Could not deactivate", "error");
      }
      return;
    }
    setWarehouses((prev) => prev.map((w) => (w.id === wh.id ? { ...w, status: "inactive" } : w)));
    setSelected(null);
    addToast("Warehouse deactivated");
  };

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-slate-600">{r.code}</span>
      ),
    },
    {
      key: "name",
      label: "Warehouse",
      render: (r) => (
        <div className="min-w-0 max-w-[220px]">
          <button
            type="button"
            onClick={() => openWarehouse(r)}
            className="block truncate text-left text-sm font-semibold text-slate-900 hover:text-[var(--color-primary)]"
          >
            {r.name}
          </button>
          <p className="truncate text-xs text-slate-500">{r.warehouse_type || "General"}</p>
        </div>
      ),
    },
    {
      key: "branch",
      label: "Location",
      render: (r) => (
        <span className="text-sm text-slate-700">
          {[r.branch || r.city, r.state].filter(Boolean).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "manager_name",
      label: "Manager",
      render: (r) => <span className="text-sm text-slate-700">{r.manager_name || "—"}</span>,
    },
    {
      key: "utilization",
      label: "Utilization",
      render: (r) => {
        const pct = Math.min(100, Math.max(0, Number(r.utilization_pct || 0)));
        return (
          <div className="w-[120px]">
            <div className="mb-1 flex justify-between text-[11px] tabular-nums text-slate-500">
              <span>{pct}%</span>
              <span>
                {Number(r.used_capacity || 0).toLocaleString("en-IN")}
                {r.capacity != null ? ` / ${Number(r.capacity).toLocaleString("en-IN")}` : ""}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${pct >= 85 ? "bg-amber-500" : "bg-[var(--color-primary)]"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusPill status={r.status} primary={r.is_primary} />,
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => openWarehouse(r)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[var(--color-primary)]"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canWrite && (
            <button
              type="button"
              onClick={() => setFormWarehouse(r)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading && warehouses.length === 0) {
    return (
      <div className="space-y-6 pb-8">
        {storeMode ? <StoreManagerNav /> : null}
        <Loader label="Loading warehouses..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {storeMode ? <StoreManagerNav /> : null}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Warehouses</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Manage store locations, capacity, and utilization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canWrite && (
            <button type="button" onClick={() => setFormWarehouse({})} className="ui-btn-primary">
              <Plus className="h-4 w-4" /> Add Warehouse
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className={secondaryBtn}
            >
              <Download className="h-4 w-4" /> Export
            </button>
            {exportOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label="Close export menu"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Excel
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    PDF
                  </button>
                </div>
              </>
            )}
          </div>
          <button type="button" onClick={loadWarehouses} className={secondaryBtn}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <SummaryCard
          label="Active"
          value={summary.active}
          icon={Warehouse}
          color="bg-emerald-600"
        />
        <SummaryCard
          label="Stock Value"
          value={formatCr(summary.inventoryValue)}
          icon={Warehouse}
          color="bg-teal-600"
        />
        <SummaryCard
          label="Avg Utilization"
          value={`${summary.utilizationPct ?? 0}%`}
          icon={Warehouse}
          color="bg-amber-500"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Search warehouses…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">All statuses</option>
              {WAREHOUSE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold ${
                showAdvanced
                  ? "border-[var(--color-primary)] bg-sky-50 text-[var(--color-primary)]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setFilters(defaultFilters);
                }}
                className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {filtered.length} warehouse{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        {showAdvanced && (
          <div className="mb-4 grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-2 lg:grid-cols-3">
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={filters.warehouse_type}
              onChange={(e) => setFilters((f) => ({ ...f, warehouse_type: e.target.value }))}
            >
              <option value="">All types</option>
              {WAREHOUSE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={filters.branch}
              onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
            >
              <option value="">All locations</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}

        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder=""
          searchKeys={[]}
          showSearch={false}
          pageSize={10}
          emptyState={
            <div className="py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Warehouse className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700">
                {hasFilters ? "No warehouses match your filters" : "No warehouses yet"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {hasFilters
                  ? "Clear filters to see all locations."
                  : "Add your first warehouse to start receiving stock."}
              </p>
              {canWrite && !hasFilters && (
                <button type="button" onClick={() => setFormWarehouse({})} className="ui-btn-primary mt-5">
                  <Plus className="h-4 w-4" /> Add Warehouse
                </button>
              )}
            </div>
          }
        />
      </div>

      {selected && (
        <WarehouseDetailModal
          warehouse={selected}
          detail={detail}
          onClose={() => {
            setSelected(null);
            setDetail(null);
          }}
          onEdit={
            canWrite
              ? (w) => {
                  setFormWarehouse(w);
                  setSelected(null);
                }
              : undefined
          }
          onDeactivate={canWrite ? handleDeactivate : undefined}
        />
      )}

      {formWarehouse && canWrite && (
        <WarehouseFormModal
          warehouse={formWarehouse}
          onClose={() => setFormWarehouse(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
