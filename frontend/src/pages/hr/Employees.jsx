import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Briefcase, UserCheck, UserMinus, UserPlus, Users, Filter, X, Save, Clock, Building2, FileText } from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import EmployeeDetailModal from "../../components/hr/EmployeeDetailModal";
import { useToast } from "../../context/ToastContext";
import { getEmployeeSummary, getEmployeesEnriched, createEmployee, getShifts } from "../../api/hrApi";
import useTenantId from "../../hooks/useTenantId";
import { DEMO_EMP_SUMMARY, deptColor, formatInr, statusColor } from "../../data/hrMasterData";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";

function KpiCard({ label, value, icon: Icon, color, suffix }) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">{label}</p>
          <p className="mt-1 text-lg sm:text-xl font-black tracking-tight text-slate-900 tabular-nums truncate" title={`${value}${suffix || ""}`}>
            {value}{suffix || ""}
          </p>
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105 ${color}`}>
            <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
}

const defaultFilters = { department: "", employment_type: "", shift: "", status: "" };

export default function Employees() {
  const tenantId = useTenantId();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(DEMO_EMP_SUMMARY);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selected, setSelected] = useState(null);

  const [shifts, setShifts] = useState([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tenant_id: tenantId,
    employee_code: "",
    full_name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    shift_name: "",
    reporting_manager: "",
    hire_date: new Date().toISOString().slice(0, 10),
    hourly_rate: "",
  });

  const load = useCallback(
    async (isManual = false) => {
      setLoading(true);
      try {
        const [sumRes, listRes, shiftRes] = await Promise.allSettled([
          getEmployeeSummary(),
          getEmployeesEnriched(),
          getShifts(),
        ]);
        let hasError = false;

        if (sumRes.status === "fulfilled" && sumRes.value?.data) {
          setSummary({ ...DEMO_EMP_SUMMARY, ...sumRes.value.data });
        }
        if (listRes.status === "fulfilled" && Array.isArray(listRes.value?.data)) {
          setRows([...listRes.value.data]);
        }
        if (shiftRes.status === "fulfilled" && Array.isArray(shiftRes.value?.data)) {
          setShifts([...shiftRes.value.data]);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    await load();
  };

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filters.department) list = list.filter((r) => r.department === filters.department);
    if (filters.employment_type) list = list.filter((r) => r.employment_type === filters.employment_type);
    if (filters.shift) list = list.filter((r) => r.shift === filters.shift);
    return list;
  }, [rows, filters]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_code || !form.full_name) {
      setError("Employee Code and Full Name are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createEmployee({
        ...form,
        tenant_id: tenantId,
        employee_code: form.employee_code.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        department: form.department.trim() || null,
        designation: form.designation.trim() || null,
        shift_name: form.shift_name.trim() || null,
        reporting_manager: form.reporting_manager.trim() || null,
        hire_date: form.hire_date || null,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
      });
      addToast("Employee created successfully", "success");
      setShowCreateModal(false);
      setForm({
        tenant_id: tenantId,
        employee_code: "",
        full_name: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        shift_name: "",
        reporting_manager: "",
        hire_date: new Date().toISOString().slice(0, 10),
        hourly_rate: "",
      });
      load();
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.message;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to create employee. Please check the form and try again."
      );
      addToast("Failed to create employee", "error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "photo", label: "Photo", render: (r) => (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white">{r.initials || "?"}</div>
    )},
    { key: "employee_id", label: "Employee ID" },
    { key: "full_name", label: "Name", render: (r) => <span className="font-medium text-slate-900">{r.full_name}</span> },
    { key: "department", label: "Department", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${deptColor(r.department)}`}>{r.department}</span> },
    { key: "designation", label: "Designation" },
    { key: "shift", label: "Shift" },
    { key: "reporting_manager", label: "Manager", render: (r) => r.reporting_manager || "—" },
    { key: "employment_type", label: "Type", render: (r) => <span className="capitalize">{r.employment_type}</span> },
    { key: "status", label: "Status", render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(r.status)}`}>{r.status}</span> },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "joining_date", label: "Joining", render: (r) => String(r.joining_date || "").slice(0, 10) || "—" },
    { key: "salary", label: "Salary", render: (r) => r.salary ? formatInr(r.salary) : "—" },
    { key: "actions", label: "Actions", render: (r) => (
      <button type="button" onClick={() => setSelected(r)} className="text-xs font-semibold text-[#2563EB] hover:underline">Profile</button>
    )},
  ];

  if (loading && rows.length === 0) return <Loader label="Loading employees..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">Employees</h1>
          <p className="mt-1 text-sm text-slate-500">Enterprise employee management with 360° profile, shift, and payroll integration.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> Create Employee
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
        <KpiCard label="Total Employees" value={summary.total_employees} icon={Users} color="bg-blue-600" />
        <KpiCard label="Present Today" value={summary.present_today} icon={UserCheck} color="bg-green-600" />
        <KpiCard label="Absent" value={summary.absent} icon={UserMinus} color="bg-red-500" />
        <KpiCard label="On Leave" value={summary.on_leave} icon={Briefcase} color="bg-amber-500" />
        <KpiCard label="Overtime (h)" value={summary.overtime} icon={Clock} color="bg-orange-500" />
        <KpiCard label="Departments" value={summary.departments} icon={Building2} color="bg-indigo-600" />
        <KpiCard label="Contract" value={summary.contract_employees} icon={FileText} color="bg-teal-600" />
        <KpiCard label="New Joiners" value={summary.new_joiners} icon={UserPlus} color="bg-purple-600" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><Filter className="h-4 w-4" /> Filters</button>
        {showAdvanced && (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">All Departments</option>
              {["Production", "Quality", "Maintenance", "Stores", "HR"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filters.employment_type} onChange={(e) => setFilters({ ...filters, employment_type: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">All Types</option>
              {["permanent", "contract", "temporary"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filters.shift} onChange={(e) => setFilters({ ...filters, shift: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">All Shifts</option>
              {["Morning", "General", "Evening", "Night"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <DataTable columns={columns} data={filtered} searchPlaceholder="Search employee, department..." searchKeys={["full_name", "employee_id", "department", "designation"]} />
      </div>

      {selected && <EmployeeDetailModal employee={selected} onClose={() => setSelected(null)} />}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create Employee</h3>
                <p className="text-xs text-slate-500 mt-0.5">Add a new employee record for attendance, leave, and payroll.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Employee Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-001"
                    value={form.employee_code}
                    onChange={(e) => handleFormChange("employee_code", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={form.full_name}
                    onChange={(e) => handleFormChange("full_name", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Hire Date</label>
                  <input
                    type="date"
                    value={form.hire_date}
                    onChange={(e) => handleFormChange("hire_date", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => handleFormChange("department", e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select Department</option>
                    {["Production", "Quality", "Maintenance", "Stores", "HR"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Assign Shift</label>
                  <select
                    value={form.shift_name}
                    onChange={(e) => handleFormChange("shift_name", e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select Shift</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.name}>{s.name} ({s.start_time.slice(0,5)} - {s.end_time.slice(0,5)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Operator"
                    value={form.designation}
                    onChange={(e) => handleFormChange("designation", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Hourly Rate ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.hourly_rate}
                    onChange={(e) => handleFormChange("hourly_rate", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Reporting Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Gogula Sowmya"
                    value={form.reporting_manager}
                    onChange={(e) => handleFormChange("reporting_manager", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 90591 86584"
                    value={form.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
