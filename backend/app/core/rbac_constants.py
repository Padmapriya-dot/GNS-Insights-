"""RBAC constants shared by permissions helpers and role seeding."""

MODULE_CATALOG = [
    {"code": "dashboard", "label": "Dashboard"},
    {"code": "masters", "label": "Masters"},
    {"code": "production", "label": "Production"},
    {"code": "inventory", "label": "Inventory & Raw Materials"},
    {"code": "procurement", "label": "Procurement"},
    {"code": "hr", "label": "HR & Employees"},
    {"code": "attendance", "label": "Attendance"},
    {"code": "sales", "label": "Sales & Billing"},
    {"code": "accounts", "label": "Accounts & Reports"},
    {"code": "quality", "label": "Quality Control"},
    {"code": "maintenance", "label": "Maintenance"},
    {"code": "analytics", "label": "Analytics"},
    {"code": "alerts", "label": "Alerts & Notifications"},
    {"code": "documents", "label": "Documents"},
    {"code": "factoryMonitor", "label": "Factory Monitor"},
    {"code": "iot", "label": "IoT & Smart Factory"},
    {"code": "settings", "label": "Settings"},
    {"code": "admin", "label": "Security & Administration"},
]

VALID_MODULES = {m["code"] for m in MODULE_CATALOG}

VALID_ACTIONS = frozenset({
    "read",
    "create",
    "update",
    "delete",
    "approve",
    "create_entry",
    "update_qty",
    "update_machine_status",
    "report_breakdown",
    "*",
})

# Canonical registerable role names (must match Role.name in DB).
REGISTERABLE_ROLES = [
    "Admin",
    "Sales Manager",
    "Production Manager",
    "Store Manager",
    "Purchase Manager",
    "Procurement Manager",
    "HR Manager",
    "Accountant",
    "Operator",
]

PERMISSION_MATRIX = {
    "Admin": {
        "modules": list(VALID_MODULES),
        "description": "Full system access — Management view of entire manufacturing workflow.",
    },
    "Sales Manager": {
        "modules": [
            "dashboard",
            "sales",
            "masters",
            "alerts",
            "documents",
            "analytics",
        ],
        "description": (
            "Leads, quotations, sales orders, customers, dispatch follow-up, and sales KPIs."
        ),
    },
    "Production Manager": {
        "modules": [
            "dashboard",
            "production",
            "quality",
            "analytics",
            "factoryMonitor",
            "alerts",
            "documents",
            "masters",
            "inventory",
            "maintenance",
            "procurement",
            "settings",
            "iot",
        ],
        "description": (
            "Dashboard, Production, Planning, Work Orders, Quality, "
            "Inventory, Maintenance, Procurement, and Smart Factory IoT."
        ),
    },
    "Store Manager": {
        "modules": [
            "dashboard",
            "inventory",
            "procurement",
            "masters",
            "alerts",
            "documents",
            "settings",
        ],
        "description": (
            "Store operations: inventory, warehouses, GRN, stock movements, and product master."
        ),
    },
    "Purchase Manager": {
        "modules": [
            "dashboard",
            "procurement",
            "inventory",
            "masters",
            "accounts",
            "alerts",
            "documents",
            "analytics",
        ],
        "description": "Full Vendor Master and purchase lifecycle access.",
    },
    "Procurement Manager": {
        "modules": [
            "dashboard",
            "procurement",
            "inventory",
            "masters",
            "accounts",
            "alerts",
            "documents",
            "analytics",
        ],
        "description": "Full Vendor Master and procurement operations access.",
    },
    "HR Manager": {
        "modules": ["dashboard", "hr", "attendance", "analytics", "alerts", "documents", "masters"],
        "description": "Dashboard, Employees, Attendance, Leave, Payroll, HR Reports.",
    },
    "Accountant": {
        "modules": [
            "dashboard",
            "accounts",
            "sales",
            "documents",
            "analytics",
            "alerts",
            "masters",
        ],
        "description": "Tax invoice, payments, AR/AP, and financial transactions.",
    },
    "Operator": {
        "modules": [
            "dashboard",
            "production",
            "factoryMonitor",
            "attendance",
            "documents",
            "alerts",
            "masters",
        ],
        "actions": [
            "production:read",
            "production:create_entry",
            "production:update_qty",
            "production:update_machine_status",
            "production:report_breakdown",
            "attendance:read",
            "documents:read",
        ],
        "description": (
            "Assigned work orders, shop floor, quantity/downtime entry, machine issues."
        ),
    },
}

