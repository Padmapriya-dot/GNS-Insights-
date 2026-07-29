# GNS Insights

**GNS Insights** is a full-stack business intelligence platform for manufacturing, combining analytics, AI, and operational reporting. It covers **Production Management**, **Inventory & Raw Material Management**, **Sales & Billing**, and **Accounts & Reports**.

## Branding & Assets

| Item | Location | Usage |
|------|----------|--------|
| **Product name** | — | **GNS Insights** (browser title, sidebar, login, landing, i18n) |
| **Tagline** | `frontend/src/locales/en.json` → `nav.tagline` | Business Intelligence • Analytics • AI |
| **Logo** | `frontend/public/logo.png` | Favicon + UI branding |
| **Auth hero image** | `frontend/public/auth/slide-1.png` | Login/Register slider + landing hero background |
| **Brand component** | `frontend/src/components/common/BrandLogo.jsx` | Reusable logo with `sm` / `md` / `lg` / `xl` / `hero` sizes |

### Where the logo appears

- **Landing page** — navigation bar, hero section, footer
- **Login & Register** — header above the form title
- **Sidebar** — app header (logo only when collapsed)
- **Loading screen** — shown while the app bootstraps (`main.jsx`)
- **Browser tab** — favicon via `<link rel="icon" href="/logo.png">` in `index.html`

### Auth slider images

The sign-in / sign-up right panel (`AuthSlider.jsx`) rotates background slides:

| File | Slide | Fallback |
|------|-------|----------|
| `frontend/public/auth/slide-1.png` | GNS Insights (installed) | — |
| `frontend/public/auth/slide-2.png` | Analytics | Themed gradient if missing |
| `frontend/public/auth/slide-3.png` | Inventory | Themed gradient if missing |

### Replace the logo

1. Save your image as `frontend/public/logo.png` (PNG recommended; keep a wide aspect ratio).
2. Refresh the app — `BrandLogo` loads from `/logo.png` with no code changes.

**Note:** Demo tenant emails (`@smrt.local`) are sample data, not the product brand.

To add or replace slides, drop PNG/JPG files into `frontend/public/auth/` using the names above. See `frontend/public/auth/README.txt` for copy commands.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **Frontend:** React 18, Vite, React Router, Axios, Tailwind CSS, React i18next

### Frontend performance

- **Route-level code splitting** – Each page is loaded on demand (`lazyPages.jsx` + `React.lazy`), so the initial JS bundle stays small (~77 KB gzip for the main entry vs. a single 500+ KB chunk before).
- **Localized Suspense** – While a chunk loads, a **light inline fallback** (`RouteFallback`) appears in the main area only; the sidebar/nav stay mounted so navigation doesn’t feel like a full reload.
- **Vendor chunking** – `vite.config.js` splits **recharts**, **react-vendor**, **i18n**, **axios**, and **export-libs** (xlsx/jspdf) so the browser can cache them and load them in parallel only when needed.
- **Dashboard** – Chart code lives in the `recharts` chunk and is fetched only when the user opens the dashboard.

## Features

### Production Management
- Production planning (orders, scheduling)
- Work orders
- Batch tracking
- Machine status monitoring
- Daily production reports

### Inventory & Raw Material Management
- Raw material tracking
- **Materials Master** (`/masters/products`) — categories (including Packaging Material, Utility / Raw Material), units (incl. Litre), warehouses, stock levels
- **Warehouse Management** (`/inventory`, `/inventory/warehouses`) — enterprise dashboard (KPIs, charts, activity timeline, quick actions), searchable warehouse list with filters/export/bulk actions, detail modal with stock status colors (Healthy / Low / Out), location cards (zone → bin), GRN / issue / transfer / pick-pack workflow strips
- Low stock alerts
- Barcode support (scan or manual lookup)
- Warehouse management
- Supplier tracking
- Stock movements (in/out/adjustment)

