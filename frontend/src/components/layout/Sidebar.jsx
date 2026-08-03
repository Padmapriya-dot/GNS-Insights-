import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  Factory,
  FolderOpen,
  Landmark,
  Layers,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
  Wrench,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import BrandLogo from "../common/BrandLogo";
import LogoutConfirmModal from "../common/LogoutConfirmModal";
import useAuth from "../../hooks/useAuth";
import { getSidebarMenus } from "../../api/authApi";
import { userCanAccess, isStoreManager, storeManagerPathAllowed } from "../../config/permissions";
import { SIDEBAR_NAV, sectionHasActiveChild, isPathActive } from "../../config/sidebarNav";
import { STORE_MANAGER_NAV_ITEMS } from "../../config/storeManagerNavConfig";

const ICON_BY_KEY = {
  dashboard: LayoutDashboard,
  manufacturingWorkflow: Factory,
  masters: Layers,
  production: Factory,
  inventory: Boxes,
  procurement: ShoppingCart,
  sales: Wallet,
  hr: Users,
  expense: Wallet,
  finance: Landmark,
  accountant: Landmark,
  quality: CheckCircle2,
  maintenance: Wrench,
  alerts: Bell,
  documents: FolderOpen,
  analytics: BarChart3,
  settings: Settings,
  admin: Settings,
};

/** UI-only grouping — does not change routes or RBAC. */
const NAV_GROUPS = [
  {
    id: "home",
    labelKey: "nav.groupHome",
    label: "Home",
    keys: ["dashboard", "manufacturingWorkflow"],
  },
  {
    id: "operations",
    labelKey: "nav.groupOperations",
    label: "Operations",
    keys: ["masters", "production", "inventory", "quality", "maintenance"],
  },
  {
    id: "commerce",
    labelKey: "nav.groupCommerce",
    label: "Commerce",
    keys: ["procurement", "sales"],
  },
  {
    id: "peopleFinance",
    labelKey: "nav.groupPeopleFinance",
    label: "People & Finance",
    keys: ["hr", "expense", "finance", "accountant"],
  },
  {
    id: "insights",
    labelKey: "nav.groupInsights",
    label: "Insights",
    keys: ["alerts", "documents", "analytics"],
  },
  {
    id: "system",
    labelKey: "nav.groupSystem",
    label: "System",
    keys: ["admin", "settings"],
  },
];

function buildStoreManagerSidebarNav() {
  return STORE_MANAGER_NAV_ITEMS.map((item) => {
    if (item.action) {
      return {
        key: item.key,
        label: item.label,
        action: item.action,
        icon: item.icon,
      };
    }
    if (item.children?.length) {
      return {
        key: item.key,
        label: item.label,
        icon: item.icon,
        module: "inventory",
        children: item.children.map((c) => ({
          key: c.key,
          label: c.label,
          to: c.to,
          module: "inventory",
          end: c.end,
        })),
      };
    }
    return {
      key: item.key,
      label: item.label,
      to: item.to,
      icon: item.icon,
      module: "inventory",
      end: item.end,
    };
  });
}

function mapApiMenusToNav(menus) {
  return (menus || []).map((section) => {
    const Icon = ICON_BY_KEY[section.key] || LayoutDashboard;
    if (section.path && !(section.children && section.children.length)) {
      return {
        key: section.key,
        label: section.label,
        to: section.path,
        icon: Icon,
        module: section.module,
        end: section.path === "/",
      };
    }
    return {
      key: section.key,
      label: section.label,
      icon: Icon,
      module: section.module,
      children: (section.children || []).map((c) => ({
        label: c.label,
        to: c.path,
        module: c.module,
      })),
    };
  });
}

const PROD_MANAGER_ALLOWED_SECTIONS = new Set([
  "dashboard",
  "masters",
  "production",
  "inventory",
  "procurement",
  "quality",
  "maintenance",
  "alerts",
  "documents",
  "analytics",
]);

