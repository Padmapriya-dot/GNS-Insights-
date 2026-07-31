import {
  ArrowLeftRight,
  Boxes,
  Building2,
  ClipboardList,
  Contact,
  Crown,
  FileBarChart2,
  History,
  Layers,
  LayoutDashboard,
  LogOut,
  Package,
  PackageMinus,
  PackagePlus,
  RotateCcw,
  Settings,
  ShoppingCart,
  Warehouse,
} from "lucide-react";

/**
 * Role-based Store Manager sidebar — grouped like commercial ERP menus
 * (Purchases / Inventory / Masters / Ledger / Reports / Settings).
 */
export const STORE_MANAGER_NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    to: "/inventory/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    key: "purchases",
    label: "Purchases",
    icon: ShoppingCart,
    children: [
      { key: "vendors", label: "Vendors", to: "/procurement/vendors", icon: Building2 },
      { key: "stockIn", label: "Stock In", to: "/inventory/stock-in", icon: PackagePlus },
      {
        key: "purchaseRequisitions",
        label: "Purchase Requisitions",
        to: "/procurement/material-requests",
        icon: ClipboardList,
      },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: Boxes,
    children: [
      { key: "allItems", label: "All Items", to: "/inventory", icon: Package, end: true },
      {
        key: "materialRequests",
        label: "Material Requests",
        to: "/inventory/material-requests",
        icon: ClipboardList,
      },
      {
        key: "issue",
        label: "Issue Materials",
        to: "/inventory/issue-materials",
        icon: PackageMinus,
      },
      { key: "return", label: "Stock Return", to: "/inventory/stock-return", icon: RotateCcw },
      {
        key: "transfer",
        label: "Stock Transfer",
        to: "/inventory/stock-transfer",
        icon: ArrowLeftRight,
      },
      { key: "warehouses", label: "Warehouses", to: "/inventory/warehouses", icon: Warehouse },
      { key: "inventorySettings", label: "Inventory Settings", to: "/inventory/settings", icon: Settings },
    ],
  },
  {
    key: "ledger",
    label: "Ledger",
    to: "/accounts/ledger",
    icon: History,
  },
  {
    key: "expense",
    label: "Expense",
    to: "/accounts/expenses",
    icon: FileBarChart2,
  },
  {
    key: "masters",
    label: "Masters",
    icon: Layers,
    children: [
      { key: "products", label: "Products", to: "/masters/products", icon: Package },
      { key: "vendorsMaster", label: "Vendors", to: "/procurement/vendors", icon: Building2 },
      {
        key: "warehousesMaster",
        label: "Warehouses",
        to: "/inventory/warehouses",
        icon: Warehouse,
      },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    to: "/inventory/stock-ledger",
    icon: FileBarChart2,
  },
  {
    key: "settings",
    label: "Settings",
    to: "/settings",
    icon: Settings,
    end: true,
  },
  {
    key: "subscription",
    label: "Subscription",
    to: "/settings/subscription",
    icon: Crown,
  },
  {
    key: "contact",
    label: "Contact Us",
    to: "/settings/my-account",
    icon: Contact,
  },
  {
    key: "logout",
    label: "Logout",
    action: "logout",
    icon: LogOut,
  },
];
