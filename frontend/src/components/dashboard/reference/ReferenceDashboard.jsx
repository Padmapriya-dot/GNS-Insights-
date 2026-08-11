import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock,
  Cpu,
  Gauge,
  IndianRupee,
  ListTodo,
  Package,
  Play,
  Plus,
  RefreshCw,
  ShoppingCart,
  Square,
  Target,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import EmptyChart from "../../common/EmptyChart";
import SkeletonCard, { SkeletonChart } from "../../common/SkeletonCard";
import { quickActionsRef } from "../../../data/referenceDashboardData";
import { getErpDashboard } from "../../../api/dashboardApi";
import { getMachines, updateMachineStatus } from "../../../api/productionApi";
import useAuth from "../../../hooks/useAuth";
import { useToast } from "../../../context/ToastContext";
import useManufacturingRefresh from "../../../hooks/useManufacturingRefresh";
import { userCanAccess, isOperator } from "../../../config/permissions";
import { CardShell, KpiIcon, StatusBadge, TrendBadge, getKpiAccent } from "./ReferenceParts";

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
  fontSize: 12,
};

const KPI_TITLE_KEYS = {
  "total-orders": "totalOrders",
  "today-production": "todaysProduction",
  "machines-running": "machinesRunning",
  "pending-orders": "pendingOrders",
  "good-qty": "goodQtyToday",
  "reject-qty": "rejectQtyToday",
  "inventory-value": "inventoryValue",
  "low-stock": "lowStockItems",
  "raw-materials": "rawMaterials",
  "finished-goods": "finishedGoods",
  warehouses: "warehouses",
  "stock-movements": "stockMovements",
};

const TREND_LABEL_KEYS = {
  "vs last 7 days": "vsLast7Days",
  "vs yesterday": "vsYesterday",
  "vs total machines": "vsTotalMachines",
  "units on hand": "unitsOnHand",
  "active locations": "activeLocations",
  "GRNs today": "grnsToday",
};

const SHOP_FLOOR_KEYS = {
  Running: "running",
  Idle: "idle",
  Setup: "setup",
  Maintenance: "maintenance",
  Breakdown: "breakdown",
};

const INVENTORY_KEYS = ["rawMaterials", "wipItems", "finishedGoods", "lowStockItems"];
const WAREHOUSE_KEYS = ["mainStore", "productionStore", "fgStore", "others"];
const QUICK_ACTION_KEYS = ["newWorkOrder", "productionEntry", "materialIssue", "stockTransfer", "qcEntry", "reports"];
const QUICK_ACTION_MODULES = ["production", "production", "inventory", "inventory", "quality", "analytics"];
const SUMMARY_KEYS = ["manPower", "workingHours", "powerConsumption", "productionEfficiency", "targetAchievement"];

const EMPTY_ORDERS = { total: 0, inProgress: 0, completed: 0, onHold: 0, progress: 0 };
const PERIOD_KEYS = { Daily: "daily", Weekly: "weekly", Monthly: "monthly" };

const summaryIcons = { users: Users, clock: Clock, zap: Zap, gauge: Gauge, target: Target, boxes: Boxes, cart: ShoppingCart, alert: AlertTriangle, package: Package };
const alertIcons = { alert: AlertTriangle, wrench: Wrench, box: Package, check: CheckCircle2, cart: ShoppingCart };
const blockIcons = { boxes: Boxes, cog: Wrench, package: Package, alert: AlertTriangle };

function sectionVisible(sections, key) {
  if (!Array.isArray(sections) || sections.length === 0) return true;
  return sections.includes(key);
}

function formatInr(n) {
  const v = Number(n) || 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `₹${v.toLocaleString()}`;
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 pb-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <SkeletonChart />
        </div>
        <div className="xl:col-span-3">
          <SkeletonChart />
        </div>
        <div className="xl:col-span-4">
          <SkeletonChart />
        </div>
      </div>
    </div>
  );
}