const PROD_MANAGER_ALLOWED_CHILDREN = new Set([
  "/masters/products",
  "/masters/bom",
  "/production/machines",
  "/production/planning",
  "/production/mrp",
  "/production/work-orders",
  "/production/schedule",
  "/factory-monitor/live-production",
  "/production/tasks",
  "/production/assign-tasks",
  "/production/batches",
  "/production/reports",
  "/inventory/raw-materials",
  "/inventory/finished-goods",
  "/inventory/stock-transfer",
  "/procurement/vendors",
  "/procurement/material-requests",
  "/quality/in-process",
  "/quality/final",
  "/quality/defects",
  "/maintenance/preventive",
  "/maintenance/breakdowns",
  "/maintenance/machine-history",
  "/alerts",
  "/alerts/low-stock",
  "/alerts/machine-failure",
  "/alerts/production-delay",
  "/alerts/maintenance",
  "/alerts/quality",
  "/alerts/safety",
  "/alerts/general",
  "/documents",
  "/documents/production",
  "/documents/quality",
  "/documents/reports",
  "/analytics/production",
  "/analytics/inventory",
  "/analytics/live",
]);

function isProductionManager(user) {
  if (!user) return false;
  const roles = Array.isArray(user.roles)
    ? user.roles.map((r) => (typeof r === "object" ? r.name : String(r)))
    : [];
  const roleStr = String(user.role || user.role_name || (typeof user.roles === "string" ? user.roles : "")).toLowerCase();
  const allRoles = [...roles.map((r) => String(r).toLowerCase()), roleStr];
  if (allRoles.some((r) => r.includes("admin"))) return false;
  return allRoles.some((r) => r.includes("production manager") || r.includes("production_manager"));
}

function filterStaticNav(user) {
  const storeMgr = isStoreManager(user);
  const isPM = isProductionManager(user);
  return SIDEBAR_NAV.map((section) => {
    if (isPM && !PROD_MANAGER_ALLOWED_SECTIONS.has(section.key)) return null;
    if (section.to) {
      if (!userCanAccess(user, section.module)) return null;
      if (storeMgr && !storeManagerPathAllowed(section.to)) return null;
      return section;
    }
    let children = (section.children || []).filter((c) => {
      if (isPM && !PROD_MANAGER_ALLOWED_CHILDREN.has(c.to)) return false;
      return userCanAccess(user, c.module);
    });
    if (storeMgr) {
      children = children.filter((c) => storeManagerPathAllowed(c.to));
    }
    if (children.length === 0) return null;
    return { ...section, children };
  }).filter(Boolean);
}

function buildInitialExpanded(pathname, nav) {
  const state = {};
  nav.forEach((section) => {
    if (section.children && sectionHasActiveChild(pathname, section)) {
      state[section.key] = true;
    }
  });
  return state;
}

function groupNavItems(nav) {
  const byKey = new Map(nav.map((s) => [s.key, s]));
  const used = new Set();
  const groups = [];

  for (const group of NAV_GROUPS) {
    const items = group.keys.map((k) => byKey.get(k)).filter(Boolean);
    if (!items.length) continue;
    items.forEach((i) => used.add(i.key));
    groups.push({ ...group, items });
  }

  const leftover = nav.filter((s) => !used.has(s.key));
  if (leftover.length) {
    groups.push({
      id: "other",
      labelKey: "nav.groupOther",
      label: "More",
      items: leftover,
    });
  }
  return groups;
}