### Procurement & Vendor Master
- Purchase orders, material requests, goods receipt (GRN), supplier payments
- **Enterprise Vendor Master** (`/procurement/vendors`) built on the existing `suppliers` table
  - Company Name, Contact Person, GST, PAN, address (PIN auto-fill), bank & procurement terms
  - Auto vendor codes (`VEN-0001` style), soft delete, bulk activate/deactivate
  - List KPIs, filters, Excel/PDF export; detail tabs (Overview, Purchase History, Products, Payments, Documents, Performance, Audit)
  - **Bank verification:** Account Number + IFSC validated via lookup API; Bank Name and Branch auto-filled; Account Holder Name auto-filled from Contact Person (editable)
- Roles with vendor access/write: Admin, Purchase Manager, Procurement Manager, Store Manager

### HR & Employee Management
- Worker attendance (clock in/out)
- Shift management
- Payroll
- Overtime calculation
- Performance tracking

### Sales & Billing Module
- Sales orders (with invoiced / packed / shipped status)
- GST billing (SGST, CGST, IGST)
- Invoice generation (Tax Invoice form)
- Payment tracking
- Customer management

### Accounts & Reports
- Accounts dashboard (invoice analytics, overdue tracking, settlement metrics)
- Profit & Loss (Revenue vs Cost/Expense by month)
- Expense tracking
- Tax reports (GST summary)
- Export to Excel / PDF

### Quality Control
- Quality inspection
- Defect tracking
- Batch quality reports
- Compliance logs

### Maintenance
- Machine maintenance
- Preventive maintenance
- Breakdown reports
- Maintenance schedule

### Analytics
- Production analytics
- Machine efficiency
- Inventory analytics
- Profit analysis

### Alerts & Notifications
- Low stock alerts
- Machine failure alerts
- Production delay alerts
- Maintenance reminders

### Notification Management (In-App Bell)
- Notification bell in the top navigation bar with live unread badge
- Per-user notifications stored in SQLite (`erp_notifications`)
- Types: Information, Success, Warning, Error, Production, Inventory, Quality, Maintenance, Sales, HR, Finance, System
- Priorities: Low, Medium, High, Critical
- Actions: open (auto mark-read), mark as read, mark all as read, delete, clear all (with confirmation)
- Optimistic UI updates — badge decrements instantly (e.g. 5 → 4 → 0) without page refresh
- Paginated notification list with infinite scroll in the dropdown
- Demo notifications seeded for each user on first backend start

### Multi-Language Support
- **Languages:** English, Hindi (हिन्दी), Tamil (தமிழ்), Telugu (తెలుగు)
- Language selector in top navigation bar
- Full UI translation (sidebar, pages, buttons, labels, messages)
- Selection persisted in localStorage across page refresh

## User Flows (High-Level)

All flows follow the pattern: **Select → Enter → Save → View**. Tasks complete in **3 steps max**.

### 1. Overall GNS Insights Flow
Login → Dashboard → Choose Module → Perform Action → Save Data → View Reports

### 2. Production Management
Dashboard → Production Module → **Create Work Order** (3 fields: Product, Quantity, Machine) → Assign Machine → Start Production → Track Status → Complete Production → Move to Inventory

- **Quick Create Work Order:** Dashboard → Click "Create Work Order" → Fill 3 fields → Save → Done ✅

### 3. Inventory
Purchase Raw Material → Add to Materials Master / Inventory → Use in Production → Update Stock → Low Stock Alert → Reorder

### 3b. Vendor Master (Procurement)
Vendors → Add Vendor → Fill Company & Contact → Enter Account Number + IFSC (auto-verify bank) → Save → View Vendor Detail / Create PO

### 4. Sales
Create Customer → Create Sales Order → Generate Invoice → Dispatch Product → Receive Payment

### 5. HR (Employee)
Add Employee → Assign Role → Track Attendance → Calculate Payroll → Generate Salary Report

### 6. Machine Monitoring
Add Machine → Track Status → Detect Issue → Create Maintenance Task → Fix Machine → Update Status

### 7. Reports & Analytics
Dashboard → Select Report → Apply Filters → View Data → Export (PDF/Excel)

