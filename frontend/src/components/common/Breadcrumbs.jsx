import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const pathLabels = {
  "": "Dashboard",
  production: "Production",
  planning: "Production Planning",
  "work-orders": "Work Orders",
  tasks: "Tasks",
  batches: "Batch Tracking",
  machines: "Machines",
  reports: "Daily Reports",
  create: "Create",
  inventory: "Inventory",
  "raw-materials": "Raw Materials",
  "finished-goods": "Finished Goods",
  "stock-transfer": "Stock Transfer",
  "stock-adjustment": "Stock Adjustment",
  "stock-ledger": "Stock Ledger",
  "stock-movement": "Stock Movement",
  items: "Items",
  warehouses: "Warehouses",
  suppliers: "Suppliers",
  sales: "Sales",
  leads: "Leads",
  quotations: "Quotations",
  orders: "Sales Orders",
  dispatch: "Dispatch",
  invoices: "Invoices",
  customers: "Customers",
  payments: "Payments",
  hr: "HR",
  employees: "Employees",
  attendance: "Attendance",
  leave: "Leave",
  payroll: "Payroll",
  accounts: "Accounts",
  procurement: "Procurement",
  "purchase-orders": "Purchase Orders",
  vendors: "Vendors",
  "goods-receipt": "Goods Receipt",
  "supply-chain": "Supply Chain",
  masters: "Masters",
  products: "Products",
  bom: "Bill of Materials",
  quality: "Quality",
  analytics: "Analytics",
  forecasting: "Forecasting",
  alerts: "Alerts",
  "low-stock": "Low Stock",
  documents: "Documents",
  admin: "Admin",
  users: "Users",
  roles: "Roles",
  permissions: "Permissions",
  "audit-logs": "Audit Logs",
  integrations: "Integrations",
  settings: "Settings",
  "factory-monitor": "Factory Monitor",
  "live-production": "Live Production",
  "machine-status": "Machine Status",
  "production-lines": "Production Lines",
  iot: "IoT",
};

function getLabel(segment, segments, index) {
  const prev = index > 0 ? segments[index - 1] : null;
  if (segment === "create" && prev === "items") return "Create Item";
  if (segment === "create" && prev === "warehouses") return "Create Warehouse";
  if (segment === "create" && prev === "suppliers") return "Create Supplier";
  if (segment === "create" && prev === "orders") return "Create Sales Order";
  if (segment === "create" && prev === "purchase-orders") return "Create Purchase Order";
  if (segment === "create-quick" && prev === "work-orders") return "Quick Work Order";
  return pathLabels[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Breadcrumbs({ items: customItems }) {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  const items = customItems ?? (() => {
    if (segments[0] === "admin") {
      const adminLabels = {
        users: "Users",
        roles: "Roles",
        permissions: "Permissions",
        "audit-logs": "Audit Logs",
      };
      const trail = [{ label: "Dashboard", path: "/" }, { label: "Settings", path: "/admin/users" }];
      segments.slice(1).forEach((seg, i) => {
        const slice = segments.slice(0, i + 2);
        trail.push({
          label: adminLabels[seg] || getLabel(seg, segments, i + 1),
          path: `/${slice.join("/")}`,
        });
      });
      return trail;
    }

    return [
      { label: "Dashboard", path: "/" },
      ...segments.map((seg, i) => ({
        label: getLabel(seg, segments, i),
        path: "/" + segments.slice(0, i + 1).join("/"),
      })),
    ];
  })();

  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
      {items.map((item, i) => (
        <span key={item.path + i} className="flex items-center gap-1.5 min-w-0">
          {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />}
          {i === items.length - 1 ? (
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
              {i === 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Home className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Dashboard</span>
                </span>
              ) : (
                item.label
              )}
            </span>
          ) : (
            <Link
              to={item.path}
              className="hover:text-teal-600 transition-colors flex items-center gap-1 truncate"
            >
              {i === 0 ? <Home className="h-4 w-4 shrink-0" aria-hidden /> : item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
