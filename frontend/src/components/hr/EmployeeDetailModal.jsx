import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, X } from "lucide-react";

import { deptColor, formatInr, statusColor } from "../../data/hrMasterData";

const TABS = ["Personal", "Job", "Attendance", "Leave", "Payroll", "Performance", "Documents", "Training", "Assets", "History"];

export default function EmployeeDetailModal({ employee, onClose }) {
  const [tab, setTab] = useState("Personal");
  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start gap-4 border-b px-5 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-lg font-bold text-white">
            {employee.initials || "?"}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#2563EB]">{employee.employee_id}</p>
            <h2 className="text-xl font-bold text-slate-900">{employee.full_name}</h2>
            <p className="text-sm text-slate-500">{employee.designation} · <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${deptColor(employee.department)}`}>{employee.department}</span></p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b px-5">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap border-b-2 px-2.5 py-2 text-xs font-semibold ${tab === t ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500"}`}>{t}</button>
          ))}
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {tab === "Personal" && (
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Field label="Phone" value={employee.phone} icon={Phone} />
              <Field label="Email" value={employee.email} icon={Mail} />
              <Field label="Joining Date" value={employee.joining_date} />
              <Field label="Employment Type" value={employee.employment_type} />
              <Field label="Status"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(employee.status)}`}>{employee.status}</span></Field>
              <Field label="Salary" value={employee.salary ? formatInr(employee.salary) : "—"} />
            </div>
          )}
          {tab === "Job" && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Department" value={employee.department} />
              <Field label="Designation" value={employee.designation} />
              <Field label="Shift" value={typeof employee.shift === "object" ? (employee.shift?.label || employee.shift?.id || "—") : (employee.shift || "—")} />
              <Field label="Reporting Manager" value={employee.reporting_manager} />
            </div>
          )}
          {tab !== "Personal" && tab !== "Job" && (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              {tab} records for {employee.full_name} — linked to production allocation & performance modules.
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t px-5 py-4">
          <Link to="/hr/attendance" className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700">Attendance</Link>
          <Link to="/hr/payroll" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">View Payroll</Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, children, icon: Icon }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-slate-400">{label}</p>
      {children || (
        <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-slate-800">
          {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}{value ?? "—"}
        </p>
      )}
    </div>
  );
}