function DashboardHero({ profile, dateLabel, onRefresh, refreshing }) {
  const { t } = useTranslation();
  const isStore = profile === "store";
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
          {isStore ? t("refDashboard.storeOperations", "Store Operations") : t("refDashboard.executiveOverview", "Executive Overview")}
        </p>
        <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {isStore
            ? t("refDashboard.storeDashboardTitle", "Store Operations")
            : t("refDashboard.manufacturingDashboardTitle", "Manufacturing Dashboard")}
        </h2>
        {dateLabel ? (
          <p className="mt-1 text-xs text-slate-500">
            {t("refDashboard.asOf", "As of")} {dateLabel}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
        {t("common.refresh", "Refresh")}
      </button>
    </div>
  );
}

function KpiStrip({ cards = [] }) {
  const { t } = useTranslation();
  if (!cards.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
        {t("common.noData", "No data available.")}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const titleKey = KPI_TITLE_KEYS[card.id];
        const trendKey = TREND_LABEL_KEYS[card.trendLabel];
        const accent = getKpiAccent(card.id);
        const cls =
          "group relative block overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md";
        const inner = (
          <>
            <span className={`absolute inset-x-0 top-0 h-0.5 ${accent.bar}`} aria-hidden />
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.iconBg}`}>
                <KpiIcon id={card.id} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium leading-tight text-slate-500">
                  {titleKey ? t(`refDashboard.${titleKey}`) : card.title}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-slate-900">
                  {card.value}
                  {card.unit ? <span className="ml-1 text-sm font-semibold text-slate-500">{card.unit}</span> : null}
                  {card.suffix ? <span className="text-lg font-semibold text-slate-400">{card.suffix}</span> : null}
                </p>
                <TrendBadge
                  up={card.trendUp}
                  value={card.trend}
                  label={trendKey ? t(`refDashboard.${trendKey}`) : card.trendLabel}
                />
              </div>
            </div>
          </>
        );
        return card.link ? (
          <Link key={card.id} to={card.link} className={cls}>
            {inner}
          </Link>
        ) : (
          <div key={card.id} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

function PendingTasks({ overview, inventoryBlocks = [], alerts = [], profile }) {
  const { t } = useTranslation();
  const lowStock = inventoryBlocks.find((b) => b.key === "low_stock")?.count ?? 0;
  const tasks = [];

  if (profile === "store") {
    if (overview?.total) {
      tasks.push({
        id: "dispatch",
        label: overview?.labels?.total || t("refDashboard.pendingDispatch", "Pending Dispatch"),
        value: overview.total,
        to: "/sales/dispatch",
        tone: "amber",
      });
    }
    if (overview?.inProgress) {
      tasks.push({
        id: "grn-qc",
        label: overview?.labels?.inProgress || t("refDashboard.pendingGrnQc", "Pending GRN QC"),
        value: overview.inProgress,
        to: "/procurement/goods-receipt",
        tone: "sky",
      });
    }
    if (lowStock) {
      tasks.push({
        id: "low-stock",
        label: t("refDashboard.lowStockItems"),
        value: lowStock,
        to: "/alerts/low-stock",
        tone: "rose",
      });
    }
  } else {
    if (overview?.inProgress) {
      tasks.push({
        id: "in-progress",
        label: t("refDashboard.inProgress"),
        value: overview.inProgress,
        to: "/production/work-orders",
        tone: "sky",
      });
    }
    if (overview?.onHold) {
      tasks.push({
        id: "on-hold",
        label: t("refDashboard.onHold"),
        value: overview.onHold,
        to: "/production/work-orders",
        tone: "rose",
      });
    }
    if (lowStock) {
      tasks.push({
        id: "low-stock",
        label: t("refDashboard.lowStockItems"),
        value: lowStock,
        to: "/alerts/low-stock",
        tone: "amber",
      });
    }
  }

  if (alerts.length) {
    tasks.push({
      id: "alerts",
      label: t("refDashboard.openAlerts", "Open Alerts"),
      value: alerts.length,
      to: "/alerts",
      tone: "violet",
    });
  }

  const toneClass = {
    sky: "bg-sky-50 text-sky-800 ring-sky-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    rose: "bg-rose-50 text-rose-800 ring-rose-200",
    violet: "bg-violet-50 text-violet-800 ring-violet-200",
  };

  return (
    <CardShell
      title={t("refDashboard.pendingTasks", "Pending Tasks")}
      subtitle={t("refDashboard.pendingTasksHint", "Items that need attention today")}
      action={
        <ListTodo className="h-4 w-4 text-slate-400" aria-hidden />
      }
    >
      {!tasks.length ? (
        <p className="py-6 text-center text-sm text-slate-500">{t("refDashboard.allCaughtUp", "You're all caught up.")}</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                to={task.to}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50"
              >
                <span className="text-sm font-medium text-slate-700">{task.label}</span>
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ring-1 ring-inset ${toneClass[task.tone]}`}>
                  {Number(task.value).toLocaleString()}
                  <ArrowRight className="h-3 w-3 opacity-70" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}

function FinancialSnapshot({ inventoryBlocks = [] }) {
  const { t } = useTranslation();
  const raw = inventoryBlocks.find((b) => b.key === "raw");
  const fg = inventoryBlocks.find((b) => b.key === "fg");
  const low = inventoryBlocks.find((b) => b.key === "low_stock");
  const totalValue = (Number(raw?.value) || 0) + (Number(fg?.value) || 0);

  const rows = [
    { label: t("refDashboard.totalInventoryValue", "Total Inventory Value"), value: formatInr(totalValue), icon: IndianRupee },
    { label: t("refDashboard.rawMaterials"), value: formatInr(raw?.value), icon: Boxes },
    { label: t("refDashboard.finishedGoods"), value: formatInr(fg?.value), icon: Package },
    { label: t("refDashboard.lowStockItems"), value: String(low?.count ?? 0), icon: AlertTriangle },
  ];

  return (
    <CardShell
      title={t("refDashboard.financialSnapshot", "Financial Snapshot")}
      subtitle={t("refDashboard.financialSnapshotHint", "Inventory valuation from live stock")}
      action={
        <Link to="/analytics/finance" className="text-xs font-semibold text-teal-700 hover:underline">
          {t("common.viewAll")}
        </Link>
      }
    >
      <ul className="space-y-2.5">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <Icon className="h-4 w-4 text-teal-700" aria-hidden />
                {row.label}
              </span>
              <span className="text-sm font-bold tabular-nums text-slate-900">{row.value}</span>
            </li>
          );
        })}
      </ul>
    </CardShell>
  );
}

