import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Package,
  PackageCheck,
  Truck,
  Warehouse,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import { isAdmin, isStoreManager, storeManagerPathAllowed } from "../../config/permissions";

const NAV_ITEMS = [
  { key: "inventory", labelKey: "storeManagerNav.inventory", to: "/inventory", icon: Package, end: true },
  { key: "rawMaterials", labelKey: "storeManagerNav.rawMaterials", to: "/inventory/raw-materials", icon: Boxes },
  { key: "finishedGoods", labelKey: "storeManagerNav.finishedGoods", to: "/inventory/finished-goods", icon: PackageCheck },
  { key: "warehouse", labelKey: "storeManagerNav.warehouse", to: "/inventory/warehouses", icon: Warehouse },
  { key: "stockLedger", labelKey: "storeManagerNav.stockLedger", to: "/inventory/stock-ledger", icon: ClipboardList },
  { key: "grn", labelKey: "storeManagerNav.grn", to: "/procurement/goods-receipt", icon: Boxes },
  { key: "dispatch", labelKey: "storeManagerNav.dispatch", to: "/sales/dispatch", icon: Truck },
  { key: "lowStock", labelKey: "storeManagerNav.lowStock", to: "/alerts/low-stock", icon: AlertTriangle },
];

function shouldShowNav(user) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return isStoreManager(user);
}

export default function StoreManagerNav() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!shouldShowNav(user)) return null;

  const visible = isAdmin(user)
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => storeManagerPathAllowed(item.to));
  if (visible.length === 0) return null;

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-[#2563EB] text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  return (
    <nav
      aria-label={t("storeManagerNav.ariaLabel")}
      className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
    >
      {visible.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.key} to={item.to} end={item.end} className={linkClass}>
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {t(item.labelKey)}
          </NavLink>
        );
      })}
    </nav>
  );
}
