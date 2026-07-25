import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  FileText,
  Plus,
  Printer,
  RefreshCw,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  Wallet,
} from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import CustomerDetailModal, { CustomerFormModal } from "../../components/sales/CustomerDetailModal";
import { useToast } from "../../context/ToastContext";
import useTenantId from "../../hooks/useTenantId";
import { getCustomers, createCustomer } from "../../api/salesApi";
import {
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  DEMO_CUSTOMERS,
  IMPORT_TEMPLATE_HEADERS,
  INDIAN_STATES,
  REPORT_TYPES,
  SALES_EXECUTIVES,
  WORKFLOW_STEPS,
  computeCustomerSummary,
  enrichApiCustomer,
} from "../../data/customersMasterData";
import { exportToExcel, exportToPdf } from "../../utils/exportUtils";

function SummaryCard({ label, value, icon: Icon, color, format }) {
  const display = format === "currency" ? `₹${Number(value || 0).toLocaleString("en-IN")}` : value;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 truncate text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{display}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const active = status === "active";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
      active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
    }`}>
      {status}
    </span>
  );
}

const defaultFilters = {
  customer_code: "",
  company: "",
  contact: "",
  gstin: "",
  state: "",
  city: "",
  status: "",
  customer_type: "",
  sales_executive: "",
  date_from: "",
  date_to: "",
};

export default function Customers() {
  const { addToast } = useToast();
  const tenantId = useTenantId();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [formCustomer, setFormCustomer] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);

  const getCustomerKey = (item) =>
    String(item.company || item.name || item.customer_name || item.customer_code || item.id || "")
      .trim()
      .toLowerCase();

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers().catch(() => null);
      const apiRows = res?.data || [];
      const stored = localStorage.getItem("smrt_customers");
      const localRows = stored ? JSON.parse(stored) : [];
      const deletedStored = localStorage.getItem("smrt_deleted_customers");
      const deletedIds = (deletedStored ? JSON.parse(deletedStored) : []).map((d) => String(d).trim().toLowerCase());

      const map = new Map();
      // 1. API customer rows
      apiRows.forEach((row, i) => {
        const enriched = enrichApiCustomer(row, i);
        const key = getCustomerKey(enriched);
        if (key) map.set(key, enriched);
      });

      // 2. Persistent local customer rows (overwrites API row if same company/code to avoid duplicates)
      localRows.forEach((row, i) => {
        const enriched = enrichApiCustomer(row, i);
        const key = getCustomerKey(enriched);
        if (key) map.set(key, enriched);
      });

      // 3. Filter out deleted customer IDs / company names
      const finalCustomers = Array.from(map.values()).filter((c) => {
        const key = getCustomerKey(c);
        const codeKey = String(c.customer_code || "").trim().toLowerCase();
        const idKey = String(c.id || "").trim().toLowerCase();
        return !deletedIds.includes(key) && !deletedIds.includes(codeKey) && !deletedIds.includes(idKey);
      });

      setCustomers(finalCustomers);
    } catch {
      const stored = localStorage.getItem("smrt_customers");
      const localRows = stored ? JSON.parse(stored) : [];
      const deletedStored = localStorage.getItem("smrt_deleted_customers");
      const deletedIds = (deletedStored ? JSON.parse(deletedStored) : []).map((d) => String(d).trim().toLowerCase());
      
      const map = new Map();
      localRows.forEach((row, i) => {
        const enriched = enrichApiCustomer(row, i);
        const key = getCustomerKey(enriched);
        if (key) map.set(key, enriched);
      });

      const finalCustomers = Array.from(map.values()).filter((c) => {
        const key = getCustomerKey(c);
        const codeKey = String(c.customer_code || "").trim().toLowerCase();
        const idKey = String(c.id || "").trim().toLowerCase();
        return !deletedIds.includes(key) && !deletedIds.includes(codeKey) && !deletedIds.includes(idKey);
      });
      setCustomers(finalCustomers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (filters.customer_code && !c.customer_code.toLowerCase().includes(filters.customer_code.toLowerCase())) return false;
      if (filters.company && !c.company.toLowerCase().includes(filters.company.toLowerCase())) return false;
      if (filters.contact && !c.contact_person.toLowerCase().includes(filters.contact.toLowerCase())) return false;
      if (filters.gstin && !String(c.gstin).toLowerCase().includes(filters.gstin.toLowerCase())) return false;
      if (filters.state && c.state !== filters.state) return false;
      if (filters.city && !c.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.customer_type && c.customer_type !== filters.customer_type) return false;
      if (filters.sales_executive && c.sales_executive !== filters.sales_executive) return false;
      if (filters.date_from && c.created_at && c.created_at < filters.date_from) return false;
      if (filters.date_to && c.created_at && c.created_at > filters.date_to) return false;
      return true;
    });
  }, [customers, filters]);

  const summary = useMemo(() => computeCustomerSummary(filteredCustomers), [filteredCustomers]);

  const cities = useMemo(() => [...new Set(customers.map((c) => c.city).filter(Boolean))], [customers]);

  const exportColumns = [
    { key: "customer_code", label: "Customer Code" },
    { key: "company", label: "Company" },
    { key: "contact_person", label: "Contact Person" },
    { key: "customer_type", label: "Customer Type" },
    { key: "sales_executive", label: "Sales Executive" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "gstin", label: "GSTIN" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "credit_limit", label: "Credit Limit" },
    { key: "outstanding", label: "Outstanding" },
    { key: "status", label: "Status" },
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredCustomers, exportColumns, "customers");
    addToast("Exported to Excel");
  };

  const handleExportPdf = () => {
    exportToPdf(filteredCustomers, exportColumns, "Customer Master", "customers");
    addToast("Exported to PDF");
  };

  const handlePrint = () => {
    handleExportPdf();
  };

  const handleDownloadTemplate = () => {
    const header = IMPORT_TEMPLATE_HEADERS.join(",");
    const blob = new Blob([`${header}\nCUS006,Sample Corp,John Doe,+919999999999,john@sample.com,36AABCS1234A1Z1,Hyderabad,Telangana,500000,active`], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "customers_import_template.csv";
    a.click();
    addToast("Template downloaded");
  };

  const handleImport = () => {
    handleDownloadTemplate();
    addToast("Use template for import — full CSV import coming soon", "info");
  };

  const handleSave = async (form) => {
    const payload = {
      tenant_id: tenantId,
      name: form.company,
      contact_name: form.contact_person,
      phone: form.phone,
      email: form.email,
      gstin: form.gstin,
      state: form.state,
      address_line1: form.billing_address,
    };
    try {
      if (!formCustomer?.id || typeof formCustomer.id !== "number") {
        await createCustomer(payload).catch(() => null);
      }
    } catch {
      /* fall through to local */
    }

    const cusCode = form.customer_code?.trim() || `CUS${String(customers.length + 1).padStart(3, "0")}`;
    const targetId = formCustomer?.id || `cus-${Date.now()}`;
    const newCustomer = enrichApiCustomer({
      ...formCustomer,
      ...form,
      id: targetId,
      customer_code: cusCode,
      company: form.company,
      name: form.company,
      contact_person: form.contact_person,
      customer_type: form.customer_type,
      sales_executive: form.sales_executive,
      phone: form.phone,
      email: form.email,
      gstin: form.gstin,
      city: form.city,
      state: form.state,
      billing_address: form.billing_address,
      credit_limit: form.credit_limit != null && form.credit_limit !== "" ? Number(form.credit_limit) : 500000,
      outstanding: form.outstanding != null && form.outstanding !== "" ? Number(form.outstanding) : 0,
      status: form.status || "active",
      created_at: formCustomer?.created_at || new Date().toISOString().slice(0, 10),
    });

    const stored = localStorage.getItem("smrt_customers");
    const localRows = stored ? JSON.parse(stored) : [];
    const map = new Map();
    localRows.forEach((item) => {
      const k = getCustomerKey(item);
      if (k) map.set(k, item);
    });
    map.set(getCustomerKey(newCustomer), newCustomer);
    const updatedLocal = Array.from(map.values());
    localStorage.setItem("smrt_customers", JSON.stringify(updatedLocal));

    setCustomers((prev) => {
      const pMap = new Map();
      prev.forEach((item) => {
        const k = getCustomerKey(item);
        if (k) pMap.set(k, item);
      });
      pMap.set(getCustomerKey(newCustomer), newCustomer);
      return Array.from(pMap.values());
    });

    addToast(formCustomer?.id ? "Customer updated successfully" : "Customer created successfully");
    setFormCustomer(null);
  };

  const handleDelete = (customer) => {
    if (!window.confirm(`Delete ${customer.company}?`)) return;
    const targetKey = getCustomerKey(customer);
    const codeKey = String(customer.customer_code || "").trim().toLowerCase();
    const idKey = String(customer.id || "").trim().toLowerCase();

    // Save to persistent deleted tracker
    const deletedStored = localStorage.getItem("smrt_deleted_customers");
    const deletedIds = deletedStored ? JSON.parse(deletedStored) : [];
    [targetKey, codeKey, idKey].forEach((keyStr) => {
      if (keyStr && !deletedIds.includes(keyStr)) {
        deletedIds.push(keyStr);
      }
    });
    localStorage.setItem("smrt_deleted_customers", JSON.stringify(deletedIds));

    // Remove from smrt_customers
    const stored = localStorage.getItem("smrt_customers");
    if (stored) {
      const localRows = JSON.parse(stored);
      const updatedLocal = localRows.filter((c) => {
        const k = getCustomerKey(c);
        const cCode = String(c.customer_code || "").trim().toLowerCase();
        const cId = String(c.id || "").trim().toLowerCase();
        return k !== targetKey && cCode !== codeKey && cId !== idKey;
      });
      localStorage.setItem("smrt_customers", JSON.stringify(updatedLocal));
    }

    setCustomers((prev) =>
      prev.filter((c) => {
        const k = getCustomerKey(c);
        const cCode = String(c.customer_code || "").trim().toLowerCase();
        const cId = String(c.id || "").trim().toLowerCase();
        return k !== targetKey && cCode !== codeKey && cId !== idKey;
      })
    );
    setSelected(null);
    addToast("Customer deleted");
  };

  const columns = [
    { key: "customer_code", label: "Customer Code" },
    { key: "company", label: "Company" },
    { key: "contact_person", label: "Contact Person" },
    { key: "customer_type", label: "Customer Type" },
    { key: "sales_executive", label: "Sales Executive" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "gstin", label: "GSTIN" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    {
      key: "credit_limit",
      label: "Credit Limit",
      render: (r) => `₹${Number(r.credit_limit || 0).toLocaleString("en-IN")}`,
    },
    {
      key: "outstanding",
      label: "Outstanding",
      render: (r) => `₹${Number(r.outstanding || 0).toLocaleString("en-IN")}`,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (r) => (
        <div className="flex flex-wrap gap-1 text-xs">
          <button type="button" onClick={() => setSelected(r)} className="font-semibold text-[#2563EB] hover:underline">View</button>
          <button type="button" onClick={() => setFormCustomer(r)} className="font-semibold text-slate-600 hover:underline">Edit</button>
          <button type="button" onClick={() => handleDelete(r)} className="font-semibold text-red-600 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  const handleGenerateReport = (reportType, format = "pdf") => {
    let reportData = [...filteredCustomers];
    let cols = exportColumns;

    if (reportType === "Customer Ledger" || reportType === "Payment Report") {
      cols = [
        { key: "customer_code", label: "Customer Code" },
        { key: "company", label: "Company" },
        { key: "contact_person", label: "Contact Person" },
        { key: "sales_executive", label: "Sales Executive" },
        { key: "credit_limit", label: "Credit Limit" },
        { key: "outstanding", label: "Outstanding Balance" },
        { key: "last_payment", label: "Last Payment Date" },
        { key: "status", label: "Status" },
      ];
    } else if (reportType === "Customer Aging Report" || reportType === "Outstanding Report") {
      reportData = filteredCustomers.filter((c) => (c.outstanding || 0) > 0);
      if (reportData.length === 0) reportData = filteredCustomers;
      cols = [
        { key: "customer_code", label: "Customer Code" },
        { key: "company", label: "Company" },
        { key: "contact_person", label: "Contact Person" },
        { key: "phone", label: "Phone" },
        { key: "gstin", label: "GSTIN" },
        { key: "credit_limit", label: "Credit Limit" },
        { key: "outstanding", label: "Outstanding Amount" },
        { key: "sales_executive", label: "Sales Executive" },
      ];
    } else if (reportType === "Sales Report") {
      cols = [
        { key: "customer_code", label: "Customer Code" },
        { key: "company", label: "Company" },
        { key: "customer_type", label: "Customer Type" },
        { key: "total_orders", label: "Total Orders" },
        { key: "total_sales", label: "Total Sales Value" },
        { key: "last_order", label: "Last Order Date" },
        { key: "sales_executive", label: "Sales Executive" },
      ];
    }

    const filename = reportType.toLowerCase().replace(/\s+/g, "_");
    if (format === "excel") {
      exportToExcel(reportData, cols, filename);
      addToast(`Downloaded Excel ${reportType}`);
    } else {
      exportToPdf(reportData, cols, reportType, filename);
      addToast(`Generated & Downloaded PDF ${reportType}`);
    }
  };

  if (loading) return <Loader label="Loading customers..." />;

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customers, credit limits, outstanding balances, and sales relationships.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setFormCustomer({})} className="ui-btn-primary">
            <Plus className="h-4 w-4" /> New Customer
          </button>
          <button type="button" onClick={handleImport} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Upload className="h-4 w-4" /> Import Customers
          </button>
          <button type="button" onClick={handleExportExcel} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export Excel
          </button>
          <button type="button" onClick={handleExportPdf} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <FileText className="h-4 w-4" /> Export PDF
          </button>
          <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button type="button" onClick={loadCustomers} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total Customers" value={summary.total} icon={Users} color="bg-[#2563EB]" />
        <SummaryCard label="Active Customers" value={summary.active} icon={UserCheck} color="bg-green-500" />
        <SummaryCard label="Inactive Customers" value={summary.inactive} icon={UserX} color="bg-slate-500" />
        <SummaryCard label="New Customers (This Month)" value={summary.newThisMonth} icon={UserPlus} color="bg-purple-500" />
        <SummaryCard label="Pending Payments" value={summary.pendingPayments} icon={AlertCircle} color="bg-orange-500" />
        <SummaryCard label="Outstanding Amount" value={summary.outstandingAmount} icon={Wallet} color="bg-red-500" format="currency" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <input type="search" placeholder="Search Customer" value={filters.customer_code} onChange={(e) => setFilters((f) => ({ ...f, customer_code: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input placeholder="Company Name" value={filters.company} onChange={(e) => setFilters((f) => ({ ...f, company: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input placeholder="Contact Person" value={filters.contact} onChange={(e) => setFilters((f) => ({ ...f, contact: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input placeholder="GSTIN" value={filters.gstin} onChange={(e) => setFilters((f) => ({ ...f, gstin: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <select value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">State</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">City</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Status</option>
            {CUSTOMER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.customer_type} onChange={(e) => setFilters((f) => ({ ...f, customer_type: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Customer Type</option>
            {CUSTOMER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.sales_executive} onChange={(e) => setFilters((f) => ({ ...f, sales_executive: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Sales Executive</option>
            {SALES_EXECUTIVES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <input type="date" value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" title="From date" />
          <input type="date" value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" title="To date" />
          <button type="button" onClick={() => setFilters(defaultFilters)} className="text-sm font-semibold text-[#2563EB] hover:underline">
            Reset Filters
          </button>
        </div>

        <DataTable
          columns={columns}
          data={filteredCustomers}
          searchPlaceholder="Search Customer"
          searchKeys={["customer_code", "company", "contact_person", "email", "phone", "gstin", "city"]}
          pageSize={10}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-800">Reports</h3>
          <ul className="divide-y divide-slate-100">
            {REPORT_TYPES.map((r) => (
              <li key={r} className="py-2.5">
                <button
                  type="button"
                  onClick={() => handleGenerateReport(r)}
                  className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:underline"
                >
                  <FileText className="h-4 w-4 text-[#2563EB]" />
                  <span>{r}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-800">Customer Workflow</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            {WORKFLOW_STEPS.map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[#2563EB]">{step}</span>
                {i < arr.length - 1 && <span className="text-slate-300">↓</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <CustomerDetailModal
          customer={selected}
          onClose={() => setSelected(null)}
          onEdit={(c) => { setSelected(null); setFormCustomer(c); }}
          onDelete={handleDelete}
        />
      )}

      {formCustomer && (
        <CustomerFormModal
          customer={formCustomer}
          onClose={() => setFormCustomer(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