# Sidebar / route paths Store Manager may see (inventory & warehouse only).
STORE_MANAGER_ALLOWED_PATHS = frozenset({
    "/",
    "/inventory",
    "/inventory/raw-materials",
    "/inventory/finished-goods",
    "/inventory/stock-transfer",
    "/inventory/stock-adjustment",
    "/inventory/stock-ledger",
    "/inventory/stock-movement",
    "/inventory/stock-in",
    "/inventory/material-requests",
    "/inventory/issue-materials",
    "/inventory/stock-return",
    "/inventory/history",
    "/inventory/warehouses",
    "/procurement/goods-receipt",
    "/procurement/material-requests",
    "/procurement/vendors",
    "/masters/products",
    "/settings",
    "/settings/subscription",
    "/settings/my-account",
    "/alerts/low-stock",
    "/documents",
    "/documents/purchase",
})


def store_manager_path_allowed(path: str | None) -> bool:
    """Return True when path is allowed for the Store Manager role."""
    if not path:
        return False
    normalized = path.rstrip("/") or "/"
    if normalized in STORE_MANAGER_ALLOWED_PATHS:
        return True
    if normalized.startswith("/inventory/"):
        return True
    if normalized.startswith("/masters/products"):
        return True
    if normalized.startswith("/procurement/goods-receipt"):
        return True
    if normalized.startswith("/procurement/material-requests"):
        return True
    if normalized.startswith("/procurement/vendors"):
        return True
    if normalized.startswith("/settings"):
        return True
    return False