### 8. User / Admin
Login → Admin Panel → Create User → Assign Role → Set Permissions

## Project Structure

```
GNS Insights/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration, DB init
│   │   ├── core/                # Config, database, seed_tenant, seed_roles, seed_users, seed_products
│   │   ├── models/              # SQLAlchemy: user, tenant, role, production, inventory, erp_notification, …
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── repositories/        # Data access layer (e.g. notification_repository)
│   │   ├── services/            # Business logic layer
│   │   ├── routers/             # /api/notifications, /api/dashboard, /api/production, …
│   │   └── api/                 # Legacy module routers: auth, sales, inventory, alerts, …
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── public/
│   │   ├── logo.png             # GNS Insights product logo (favicon + UI)
│   │   └── auth/
│   │       ├── slide-1.png      # Auth slider / landing hero background
│   │       ├── slide-2.png      # Optional (gradient fallback if missing)
│   │       └── slide-3.png      # Optional (gradient fallback if missing)
│   ├── src/
│   │   ├── api/                 # axiosConfig, notificationService, productionApi, salesApi, …
│   │   ├── components/          # layout (Navbar, Sidebar), notifications, common (BrandLogo, ConfirmationDialog, …)
│   │   ├── context/             # AuthContext, ToastContext, SettingsContext
│   │   ├── hooks/               # useAuth, useNotifications
│   │   ├── pages/               # auth, dashboard, production, inventory, procurement, sales, accounts, hr, quality, maintenance, analytics, alerts, admin, documents, settings
│   │   └── routes/              # AppRoutes, lazyPages (code-split)
│   ├── package.json
│   └── .env
│
└── README.md
```

### Backend Code Map

| Module | API (`app/api/`) | Service (`app/services/`) | Models |
|--------|------------------|---------------------------|--------|
| Auth | auth.py | auth_service.py | user, tenant, role |
| Production | production.py | production_service.py | production, product, machine |
| Inventory | inventory.py | inventory_service.py | inventory (Warehouse, Supplier/Vendor, Item, StockLevel, StockMovement) |
| Procurement | procurement.py | procurement_service.py, vendor_service.py, bank_lookup_service.py | procurement (PurchaseOrder, MaterialRequest, GoodsReceipt, SupplierPayment); VendorProduct; Supplier enterprise fields |
| Sales | sales.py | sales_service.py | sales (Customer, SalesOrder, Invoice, Payment) |
| Accounts | accounts.py | accounts_service.py | accounts (Income, Expense) |
| HR | hr.py | hr_service.py | hr (Employee, Shift, Attendance, Payroll, Performance) |
| Analytics | analytics.py | analytics_service.py | aggregates from other modules |
| Quality | quality.py | quality_service.py | quality (Inspection, Defect, BatchReport, Compliance) |
| Maintenance | maintenance.py | maintenance_service.py | maintenance (Record, Preventive, Breakdown, Schedule) |
| Alerts | alerts.py | alert_service.py | alert |
| Notifications | routers/notifications_api.py | notification_management_service.py | erp_notification |
| Admin | admin.py | admin_service.py | admin (AccessLog) |
| Documents | documents.py | document_service.py | document |

### Frontend Code Map

