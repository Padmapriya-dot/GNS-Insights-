import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Cog,
  Factory,
  FileText,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";

export const KPI_ICONS = {
  "total-orders": ClipboardList,
  "today-production": Factory,
  "machines-running": Cog,
  "pending-orders": FileText,
  "good-qty": CheckCircle2,
  "reject-qty": AlertTriangle,
  "inventory-value": TrendingUp,
  "low-stock": AlertTriangle,
  "raw-materials": Boxes,
  "finished-goods": Package,
  warehouses: Warehouse,
  "stock-movements": ClipboardList,
};

const KPI_ACCENT = {
  "total-orders": { iconBg: "bg-sky-50 text-sky-700", bar: "bg-sky-600" },
  "today-production": { iconBg: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-600" },
  "machines-running": { iconBg: "bg-violet-50 text-violet-700", bar: "bg-violet-600" },
  "pending-orders": { iconBg: "bg-amber-50 text-amber-700", bar: "bg-amber-600" },
  "good-qty": { iconBg: "bg-teal-50 text-teal-700", bar: "bg-teal-600" },
  "reject-qty": { iconBg: "bg-rose-50 text-rose-700", bar: "bg-rose-600" },
  "inventory-value": { iconBg: "bg-sky-50 text-sky-700", bar: "bg-sky-600" },
  "low-stock": { iconBg: "bg-rose-50 text-rose-700", bar: "bg-rose-600" },
  "raw-materials": { iconBg: "bg-blue-50 text-blue-700", bar: "bg-blue-600" },
  "finished-goods": { iconBg: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-600" },
  warehouses: { iconBg: "bg-indigo-50 text-indigo-700", bar: "bg-indigo-600" },
  "stock-movements": { iconBg: "bg-orange-50 text-orange-700", bar: "bg-orange-600" },
};

export function getKpiAccent(id) {
  return KPI_ACCENT[id] || { iconBg: "bg-slate-50 text-slate-700", bar: "bg-slate-600" };
}

export function KpiIcon({ id, className = "h-5 w-5" }) {
  const Icon = KPI_ICONS[id] || BarChart3;
  return <Icon className={className} strokeWidth={1.75} />;
}

/** Enterprise light-theme trend line (Dynamics / Fiori style). */
export function TrendBadge({ up, value, label }) {
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <p className={`mt-2 flex items-center gap-1 text-[11px] ${up ? "text-emerald-700" : "text-rose-600"}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="font-semibold tabular-nums">
        {up ? "↑" : "↓"} {value}
      </span>
      {label ? <span className="font-medium text-slate-500">{label}</span> : null}
    </p>
  );
}

export function CardShell({ title, children, action, className = "", subtitle }) {
  return (
    <section
      className={`rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  const map = {
    in_progress: "bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200",
    completed: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200",
    planned: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
    on_hold: "bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200",
  };
  const labelKey = {
    in_progress: "refDashboard.statusInProgress",
    completed: "refDashboard.statusCompleted",
    planned: "refDashboard.statusPlanned",
    on_hold: "refDashboard.statusOnHold",
  }[status];
  const label = labelKey ? t(labelKey) : String(status || "").replace(/_/g, " ");
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${map[status] || "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200"}`}
    >
      {label}
    </span>
  );
}

export { ChevronRight, Boxes, Package, Wrench, CheckCircle2, ShoppingCart, Users };
