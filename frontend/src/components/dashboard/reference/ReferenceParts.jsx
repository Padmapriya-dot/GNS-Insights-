import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Cog,
  Factory,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
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
  "warehouses": Warehouse,
  "stock-movements": ClipboardList,
};

export function KpiIcon({ id, className = "h-7 w-7" }) {
  const Icon = KPI_ICONS[id] || BarChart3;
  return <Icon className={className} strokeWidth={1.75} />;
}

export function TrendBadge({ up, value, label }) {
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <p className="mt-2 flex items-center gap-1 text-[11px] text-white/90">
      <Icon className="h-3.5 w-3.5" />
      <span className="font-semibold">{up ? "↑" : "↓"} {value}</span>
      <span className="text-white/70">{label}</span>
    </p>
  );
}

export function CardShell({ title, children, action, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold text-[#1E293B]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  const map = {
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    planned: "bg-orange-100 text-orange-700",
    on_hold: "bg-red-100 text-red-700",
  };
  const labelKey = {
    in_progress: "refDashboard.statusInProgress",
    completed: "refDashboard.statusCompleted",
    planned: "refDashboard.statusPlanned",
    on_hold: "refDashboard.statusOnHold",
  }[status];
  const label = labelKey ? t(labelKey) : status.replace(/_/g, " ");
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[status] || "bg-slate-100 text-slate-600"}`}>
      {label}
    </span>
  );
}

export { ChevronRight, Boxes, Package, Wrench, CheckCircle2, ShoppingCart, Users };