| Area | Pages | API Client |
|------|-------|------------|
| Auth | Login, Register | authApi, `BrandLogo`, `AuthSlider` |
| Dashboard | Dashboard (KPIs, charts) | productionApi, inventoryApi, hrApi, analyticsApi, accountsApi |
| Production | Planning, WorkOrders, BatchTracking, MachineStatus, DailyReports, CreateProduction, CreateMachine | productionApi |
| Inventory | Dashboard, InventoryList, Warehouses, StockMovement, CreateItem/Warehouse | inventoryApi |
| Masters | ProductsMaster, CreateProduct (Materials), BomMaster, DepartmentManagement | productsApi |
| Procurement | VendorManagement, CreateVendor, VendorDetail, PurchaseOrders, MaterialRequests, GoodsReceipt, SupplierPayments | procurementApi |
| Sales | InvoiceDashboard, TaxInvoiceForm, SalesOrders, Customers, PaymentTracking + create pages | salesApi |
| Accounts | Dashboard, ProfitLoss, ExpenseTracking, TaxReports, RecordIncome, RecordExpense | accountsApi |
| HR | HRDashboard, Attendance, Shifts, Payroll, Performance, Employees + create pages | hrApi |
| Quality, Maintenance, Analytics, Alerts | Inspection, Defects, BatchReports, Compliance; MachineMaintenance, Preventive, Breakdowns, Schedule; Production/Machine/Inventory/Profit analytics; AllAlerts, LowStock, etc. | quality/maintenance/analytics/alert APIs |
| Admin, Documents, Settings | UserManagement, RolesPermissions, AccessLogs; Purchase/Production/Quality/Reports docs; Settings sub-pages | adminApi, document APIs |
| Notifications (navbar bell) | NotificationBell, NotificationDropdown, NotificationItem | notificationService |

## Notification Management System

Enterprise in-app notifications for authenticated users. Each user sees only their own notifications (scoped by `tenant_id` + `user_id`).

### Architecture

```
React (NotificationBell) → notificationService.js → FastAPI Router → Service → Repository → SQLite
```

| Layer | Location |
|-------|----------|
| Model | `backend/app/models/erp_notification.py` |
| Repository | `backend/app/repositories/notification_repository.py` |
| Service | `backend/app/services/notification_management_service.py` |
| API | `backend/app/routers/notifications_api.py` |
| Seed | `backend/app/core/seed_notifications.py` |
| Frontend API | `frontend/src/api/notificationService.js` |
| Hook | `frontend/src/hooks/useNotifications.js` |
| Components | `frontend/src/components/notifications/` |

### Database (`erp_notifications`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | Primary key |
| `tenant_id` | integer | FK → tenants |
| `user_id` | integer | FK → users (recipient) |
| `title` | string | Notification title |
| `message` | text | Body text |
| `type` | string | information, success, warning, error, production, inventory, quality, maintenance, sales, hr, finance, system |
| `priority` | string | low, medium, high, critical |
| `module` | string | ERP module source |
| `action_url` | string | Optional deep-link (e.g. `/production/work-orders`) |
| `is_read` | boolean | Read status |
| `created_by` | string | Display name of creator |
| `created_at` | datetime | Auto-set |
| `updated_at` | datetime | Auto-set |

**Indexes:** `user_id`, `is_read`, `created_at`

### API Endpoints

All endpoints require JWT (`Authorization: Bearer <token>`).

Every response uses the standard envelope:

