import { Suspense, useState } from "react";
import { useLocation } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import RouteFallback from "./components/common/RouteFallback";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import Breadcrumbs from "./components/common/Breadcrumbs";
import AiChatWidget from "./components/ai/AiChatWidget";
import useAuth from "./hooks/useAuth";

/** Routes that render without the ERP shell (sidebar + navbar). */
function isShellLessRoute(pathname) {
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/landing" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email"
  ) {
    return true;
  }
  if (pathname.startsWith("/gns-admin")) return true;
  if (pathname.startsWith("/settings")) return true;
  return false;
}

function isOperatorRole(user) {
  const role = user?.role_name || user?.role || "";
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const names = roles.map((item) => (typeof item === "string" ? item : item?.name || ""));
  return role.toLowerCase() === "operator" || names.some((name) => name.toLowerCase() === "operator");
}

function isOperationsRoute(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return (
    normalized === "/" ||
    normalized === "/operations" ||
    normalized.startsWith("/operations/") ||
    normalized === "/factory-monitor" ||
    normalized.startsWith("/factory-monitor/") ||
    normalized === "/iot" ||
    normalized === "/iot/live-operations" ||
    normalized.startsWith("/iot/live-operations/") ||
    normalized.startsWith("/iot/")
  );
}

export function shouldShowChatbot(user, pathname) {
  if (!isOperatorRole(user)) return false;
  if (!isOperationsRoute(pathname)) return false;
  if (pathname === "/login" || pathname === "/register" || pathname === "/landing" || pathname === "/forgot-password" || pathname === "/reset-password" || pathname === "/verify-email") return false;
  if (pathname.startsWith("/gns-admin")) return false;
  if (pathname.startsWith("/settings")) return false;
  return true;
}

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const showChatbot = shouldShowChatbot(user, location.pathname);
  const isInvoiceEditor =
    location.pathname === "/sales/invoices/create" ||
    location.pathname === "/sales/quotations/create" ||
    location.pathname === "/sales/payment-receipts/create" ||
    location.pathname === "/sales/proforma-invoices/create" ||
    location.pathname === "/sales/export-invoices/create" ||
    location.pathname === "/sales/delivery-challans/create" ||
    location.pathname === "/sales/credit-notes/create" ||
    location.pathname === "/sales/debit-notes/create" ||
    location.pathname === "/purchases/create" ||
    location.pathname === "/purchases/payments-made/create" ||
    location.pathname === "/purchases/debit-notes/create" ||
    location.pathname === "/procurement/purchase-orders/create" ||
    /^\/sales\/invoices\/[^/]+\/copy$/.test(location.pathname);
  const isSalesDocList =
    location.pathname === "/sales/invoices" ||
    location.pathname === "/sales/quotations" ||
    location.pathname === "/sales/payment-receipts" ||
    location.pathname === "/sales/refund-vouchers" ||
    location.pathname === "/sales/proforma-invoices" ||
    location.pathname === "/sales/export-proforma-invoices" ||
    location.pathname === "/sales/export-invoices" ||
    location.pathname === "/sales/delivery-challans" ||
    location.pathname === "/sales/credit-notes" ||
    location.pathname === "/sales/debit-notes" ||
    location.pathname === "/purchases" ||
    location.pathname === "/purchases/payments-made" ||
    location.pathname === "/purchases/debit-notes" ||
    location.pathname === "/procurement/purchase-orders";
  const isEInvoiceLogin = location.pathname === "/sales/e-invoice";
  const isFullBleedSales = isInvoiceEditor || isSalesDocList || isEInvoiceLogin;

  if (isShellLessRoute(location.pathname)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Suspense fallback={<RouteFallback />}>
          <AppRoutes />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#F4F7FE]">
      <a
        href="#main-content"
        className="absolute left-4 top-4 z-[100] -translate-y-[200%] rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-lg outline-none ring-2 ring-teal-500 ring-offset-2 transition-transform focus:translate-y-0 dark:ring-offset-slate-900"
      >
        Skip to main content
      </a>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed left-0 top-0 z-50 h-full transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarCollapsed ? "w-[72px]" : "w-60"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className={`min-h-0 flex-1 outline-none ${
            isInvoiceEditor || isEInvoiceLogin
              ? "overflow-hidden bg-[#F5F5F5]"
              : isSalesDocList
                ? "overflow-y-auto bg-[#F5F5F5]"
                : "overflow-y-auto bg-[#F4F7FE] p-4 pb-8 sm:p-5 lg:p-6"
          }`}
        >
          {isFullBleedSales ? (
            <div className={isInvoiceEditor || isEInvoiceLogin ? "h-full min-h-0" : "min-h-full"}>
              <Suspense fallback={<RouteFallback />}>
                <AppRoutes />
              </Suspense>
            </div>
          ) : (
            <div className="ui-page ui-stack">
              <Breadcrumbs />
              <Suspense fallback={<RouteFallback />}>
                <AppRoutes />
              </Suspense>
            </div>
          )}
          {showChatbot && <AiChatWidget />}
        </main>
      </div>
    </div>
  );
}