function ProductionOverview({ chartSets }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("Daily");
  const chartData = chartSets?.[period] ?? [];
  const hasChartData = chartData.length > 0;
  return (
    <CardShell
      title={t("refDashboard.productionOverview")}
      className="h-full"
      action={
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold" role="tablist" aria-label={t("refDashboard.productionOverview")}>
          {Object.entries(PERIOD_KEYS).map(([label, key]) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={period === label}
              onClick={() => setPeriod(label)}
              className={`rounded-md px-2.5 py-1 transition-colors ${period === label ? "bg-white text-teal-800 shadow-sm" : "text-slate-500"}`}
            >
              {t(`refDashboard.${key}`)}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-[260px] w-full">
        {hasChartData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} key={period}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Line type="monotone" dataKey="planned" name={t("refDashboard.plannedQty")} stroke="#0f6d84" strokeWidth={2.5} dot={{ r: 3, fill: "#0f6d84" }} />
              <Line type="monotone" dataKey="actual" name={t("refDashboard.actualQty")} stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3, fill: "#16a34a" }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message={t("common.noData", "No data available.")} />
        )}
      </div>
    </CardShell>
  );
}

function ShopFloorStatus({ statusData = [] }) {
  const { t } = useTranslation();
  const total = statusData.reduce((s, d) => s + d.value, 0);
  if (!statusData.length) {
    return (
      <CardShell title={t("refDashboard.shopFloorStatus")} className="h-full">
        <EmptyChart message={t("common.noData", "No data available.")} className="min-h-[180px]" />
      </CardShell>
    );
  }
  return (
    <CardShell title={t("refDashboard.shopFloorStatus")} className="h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-[160px] w-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={2}>
                {statusData.map((e) => (
                  <Cell key={e.name} fill={e.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium text-slate-500">{t("refDashboard.totalMachines")}</span>
            <span className="text-2xl font-bold text-slate-900">{total}</span>
          </div>
        </div>
        <ul className="w-full space-y-2 text-sm">
          {statusData.map((item) => {
            const key = SHOP_FLOOR_KEYS[item.name];
            return (
              <li key={item.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{key ? t(`refDashboard.${key}`) : item.name}</span>
                </span>
                <span className="shrink-0 font-bold tabular-nums text-slate-800">{item.value}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </CardShell>
  );
}

function TopMachines({ machines = [] }) {
  const { t } = useTranslation();
  if (!machines.length) {
    return (
      <CardShell title={t("refDashboard.topMachines")} className="h-full">
        <p className="py-8 text-center text-sm text-slate-500">{t("common.noData", "No data available.")}</p>
      </CardShell>
    );
  }
  return (
    <CardShell title={t("refDashboard.topMachines")} className="h-full">
      <ul className="space-y-3">
        {machines.map((m) => (
          <li key={m.id} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
              {String(m.id).split("-")[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-slate-700">{m.id}</span>
                <span className="font-bold tabular-nums text-teal-800">{m.utilization}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal-600" style={{ width: `${m.utilization}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function OrdersOverview({ overview = EMPTY_ORDERS }) {
  const { t } = useTranslation();
  const labels = overview.labels || {};
  const stats = [
    { label: labels.total || t("refDashboard.totalOrders"), value: overview.total, color: "text-sky-700" },
    { label: labels.inProgress || t("refDashboard.inProgress"), value: overview.inProgress, color: "text-amber-600" },
    { label: labels.completed || t("refDashboard.completed"), value: overview.completed, color: "text-emerald-700" },
    { label: labels.onHold || t("refDashboard.onHold"), value: overview.onHold, color: "text-rose-600" },
  ];
  return (
    <CardShell title={t("refDashboard.ordersOverview")}>
      <div className="mb-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-medium text-slate-500">{s.label}</p>
            <p className={`text-xl font-bold tabular-nums ${s.color}`}>{Number(s.value ?? 0).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-medium text-slate-600">{t("refDashboard.overallProgress")}</span>
          <span className="font-bold tabular-nums text-teal-800">{overview.progress}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-teal-600" style={{ width: `${overview.progress}%` }} />
        </div>
      </div>
    </CardShell>
  );
}

function InventorySummary({ blocks = [], warehouses = [] }) {
  const { t } = useTranslation();
  if (!blocks.length) {
    return (
      <CardShell title={t("refDashboard.inventorySummary")}>
        <p className="py-8 text-center text-sm text-slate-500">{t("common.noData", "No data available.")}</p>
      </CardShell>
    );
  }
  return (
    <CardShell title={t("refDashboard.inventorySummary")}>
      <div className="mb-4 grid grid-cols-2 gap-3">
        {blocks.map((b, i) => {
          const Icon = blockIcons[b.icon] || Boxes;
          const labelKey = INVENTORY_KEYS[i];
          return (
            <div key={b.label} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${b.color || "#0f6d84"}18`, color: b.color || "#0f6d84" }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums text-slate-800">{Number(b.count ?? 0).toLocaleString()}</p>
                <p className="text-[10px] leading-tight text-slate-500">
                  {labelKey ? t(`refDashboard.${labelKey}`) : b.label}
                </p>
                {b.quantity !== undefined && b.quantity !== b.count && b.quantity > 0 ? (
                  <p className="text-[9px] font-medium text-slate-400">{Number(b.quantity).toLocaleString()} units</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mb-2 text-xs font-semibold text-slate-600">{t("refDashboard.warehouseLocation")}</p>
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {warehouses.map((w, i) => (
          <div
            key={w.name}
            style={{ width: `${w.pct || 0}%`, backgroundColor: w.color || "#94A3B8" }}
            title={WAREHOUSE_KEYS[i] ? t(`refDashboard.${WAREHOUSE_KEYS[i]}`) : w.name}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
        {warehouses.map((w, i) => (
          <span key={w.name} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: w.color || "#94A3B8" }} />
            {WAREHOUSE_KEYS[i] ? t(`refDashboard.${WAREHOUSE_KEYS[i]}`) : w.name}
          </span>
        ))}
      </div>
    </CardShell>
  );
}

function AlertsNotifications({ alerts = [] }) {
  const { t } = useTranslation();
  return (
    <CardShell
      title={t("refDashboard.alertsNotifications")}
      action={
        <Link to="/alerts" className="text-xs font-semibold text-teal-700 hover:underline">
          {t("common.viewAll")}
        </Link>
      }
    >
      {!alerts.length ? (
        <p className="py-6 text-center text-sm text-slate-500">{t("common.noData", "No data available.")}</p>
      ) : (
        <ul className="max-h-[220px] space-y-3 overflow-y-auto pr-1">
          {alerts.map((a, i) => {
            const Icon = alertIcons[a.icon] || AlertTriangle;
            const inner = (
              <>
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${a.color || "#0f6d84"}18`, color: a.color || "#0f6d84" }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-slate-700">{a.message}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{a.time || "—"}</p>
                </div>
              </>
            );
            return (
              <li key={a.id || i}>
                {a.link ? (
                  <Link to={a.link} className="-m-1 flex gap-3 rounded-lg p-1 hover:bg-slate-50">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex gap-3">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </CardShell>
  );
}

function QuickActions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (isOperator(user)) return null;
  const visible = quickActionsRef.filter((_, i) => userCanAccess(user, QUICK_ACTION_MODULES[i]));
  if (!visible.length) return null;
  return (
    <CardShell title={t("refDashboard.quickActions")}>
      <div className="grid grid-cols-2 gap-2.5">
        {quickActionsRef.map((a, i) => {
          if (!userCanAccess(user, QUICK_ACTION_MODULES[i])) return null;
          const labelKey = QUICK_ACTION_KEYS[i];
          return (
            <Link
              key={a.label}
              to={a.to}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 text-center transition hover:border-teal-200 hover:bg-teal-50/50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: a.bg }}>
                <Plus className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-slate-700">
                {labelKey ? t(`refDashboard.${labelKey}`) : a.label}
              </span>
            </Link>
          );
        })}
      </div>
    </CardShell>
  );
}

function RecentWorkOrders({ workOrders = [] }) {
  const { t } = useTranslation();
  return (
    <CardShell
      title={t("refDashboard.recentWorkOrders")}
      action={
        <Link to="/production/work-orders" className="text-xs font-semibold text-teal-700 hover:underline">
          {t("common.viewAll")}
        </Link>
      }
    >
      {!workOrders.length ? (
        <p className="py-6 text-center text-sm text-slate-500">{t("common.noRecords", "No records found.")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-3 font-semibold">{t("refDashboard.woNo")}</th>
                <th className="pb-2 pr-3 font-semibold">{t("refDashboard.product")}</th>
                <th className="pb-2 pr-3 font-semibold">{t("refDashboard.qty")}</th>
                <th className="pb-2 pr-3 font-semibold">{t("refDashboard.status")}</th>
                <th className="pb-2 font-semibold">{t("refDashboard.dueDate")}</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => (
                <tr key={wo.wo} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pr-3 font-semibold text-teal-800">{wo.wo}</td>
                  <td className="py-2.5 pr-3 text-slate-700">{wo.product}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{wo.qty}</td>
                  <td className="py-2.5 pr-3">
                    <StatusBadge status={wo.status} />
                  </td>
                  <td className="py-2.5 text-xs text-slate-500">{wo.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardShell>
  );
}

function isProductionManagerUser(user) {
  if (!user) return false;
  const roles = Array.isArray(user.roles)
    ? user.roles.map((r) => (typeof r === "object" ? r.name : String(r)))
    : [];
  const roleStr = String(user.role || user.role_name || (typeof user.roles === "string" ? user.roles : "")).toLowerCase();
  const allRoles = [...roles.map((r) => String(r).toLowerCase()), roleStr];
  if (allRoles.some((r) => r.includes("admin"))) return false;
  return allRoles.some((r) => r.includes("production manager") || r.includes("production_manager"));
}

function TodaysSummary({ items = [] }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isPM = isProductionManagerUser(user);
  const isOp = isOperator(user);
  const filteredItems = useMemo(() => {
    if (isOp) {
      return items.filter(
        (item) =>
          item.key !== "manPower" &&
          item.key !== "manpower" &&
          item.key !== "powerConsumption" &&
          item.key !== "stockMovements" &&
          item.label !== "Man Power" &&
          item.label !== "Manpower" &&
          item.label !== "Power Consumption" &&
          item.label !== "Stock Movements"
      );
    }
    if (isPM) {
      return items.filter(
        (item) =>
          item.key !== "powerConsumption" &&
          item.key !== "stockMovements" &&
          item.label !== "Power Consumption" &&
          item.label !== "Stock Movements"
      );
    }
    return items;
  }, [items, isPM, isOp]);

  if (!filteredItems.length) {
    return (
      <CardShell title={t("refDashboard.todaysSummary")}>
        <p className="py-8 text-center text-sm text-slate-500">{t("common.noData", "No data available.")}</p>
      </CardShell>
    );
  }
  return (
    <CardShell title={t("refDashboard.todaysSummary")}>
      <ul className="space-y-2.5">
        {filteredItems.map((item, i) => {
          const Icon = summaryIcons[item.icon] || BarChart3;
          const label = item.key
            ? t(`refDashboard.${item.key}`, item.label)
            : SUMMARY_KEYS[i]
              ? t(`refDashboard.${SUMMARY_KEYS[i]}`)
              : item.label;
          return (
            <li key={item.key || item.label || i} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <span className="flex items-center gap-2.5 text-sm text-slate-600">
                <Icon className="h-4 w-4 text-teal-700" aria-hidden />
                {label}
              </span>
              <span className="text-sm font-bold tabular-nums text-slate-800">{item.value}</span>
            </li>
          );
        })}
      </ul>
    </CardShell>
  );
}

function MachineControlCard() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const isOp = isOperator(user);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reasonModalMachine, setReasonModalMachine] = useState(null);
  const [reasonInput, setReasonInput] = useState("");

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    try {
      let local = [];
      try {
        const stored = localStorage.getItem("smrt_local_machines");
        if (stored) local = JSON.parse(stored);
      } catch {}

      const res = await getMachines().catch(() => ({ data: [] }));
      const apiList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

      if (apiList.length > 0 || local.length > 0) {
        const merged = [...local, ...apiList];
        const seen = new Set();
        const dedupped = merged.filter((m) => {
          const key = m.id || m.code || m.name;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setMachines(dedupped);
      } else {
        setMachines([]);
      }
    } catch {
      setMachines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const saveMachinesState = (newList) => {
    setMachines(newList);
    try {
      localStorage.setItem("smrt_local_machines", JSON.stringify(newList));
    } catch {}
  };

  const handleStartMachine = async (m) => {
    const updated = machines.map((item) =>
      (item.id && item.id === m.id) || (item.code && item.code === m.code) || item.name === m.name
        ? { ...item, status: "running", idle_reason: null }
        : item
    );
    saveMachinesState(updated);
    if (addToast) addToast(`${m.name} started`, "success");
    if (typeof m.id === "number") {
      updateMachineStatus(m.id, null, "running").catch(() => null);
    }
  };

  const handleStopMachine = async (m) => {
    const updated = machines.map((item) =>
      (item.id && item.id === m.id) || (item.code && item.code === m.code) || item.name === m.name
        ? { ...item, status: "stopped" }
        : item
    );
    saveMachinesState(updated);
    if (addToast) addToast(`${m.name} stopped`, "info");
    if (typeof m.id === "number") {
      updateMachineStatus(m.id, null, "stopped").catch(() => null);
    }
  };

  const handleSaveReason = (e) => {
    e?.preventDefault();
    if (!reasonModalMachine) return;
    const r = reasonInput.trim() || "Maintenance";
    const updated = machines.map((item) =>
      (item.id && item.id === reasonModalMachine.id) ||
      (item.code && item.code === reasonModalMachine.code) ||
      item.name === reasonModalMachine.name
        ? { ...item, status: "stopped", idle_reason: r }
        : item
    );
    saveMachinesState(updated);
    if (addToast) addToast(`Reason for ${reasonModalMachine.name} set to: ${r}`, "success");
    if (typeof reasonModalMachine.id === "number") {
      updateMachineStatus(reasonModalMachine.id, null, "stopped", r).catch(() => null);
    }
    setReasonModalMachine(null);
    setReasonInput("");
  };

  const runningCount = machines.filter((m) => m.status === "running").length;
  const idleCount = machines.filter((m) => m.status === "idle").length;
  const stoppedCount = machines.filter(
    (m) => m.status === "stopped" || m.status === "down" || m.status === "breakdown"
  ).length;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">Machine Control</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMachines}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            title="Refresh Machines"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            to="/production/machines"
            className="text-xs sm:text-sm font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
          >
            All Machines &rarr;
          </Link>
        </div>
      </div>

      {/* Summary Pills Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-around gap-2 rounded-2xl bg-slate-50/90 border border-slate-100 px-4 py-2.5 text-xs font-bold">
        <span className="flex items-center text-emerald-700">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500" />
          Running: {runningCount}
        </span>
        <span className="flex items-center text-amber-700">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-amber-500" />
          Idle: {idleCount}
        </span>
        <span className="flex items-center text-rose-700">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-rose-500" />
          Stopped: {stoppedCount}
        </span>
      </div>

      {/* Machine Cards Container */}
      {machines.length === 0 ? (
        <div className="py-10 text-center">
          <Cpu className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-600">No machines added yet.</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Add a machine to monitor and control it here.</p>
          {!isOp && (
            <Link
              to="/production/create-machine"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Machine
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
          {machines.map((m) => {
            const isRunning = m.status === "running";
            const isStopped = m.status === "stopped" || m.status === "down" || m.status === "breakdown";
            const isIdle = m.status === "idle";

            const cardBorderBg = isRunning
              ? "border-emerald-200/90 bg-emerald-50/20"
              : isStopped
              ? "border-rose-200/90 bg-rose-50/20"
              : "border-amber-200/90 bg-amber-50/20";

            return (
              <div key={m.id || m.code || m.name} className={`rounded-2xl border ${cardBorderBg} p-4 transition-all`}>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">{m.name}</span>
                      <span className="rounded-full bg-slate-100/90 px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                        {m.code || m.id}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      {m.department || "Machining"} · {m.production_line || "Line A"}
                    </p>
                  </div>
                  {/* Status Pill Badge */}
                  {isRunning && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Running
                    </span>
                  )}
                  {isStopped && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-200">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Stopped
                    </span>
                  )}
                  {isIdle && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Idle
                    </span>
                  )}
                </div>

                {m.idle_reason && (
                  <p className="mt-2 text-xs font-medium text-amber-800 bg-amber-50/80 border border-amber-200 rounded-lg px-2.5 py-1">
                    Reason: {m.idle_reason}
                  </p>
                )}

                {/* Bottom Actions Row */}
                <div className="mt-3.5 flex items-center justify-between border-t border-slate-100/80 pt-3">
                  <span className="text-xs font-semibold text-slate-600">
                    Operator: <strong className="text-slate-900">{m.assigned_operator || m.operator_name || user?.full_name || "Ravi"}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {!isRunning ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartMachine(m)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Start Machine
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReasonModalMachine(m);
                            setReasonInput(m.idle_reason || "");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors shadow-xs cursor-pointer"
                        >
                          <Wrench className="h-3.5 w-3.5" />
                          Reason
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStopMachine(m)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-xs cursor-pointer"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" />
                        Stop Machine
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Downtime / Reason Modal */}
      {reasonModalMachine && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900">
                Stop Reason for {reasonModalMachine.name}
              </h4>
              <button
                type="button"
                onClick={() => setReasonModalMachine(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveReason} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Select or enter reason:
                </label>
                <select
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-400"
                >
                  <option value="">-- Select Reason --</option>
                  <option value="Tooling Maintenance">Tooling Maintenance</option>
                  <option value="Material Shortage">Material Shortage</option>
                  <option value="Operator Break">Operator Break</option>
                  <option value="Scheduled Servicing">Scheduled Servicing</option>
                  <option value="Quality Inspection">Quality Inspection</option>
                  <option value="Power Outage">Power Outage</option>
                </select>
                <input
                  type="text"
                  placeholder="Or type custom reason..."
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReasonModalMachine(null)}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600"
                >
                  Save Reason
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReferenceDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isOp = isOperator(user);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    getErpDashboard()
      .then((res) => setApiData(res.data))
      .catch(() => {
        setApiData(null);
        setError("Failed to load dashboard data.");
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);
  useManufacturingRefresh(() => load(true));

  const profile = apiData?.dashboard_profile || "full";
  const sections = apiData?.visible_sections || [];
  const isStoreProfile = profile === "store";

  const kpiCardsLive = useMemo(() => {
    if (!apiData?.kpi_cards?.length) return [];
    let localGood = 0;
    let localReject = 0;
    let hasLocalOrders = false;
    try {
      const stored = localStorage.getItem("smrt_local_production_orders");
      if (stored) {
        const orders = JSON.parse(stored);
        if (orders.length > 0) hasLocalOrders = true;
        orders.forEach((o) => {
          const g = Number(o.good_qty ?? o.good_quantity ?? o.accepted_quantity ?? 0);
          const r = Number(o.reject_qty ?? o.rejected_quantity ?? o.scrap_quantity ?? o.scrap ?? 0);
          const p = Number(o.produced_quantity ?? o.actual_quantity ?? 0);
          const effectiveGood = g > 0 ? g : p > 0 ? Math.max(p - r, p) : 0;
          localGood += effectiveGood;
          localReject += r;
        });
      }
    } catch {
      /* ignore local storage parse errors */
    }

    return apiData.kpi_cards.map((k) => {
      let val = k.value ?? "0";
      if (k.id === "good-qty" || k.title?.toLowerCase().includes("good")) {
        if (hasLocalOrders) val = String(localGood);
        else if (val === "0" || !val) val = String(localGood);
      }
      if (
        (k.id === "reject-qty" || k.title?.toLowerCase().includes("reject") || k.title?.toLowerCase().includes("scrap")) &&
        (val === "0" || !val) &&
        localReject > 0
      ) {
        val = String(localReject);
      }
      return { ...k, value: val };
    });
  }, [apiData]);

  const chartSets = useMemo(() => {
    if (!apiData) return null;
    return {
      Daily: apiData.production_overview || [],
      Weekly: apiData.production_overview_weekly || [],
      Monthly: apiData.production_overview_monthly || [],
    };
  }, [apiData]);

  const alertsLive = useMemo(() => apiData?.alerts_feed || [], [apiData]);
  const ordersOverview = useMemo(
    () => ({ ...EMPTY_ORDERS, ...(apiData?.orders_overview || {}) }),
    [apiData]
  );

  const workOrdersLive = useMemo(() => {
    if (!apiData?.recent_work_orders?.length) return [];
    return apiData.recent_work_orders.map((w) => ({
      wo: w.wo,
      product: w.product,
      qty: w.qty,
      status: w.status,
      due: w.due ? String(w.due).slice(0, 10) : "—",
    }));
  }, [apiData]);

  const dateLabel = useMemo(() => {
    if (!apiData?.date) return "";
    try {
      return new Date(apiData.date).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return apiData.date;
    }
  }, [apiData]);

  const showProduction = !isOp && !isStoreProfile && sectionVisible(sections, "production_overview");
  const showShopFloor = !isOp && !isStoreProfile && sectionVisible(sections, "shop_floor");
  const showTopMachines = !isOp && !isStoreProfile && sectionVisible(sections, "top_machines");
  const showInventory = !isOp && sectionVisible(sections, "inventory");
  const showQuickActions = !isOp && sectionVisible(sections, "quick_actions");
  const showRecentWo = !isStoreProfile && sectionVisible(sections, "recent_work_orders");
  const showFinance = !isOp && showInventory;

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-sm text-rose-700" role="alert">
        {error}
        <button
          type="button"
          onClick={() => load(false)}
          className="mt-4 block w-full font-semibold text-teal-800 hover:underline sm:inline sm:w-auto"
        >
          {t("common.retry", "Retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <DashboardHero
        profile={profile}
        dateLabel={dateLabel}
        onRefresh={() => load(true)}
        refreshing={refreshing}
      />

      {sectionVisible(sections, "kpi") ? <KpiStrip cards={kpiCardsLive} /> : null}

      <div className={`grid grid-cols-1 gap-5 ${isOp ? "lg:grid-cols-1" : "lg:grid-cols-3"}`}>
        {!isOp ? (
          <PendingTasks
            overview={ordersOverview}
            inventoryBlocks={apiData?.inventory_blocks || []}
            alerts={alertsLive}
            profile={profile}
          />
        ) : null}
        {showFinance ? <FinancialSnapshot inventoryBlocks={apiData?.inventory_blocks || []} /> : null}
        {sectionVisible(sections, "todays_summary") ? (
          <TodaysSummary items={apiData?.todays_summary || []} />
        ) : null}
      </div>

      {(showProduction || showShopFloor || showTopMachines || (isOp && sectionVisible(sections, "production_overview"))) && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {(showProduction || (isOp && sectionVisible(sections, "production_overview"))) && (
            <div className={isOp ? "xl:col-span-6" : (!showShopFloor && !showTopMachines) ? "xl:col-span-12" : "xl:col-span-5"}>
              <ProductionOverview chartSets={chartSets} />
            </div>
          )}
          {isOp && (
            <div className="xl:col-span-6">
              <MachineControlCard />
            </div>
          )}
          {showShopFloor ? (
            <div className="xl:col-span-3">
              <ShopFloorStatus statusData={apiData?.shop_floor_status || []} />
            </div>
          ) : null}
          {showTopMachines ? (
            <div className="xl:col-span-4">
              <TopMachines machines={apiData?.top_machines || []} />
            </div>
          ) : null}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-5 ${isOp ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        {sectionVisible(sections, "orders_overview") ? <OrdersOverview overview={ordersOverview} /> : null}
        {showInventory ? (
          <InventorySummary blocks={apiData?.inventory_blocks || []} warehouses={apiData?.warehouse_locations || []} />
        ) : null}
        {sectionVisible(sections, "alerts") ? <AlertsNotifications alerts={alertsLive} /> : null}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {showQuickActions ? (
          <div className="xl:col-span-3">
            <QuickActions />
          </div>
        ) : null}
        {showRecentWo ? (
          <div className={showQuickActions ? "xl:col-span-9" : "xl:col-span-12"}>
            <RecentWorkOrders workOrders={workOrdersLive} />
          </div>
        ) : null}
      </div>

      <footer className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-4 text-center text-[11px] text-slate-500 sm:flex-row sm:text-left">
        <p>{t("refDashboard.copyright")}</p>
        <p>{t("refDashboard.poweredBy")}</p>
      </footer>
    </div>
  );
}