```json
{
  "success": true,
  "message": "",
  "data": {},
  "errors": null,
  "timestamp": "2026-07-12T08:53:00+00:00"
}
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Paginated list (`page`, `page_size`) |
| `GET` | `/api/notifications/unread-count` | Unread count only |
| `PUT` | `/api/notifications/{id}/read` | Mark one notification as read |
| `PUT` | `/api/notifications/read-all` | Mark all unread as read |
| `DELETE` | `/api/notifications/{id}` | Delete one notification |
| `DELETE` | `/api/notifications/clear` | Delete all notifications for the current user |

**Business rules**
- Unread count is always derived from `is_read = false` rows for the logged-in user.
- Opening a notification automatically marks it as read (badge decrements immediately).
- Marking an already-read notification again does not change the count.
- Clear/delete operations affect only the current user's notifications.

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `NotificationBell` | Bell icon + badge in navbar; wires dropdown and actions |
| `NotificationBadge` | Unread count badge (caps at `9+`) |
| `NotificationDropdown` | Scrollable list, mark-all, clear-all, load-more |
| `NotificationItem` | Single row with type/priority styling, read vs unread |
| `ConfirmationDialog` | Reusable confirm modal (used for clear-all) |

### Try It

1. Start backend and frontend (see Setup below).
2. Register a tenant admin and log in with your own company email.
3. Click the bell icon in the top bar — demo notifications are created for local testing.
4. Open notifications one by one; the badge count drops instantly (5 → 4 → … → 0).
5. Use **Mark all read**, **Clear** (confirmation dialog), or per-item delete/mark-read actions.

## Settings API (Users, Roles, Permissions, Audit Logs)

Backend support for the **Settings** sidebar pages. Requires JWT and **Admin** role.

### Architecture

```
React (Settings pages) → /admin/* or /api/settings/* → SettingsService → rbac_service → SQLite
```

| Layer | File |
|-------|------|
| Service | `backend/app/services/settings_service.py` |
| RBAC logic | `backend/app/services/rbac_service.py` |
| Legacy router | `backend/app/api/admin.py` → `/admin/*` (flat JSON) |
| Enterprise router | `backend/app/routers/settings_api.py` → `/api/settings/*` (envelope) |

### Endpoints

**Users** (`/admin/users` or `/api/settings/users`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List all users with roles |
| GET | `/users/stats` | Total, active, administrator counts |
| GET | `/users/{id}` | Single user |
| POST | `/users` | Create user |
| PUT | `/users/{id}` | Update user |
| DELETE | `/users/{id}` | Delete user |

**Roles** (`/admin/roles` or `/api/settings/roles`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/roles` | List roles with permission summary & user count |
| GET | `/roles/{id}` | Single role |
| POST | `/roles` | Create role |
| PUT | `/roles/{id}` | Update role name, description, permissions |
| PUT | `/roles/{id}/permissions` | Update permissions only (`/admin` only) |
| DELETE | `/roles/{id}` | Delete role |

**Permissions** (`/admin/permissions/*` or `/api/settings/permissions/*`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/permissions/modules` | Module catalogue for checkboxes |
| GET | `/permissions/matrix` | Default role → module matrix |
| GET | `/permissions` | All roles with permissions (`/api/settings` only) |
| PUT | `/permissions/{role_id}` | Update role permissions (`/api/settings` only) |

**Audit Logs** (`/admin/access-logs` or `/api/settings/audit-logs`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/access-logs` | Activity list (flat array, legacy) |
| GET | `/audit-logs` | Paginated logs with `search`, `page`, `page_size` |

Login events are recorded automatically via `POST /auth/login`.

### User Accounts

The application uses registration and tenant-based user management. There are no default seeded users with production credentials.

## Prerequisites

- Python 3.10+
- Node.js 18+

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` (optional):

```env
DATABASE_URL=sqlite:///./smrt.db
```

No extra database server is required. The SQLite file `backend/smrt.db` is created automatically on first backend start.

### DB Browser for SQLite

- **File location:** `backend/smrt.db` (relative to the backend folder when you run uvicorn from `backend/`)
- **Open the database:** Use [DB Browser for SQLite](https://sqlitebrowser.org/) to inspect tables and data
- **Important:** Stop the backend before opening the file in DB Browser — SQLite uses file locking while the app is running
- The first administrative user is created through `POST /auth/register`.

Run the backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs (title: **GNS Insights API**)

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Run the frontend:

```bash
npm run dev
```

App: http://localhost:5173 (title: **GNS Insights**)

### Docker (optional)

```bash
docker compose up --build
```

| Service | URL | Notes |
|---------|-----|--------|
| Frontend | http://localhost:8080 | Nginx serves the built app + proxies API routes |
| Backend | http://localhost:8000 | SQLite persisted in Docker volume `smrt_data` |

The frontend image is built with `VITE_API_BASE_URL=""` so API calls use same-origin routing through nginx.

## Auth API (Login & Registration)

Base URL: `http://localhost:8000` (or your `VITE_API_BASE_URL`).

### POST `/auth/login`

**Request (JSON):**

| Field      | Type   | Required |
|-----------|--------|----------|
| `email`   | string | Yes      |
| `password`| string | Yes      |

**Response (200):**

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Admin User",
    "tenant_id": 1,
    "tenant_name": "Company Name",
    "role": "Admin"
  }
}
```

**Errors:** `401` — Invalid email or password.

### POST `/auth/register`

**Request (JSON):**

| Field           | Type   | Required | Notes        |
|----------------|--------|----------|--------------|
| `company_name` | string | Yes      | New tenant   |
| `full_name`    | string | Yes      |              |
| `email`        | string | Yes      | Valid email  |
| `password`     | string | Yes      | Min 6 chars  |

**Response (200):** Same shape as login — returns JWT and user (role `Admin` for the new tenant).

**Errors:** `409` — Email already registered.

### Frontend

- **Login** (`/login`): Calls `POST /auth/login`, stores `access_token` in `localStorage` as `smrt-token`, persists user in `smrt-user`. Axios sends `Authorization: Bearer <token>` on subsequent requests.
- **Register** (`/register`): Calls `POST /auth/register`, then same as login.

Optional `backend/.env`:

```env
JWT_SECRET_KEY=your-long-random-secret
```

## Usage

1. **Login:** API login with your registered company email and password.
2. **Language:** Click the Language button (🌐) in the top bar to switch between English, Hindi, Tamil, or Telugu.
3. **Notifications:** Click the bell icon (🔔) in the top bar to view in-app notifications. Unread items are highlighted; opening one marks it read and updates the badge without refreshing the page.
4. **Dashboard:** View production, inventory, HR, and machine status summaries.
5. **Production:** Create production orders, work orders, machines; track batches and daily reports. Tables support search, sorting, pagination.
6. **Inventory / Materials:** Add warehouses, manage Materials Master, create items, record stock movements.
7. **Procurement / Vendors:** Manage Vendor Master (company, bank verify, documents), purchase orders, material requests, GRN, supplier payments.
8. **Sales:** Manage invoices, sales orders, customers, and payments.
9. **Accounts:** View analytics dashboard, Profit & Loss, expense tracking, tax reports; export to Excel/PDF.
10. **Settings:** Configure theme (light/dark), language, date format, currency, company profile.

## API Overview

| Prefix | Endpoints |
|--------|-----------|
| `/auth/` | `POST /login`, `POST /register` (JWT bearer) |
| `/production/` | products, orders, work-orders, batches, machines, machine-status, daily-reports |
| `/inventory/` | warehouses, suppliers, items, items/barcode/{barcode}, dashboard, stock-levels, stock-movements |
| `/procurement/` | purchase-orders, **vendors** (list, create, detail, update, soft-delete, bulk-status, summary, export, purchase-history, products), **vendors/bank-lookup**, material-requests, goods-receipt, supplier-payments |
| `/hr/` | dashboard, employees, shifts, attendance (clock-in, clock-out), payroll, performance |
| `/sales/` | customers, sales-orders, invoices, invoices/{id}, payments |
| `/accounts/` | dashboard, profit-loss, tax-report, income, expenses |
| `/analytics/` | production-trend, machine-efficiency, inventory-turnover, worker-performance, profit, dashboard |
| `/quality/` | inspection, defects, batch-reports, compliance |
| `/maintenance/` | records, preventive, breakdowns, schedule |
| `/alerts/` | list, create, acknowledge |
| `/api/notifications` | list, unread-count, mark read, mark all read, delete, clear (JWT) |
| `/admin/` | users, users/stats, roles, permissions/modules, access-logs (Admin JWT) |
| `/api/settings/` | users, roles, permissions, audit-logs (Admin JWT, envelope) |
| `/documents/` | list, create |

All list endpoints accept `tenant_id` as a query parameter (default: 1 for demo). Full docs: http://localhost:8000/docs

---

## Future Upgrades (Roadmap)

| Feature | Description |
|---------|-------------|
| **IoT Machine Integration** | Real-time machine data feeds, sensor connectivity, OEE metrics |
| **AI Production Prediction** | Demand forecasting, production optimization, anomaly detection |
| **Mobile App (React Native)** | Native mobile app for on-floor data entry, approvals, and notifications |

---

## License

Private / Internal Use