# Sidebar menu catalog — filtered by role modules when building /api/sidebar.
SIDEBAR_MENU_CATALOG = [
    {
        "key": "dashboard",
        "label": "Dashboard",
        "path": "/",
        "module": "dashboard",
        "children": [],
    },
    {
        "key": "manufacturingWorkflow",
        "label": "Role Workflow",
        "path": "/manufacturing/workflow",
        "module": "dashboard",
        "children": [],
    },
    {
        "key": "masters",
        "label": "Masters",
        "path": None,
        "module": "masters",
        "children": [
            {"label": "Customers", "path": "/sales/customers", "module": "masters"},
            {"label": "Vendors", "path": "/procurement/vendors", "module": "masters"},
            {"label": "Products", "path": "/masters/products", "module": "masters"},
        ],
    },
    {
        "key": "production",
        "label": "Production",
        "path": None,
        "module": "production",
        "children": [
            {"label": "Production Planning", "path": "/production/planning", "module": "production"},
            {"label": "MRP", "path": "/production/mrp", "module": "production"},
            {"label": "Work Orders", "path": "/production/work-orders", "module": "production"},
            {"label": "Production Schedule", "path": "/production/schedule", "module": "production"},
            {"label": "Shop Floor", "path": "/factory-monitor/live-production", "module": "factoryMonitor"},
            {"label": "Machine Allocation", "path": "/production/tasks", "module": "production"},
            {"label": "Assign Tasks", "path": "/production/assign-tasks", "module": "production"},
            {"label": "Batch Tracking", "path": "/production/batches", "module": "production"},
            {"label": "Machine Status", "path": "/production/machines", "module": "production"},
        ],
    },
    {
        "key": "inventory",
        "label": "Inventory",
        "path": None,
        "module": "inventory",
        "children": [
            {"label": "Inventory", "path": "/inventory", "module": "inventory"},
            {"label": "Store Dashboard", "path": "/inventory/dashboard", "module": "inventory"},
            {"label": "Raw Materials", "path": "/inventory/raw-materials", "module": "inventory"},
            {"label": "Finished Goods", "path": "/inventory/finished-goods", "module": "inventory"},
            {"label": "Stock Transfer", "path": "/inventory/stock-transfer", "module": "inventory"},
            {"label": "Stock Adjustment", "path": "/inventory/stock-adjustment", "module": "inventory"},
            {"label": "Stock Ledger", "path": "/inventory/stock-ledger", "module": "inventory"},
            {"label": "Warehouse", "path": "/inventory/warehouses", "module": "inventory"},
            {"label": "Inventory Settings", "path": "/inventory/settings", "module": "inventory"},
        ],
    },
    {
        "key": "procurement",
        "label": "Purchases",
        "path": None,
        "module": "procurement",
        "children": [
            {"label": "Purchase", "path": "/purchases", "module": "procurement"},
            {"label": "Payments Made", "path": "/purchases/payments-made", "module": "procurement"},
            {"label": "Debit Note", "path": "/purchases/debit-notes", "module": "procurement"},
            {"label": "Purchase Order", "path": "/procurement/purchase-orders", "module": "procurement"},
        ],
    },
    {
        "key": "sales",
        "label": "Sales",
        "path": None,
        "module": "sales",
        "children": [
            {"label": "Invoices", "path": "/sales/invoices", "module": "sales"},
            {"label": "Quotations", "path": "/sales/quotations", "module": "sales"},
            {"label": "Payment Receipts", "path": "/sales/payment-receipts", "module": "sales"},
            {"label": "Refund Vouchers", "path": "/sales/refund-vouchers", "module": "sales"},
            {"label": "Proforma Invoice", "path": "/sales/proforma-invoices", "module": "sales"},
            {"label": "Export Invoice", "path": "/sales/export-invoices", "module": "sales"},
            {"label": "Export Proforma Invoice", "path": "/sales/export-proforma-invoices", "module": "sales"},
            {"label": "Delivery Challans", "path": "/sales/delivery-challans", "module": "sales"},
            {"label": "Credit Note", "path": "/sales/credit-notes", "module": "sales"},
            {"label": "e-Invoice", "path": "/sales/e-invoice", "module": "sales"},
            {"label": "Sales Debit Note", "path": "/sales/debit-notes", "module": "sales"},
            {"label": "E-Waybill Login", "path": "/ewaybill/login", "module": "sales"},
            {"label": "Digital Signature", "path": "/digital-signature", "module": "sales"},
        ],
    },
    {
        "key": "hr",
        "label": "HR",
        "path": None,
        "module": "hr",
        "children": [
            {"label": "HR Dashboard", "path": "/hr", "module": "hr"},
            {"label": "Employees", "path": "/hr/employees", "module": "hr"},
            {"label": "Attendance", "path": "/hr/attendance", "module": "attendance"},
            {"label": "Shifts", "path": "/hr/shifts", "module": "hr"},
            {"label": "Leave", "path": "/hr/leave", "module": "hr"},
            {"label": "Payroll", "path": "/hr/payroll", "module": "hr"},
            {"label": "Performance", "path": "/hr/performance", "module": "hr"},
            {"label": "Asset Management", "path": "/hr/assets", "module": "hr"},
            {"label": "Safety & Incidents", "path": "/hr/incidents", "module": "hr"},
            {"label": "HR Documents", "path": "/hr/documents", "module": "hr"},
        ],
    },
    {
        "key": "finance",
        "label": "Accounting",
        "path": None,
        "module": "accounts",
        "children": [
            {"label": "Ledger", "path": "/accounts/ledger", "module": "accounts"},
            {"label": "Expense", "path": "/accounts/expenses", "module": "accounts"},
            {"label": "Chart of Accounts", "path": "/accounts/chart-of-accounts", "module": "accounts"},
            {"label": "Manual Journal Entry", "path": "/accounts/journal-entries", "module": "accounts"},
            {"label": "Balance Sheet", "path": "/accounts/balance-sheet", "module": "accounts"},
            {"label": "Profit & Loss Report", "path": "/accounts/profit-loss", "module": "accounts"},
            {"label": "Accounting Reports", "path": "/accounts/reports", "module": "accounts"},
        ],
    },
    {
        "key": "quality",
        "label": "Quality",
        "path": None,
        "module": "quality",
        "children": [
            {"label": "Incoming Inspection", "path": "/quality/incoming", "module": "quality"},
            {"label": "In-Process QC", "path": "/quality/in-process", "module": "quality"},
            {"label": "Final QC", "path": "/quality/final", "module": "quality"},
            {"label": "Defect Tracking", "path": "/quality/defects", "module": "quality"},
        ],
    },
    {
        "key": "maintenance",
        "label": "Maintenance",
        "path": None,
        "module": "maintenance",
        "children": [
            {"label": "Preventive", "path": "/maintenance/preventive", "module": "maintenance"},
            {"label": "Breakdowns", "path": "/maintenance/breakdowns", "module": "maintenance"},
            {"label": "Machine History", "path": "/maintenance/machine-history", "module": "maintenance"},
        ],
    },
    {
        "key": "alerts",
        "label": "Alerts",
        "path": None,
        "module": "alerts",
        "children": [
            {"label": "All Alerts", "path": "/alerts", "module": "alerts"},
            {"label": "Low Stock", "path": "/alerts/low-stock", "module": "alerts"},
            {"label": "Machine / Equipment", "path": "/alerts/machine-failure", "module": "alerts"},
            {"label": "Production Delay", "path": "/alerts/production-delay", "module": "alerts"},
            {"label": "Maintenance", "path": "/alerts/maintenance", "module": "alerts"},
            {"label": "Quality", "path": "/alerts/quality", "module": "alerts"},
            {"label": "HR & Personnel", "path": "/alerts/hr", "module": "alerts"},
            {"label": "Safety & Incident", "path": "/alerts/safety", "module": "alerts"},
            {"label": "General", "path": "/alerts/general", "module": "alerts"},
        ],
    },
    {
        "key": "documents",
        "label": "Documents",
        "path": None,
        "module": "documents",
        "children": [
            {"label": "All Documents", "path": "/documents", "module": "documents"},
            {"label": "Purchase", "path": "/documents/purchase", "module": "documents"},
            {"label": "Production", "path": "/documents/production", "module": "documents"},
            {"label": "Quality", "path": "/documents/quality", "module": "documents"},
            {"label": "Reports", "path": "/documents/reports", "module": "documents"},
        ],
    },
    {
        "key": "analytics",
        "label": "Analytics",
        "path": None,
        "module": "analytics",
        "children": [
            {"label": "Production Analytics", "path": "/analytics/production", "module": "analytics"},
            {"label": "Inventory Analytics", "path": "/analytics/inventory", "module": "analytics"},
            {"label": "Sales Analytics", "path": "/analytics/sales", "module": "analytics"},
            {"label": "Finance Analytics", "path": "/analytics/finance", "module": "analytics"},
            {"label": "Executive Dashboard", "path": "/analytics/executive", "module": "analytics"},
        ],
    },
    {
        "key": "settings",
        "label": "Settings",
        "path": None,
        "module": "settings",
        "children": [
            {"label": "Change Template", "path": "/settings/change-template", "module": "settings"},
            {"label": "Invoice Template", "path": "/settings/invoice-template", "module": "settings"},
            {"label": "Quotation Template", "path": "/settings/quotation-template", "module": "settings"},
            {"label": "Purchase Template", "path": "/settings/purchase-template", "module": "settings"},
            {"label": "Change Format", "path": "/settings/change-format", "module": "settings"},
            {"label": "Invoice Settings", "path": "/settings/invoice-settings", "module": "settings"},
            {"label": "Expense Settings", "path": "/accounts/expenses/settings", "module": "accounts"},
            {"label": "Sector Settings", "path": "/settings/sector-settings", "module": "settings"},
            {"label": "Inventory Settings", "path": "/settings/inventory-settings", "module": "settings"},
            {"label": "Sequence Reset Setting", "path": "/settings/sequence-reset", "module": "settings"},
        ],
    },
    {
        "key": "admin",
        "label": "Administration",
        "path": None,
        "module": "admin",
        "children": [
            {"label": "Users", "path": "/admin/users", "module": "admin"},
            {"label": "Roles & Permissions", "path": "/admin/roles", "module": "admin"},
            {"label": "Access Logs", "path": "/admin/access-logs", "module": "admin"},
        ],
    },
]