function CollapsedFlyout({ section, label, childLabelFn, onNavigate, onClose }) {
  const location = useLocation();
  const Icon = section.icon || LayoutDashboard;
  const hasActive = section.children
    ? sectionHasActiveChild(location.pathname, section)
    : isPathActive(location.pathname, section.to, section.end);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const closeTimer = useRef(null);

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!section.children?.length) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.top, left: rect.right + 8 });
    }
    setOpen(true);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const triggerClass = `flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
    hasActive
      ? "bg-teal-500/20 text-white ring-1 ring-teal-400/40"
      : "text-slate-300 hover:bg-white/10 hover:text-white"
  }`;

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      {section.to ? (
        <NavLink
          ref={triggerRef}
          to={section.to}
          end={section.end}
          onClick={onNavigate}
          title={label}
          className={() => triggerClass}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </NavLink>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          title={label}
          className={triggerClass}
          aria-haspopup={section.children?.length ? "menu" : undefined}
          aria-expanded={section.children?.length ? open : undefined}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      )}

      {open && section.children?.length
        ? createPortal(
            <div
              role="menu"
              style={{ top: pos.top, left: pos.left }}
              className="fixed z-[80] min-w-[200px] rounded-xl border border-slate-700/80 bg-[#0a2744] py-2 shadow-xl animate-[fadeIn_0.12s_ease-out]"
              onMouseEnter={openMenu}
              onMouseLeave={scheduleClose}
            >
              <p className="mb-1 border-b border-white/10 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </p>
              {section.children.map((child) => {
                const active = isPathActive(location.pathname, child.to, child.end);
                return (
                  <NavLink
                    key={`${section.key}-${child.to}`}
                    to={child.to}
                    end={child.end}
                    role="menuitem"
                    onClick={() => {
                      onNavigate?.();
                      onClose?.();
                      setOpen(false);
                    }}
                    className={`block px-3 py-2 text-[13px] transition-colors ${
                      active
                        ? "bg-teal-500/15 font-medium text-teal-100"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {childLabelFn(child)}
                  </NavLink>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export default function Sidebar({ collapsed = false, onToggleCollapse, onClose }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [apiNav, setApiNav] = useState(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const storeMode = isStoreManager(user);

  useEffect(() => {
    if (!isAuthenticated) {
      setApiNav(null);
      return;
    }
    let cancelled = false;
    getSidebarMenus()
      .then((menus) => {
        if (!cancelled) setApiNav(mapApiMenusToNav(menus));
      })
      .catch(() => {
        if (!cancelled) setApiNav(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, user?.role, user?.role_id]);

  const visibleNav = useMemo(() => {
    if (storeMode) {
      return buildStoreManagerSidebarNav();
    }
    const staticNav = filterStaticNav(user);
    const raw = staticNav.length ? staticNav : apiNav && apiNav.length ? apiNav : [];
    if (isProductionManager(user)) {
      return raw
        .map((section) => {
          if (!PROD_MANAGER_ALLOWED_SECTIONS.has(section.key)) return null;
          if (!section.children) return section;
          const children = section.children.filter((c) => PROD_MANAGER_ALLOWED_CHILDREN.has(c.to));
          if (children.length === 0) return null;
          return { ...section, children };
        })
        .filter(Boolean);
    }
    return raw;
  }, [apiNav, user, storeMode]);

  const navGroups = useMemo(() => groupNavItems(visibleNav), [visibleNav]);

  const [expanded, setExpanded] = useState(() =>
    buildInitialExpanded(location.pathname, visibleNav)
  );

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      visibleNav.forEach((section) => {
        if (section.children && sectionHasActiveChild(location.pathname, section)) {
          next[section.key] = true;
        }
      });
      return next;
    });
  }, [location.pathname, visibleNav]);

  const toggleSection = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmLogout = async ({ allDevices }) => {
    setLoggingOut(true);
    try {
      await logout({ allDevices });
      onClose?.();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  };

  const topLinkClass = ({ isActive }) =>
    `relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
      isActive
        ? "bg-teal-500/20 font-semibold text-white before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r before:bg-teal-400"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  const childLinkClass = ({ isActive }) =>
    `relative block rounded-lg py-2 pl-10 pr-3 text-[13px] transition-colors duration-150 ${
      isActive
        ? "bg-teal-500/15 font-medium text-teal-50 before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r before:bg-teal-400"
        : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
    }`;

  const sectionButtonClass = (_isOpen, hasActive) =>
    `relative flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
      hasActive
        ? "bg-white/10 text-white before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r before:bg-teal-400"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  const actionButtonClass =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-rose-500/15 hover:text-rose-100";

  const sectionLabel = (section) => section.label || (section.labelKey ? t(section.labelKey) : section.key);
  const childLabel = (child) => child.label || (child.labelKey ? t(child.labelKey) : child.to);

  const renderSection = (section) => {
    if (section.action === "logout") {
      const Icon = section.icon || LayoutDashboard;
      if (collapsed) {
        return (
          <button
            key={section.key}
            type="button"
            title={section.label}
            onClick={() => setLogoutOpen(true)}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-rose-500/15 hover:text-rose-100"
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        );
      }
      return (
        <button
          key={section.key}
          type="button"
          onClick={() => setLogoutOpen(true)}
          className={actionButtonClass}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          <span className="truncate">{section.label}</span>
        </button>
      );
    }

    if (collapsed) {
      return (
        <CollapsedFlyout
          key={section.key}
          section={section}
          label={sectionLabel(section)}
          childLabelFn={childLabel}
          onNavigate={() => onClose?.()}
          onClose={onClose}
        />
      );
    }

    if (section.to) {
      const Icon = section.icon || LayoutDashboard;
      const label = sectionLabel(section);
      return (
        <NavLink
          key={section.key}
          to={section.to}
          end={section.end}
          onClick={() => onClose?.()}
          className={topLinkClass}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          <span className="truncate">{label}</span>
        </NavLink>
      );
    }

    const Icon = section.icon || LayoutDashboard;
    const isOpen = expanded[section.key];
    const hasActive = sectionHasActiveChild(location.pathname, section);
    const label = sectionLabel(section);

    return (
      <div key={section.key} className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggleSection(section.key)}
          className={sectionButtonClass(isOpen, hasActive)}
          aria-expanded={isOpen}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
            <span className="truncate text-left">{label}</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 opacity-70 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
          />
        </button>
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-0.5 pb-1 pt-0.5">
              {(section.children || []).map((child) => (
                <NavLink
                  key={`${section.key}-${child.to}-${child.label || child.key}`}
                  to={child.to}
                  end={child.end}
                  onClick={() => onClose?.()}
                  className={childLinkClass}
                >
                  {childLabel(child)}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside className="relative flex h-full w-full shrink-0 flex-col bg-[#0B1F33] text-white">
      {typeof onToggleCollapse === "function" ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3 top-[48%] z-20 hidden h-10 w-6 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-slate-300/80 bg-[#0B1F33] text-slate-200 shadow-sm transition hover:bg-[#12304a] hover:text-white lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" strokeWidth={2.25} />
          ) : (
            <ChevronsLeft className="h-4 w-4" strokeWidth={2.25} />
          )}
        </button>
      ) : null}

      <div className={`shrink-0 border-b border-white/10 ${collapsed ? "p-3" : "px-4 py-4"}`}>
        <Link
          to={storeMode ? "/inventory" : "/"}
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
          onClick={() => onClose?.()}
        >
          <BrandLogo size="md" imageClassName="rounded-lg bg-white/95 p-0.5" />
          {!collapsed && (
            <div className="min-w-0 animate-[fadeIn_0.2s_ease-out]">
              <p className="text-base font-bold tracking-tight">GNS Insights</p>
              <p className="text-[10px] leading-tight text-slate-400">
                {storeMode ? "Store Manager" : t("nav.tagline")}
              </p>
            </div>
          )}
        </Link>
      </div>

      <nav
        className={`sidebar-scroll flex-1 overflow-y-auto py-3 ${collapsed ? "px-2" : "px-3"}`}
        aria-label="Main navigation"
      >
        {storeMode || collapsed ? (
          <div className={`space-y-1 ${collapsed ? "flex flex-col items-center" : ""}`}>
            {visibleNav.map((section) => renderSection(section))}
          </div>
        ) : (
          <div className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.id}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {t(group.labelKey, group.label)}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((section) => renderSection(section))}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {!collapsed && !storeMode && (
        <div className="shrink-0 border-t border-white/10 px-4 py-3">
          <p className="text-center text-[10px] font-medium tracking-wide text-slate-500">
            {t("nav.footerTagline")}
          </p>
        </div>
      )}

      <LogoutConfirmModal
        open={logoutOpen}
        busy={loggingOut}
        onCancel={() => {
          if (!loggingOut) setLogoutOpen(false);
        }}
        onConfirm={handleConfirmLogout}
      />
    </aside>
  );
}
