import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ClipboardList,
  Cpu,
  FileText,
  History,
  Play,
  Printer,
  Square,
  Thermometer,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import { STATUS_COLORS, statusLabel } from "../../data/machinesMasterData";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "production", label: "Production" },
  { id: "maintenance", label: "Maintenance" },
  { id: "work_orders", label: "Work Orders" },
  { id: "history", label: "History" },
  { id: "documents", label: "Documents" },
  { id: "iot", label: "IoT" },
  { id: "audit", label: "Audit Logs" },
];

function Field({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{value ?? "—"}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || "idle").toLowerCase();
  const c = STATUS_COLORS[s] || STATUS_COLORS.idle;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${c.bg} ${c.text} ${c.border}`}>
      <span>{c.dot}</span>
      {statusLabel(s)}
    </span>
  );
}

function ChartPlaceholder({ title, subtitle }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <Activity className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-2 text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

export default function MachineDetailModal({ machine, detail, onClose, onStatusChange }) {
  const [tab, setTab] = useState("overview");
  if (!machine) return null;

  const m = { ...machine, ...(detail || {}) };
  const status = m.display_status || m.status;
  const remaining = Math.max(0, (m.target_quantity || 0) - (m.todays_output || 0));

  const kpis = [
    { label: "Today's Output", value: m.todays_output ?? 0 },
    { label: "Efficiency", value: m.efficiency_pct != null ? `${m.efficiency_pct}%` : "—" },
    { label: "OEE", value: m.oee_pct != null ? `${m.oee_pct}%` : "—" },
    { label: "Health", value: m.health_score != null ? `${m.health_score}%` : "—" },
    { label: "Downtime", value: m.downtime_minutes != null ? `${m.downtime_minutes} min` : "—" },
    { label: "Energy", value: m.energy_kwh != null ? `${m.energy_kwh} kWh` : "—" },
  ];

  const workOrders = m.work_orders || [];
  const maintHistory = m.maintenance_history || [];
  const statusLogs = m.status_logs || [];
  const documents = m.documents || [];
  const auditLogs = m.audit_logs || [];
  const iot = m.iot || {};

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold text-[#2563EB]">{m.code}</p>
              <StatusBadge status={status} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{m.name}</h2>
            <p className="text-sm text-slate-500">
              {m.department} · {m.production_line} · {m.assigned_operator || "No operator"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 sm:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.label} className="text-center">
              <p className="text-[10px] font-medium text-slate-500">{k.label}</p>
              <p className="text-sm font-bold text-slate-800">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-2">
          <Link to="/production/work-orders" className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
            Assign Work Order
          </Link>
          {status !== "running" && (
            <button type="button" onClick={() => onStatusChange?.(m, "running")} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
              <Play className="h-3 w-3" /> Start
            </button>
          )}
          {status === "running" && (
            <button type="button" onClick={() => onStatusChange?.(m, "idle")} className="inline-flex items-center gap-1 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
              <Square className="h-3 w-3" /> Stop
            </button>
          )}
          <Link to="/maintenance/schedule" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Schedule Maintenance
          </Link>
          <Link to="/production/daily-reports" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            View Production
          </Link>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Printer className="h-3 w-3" /> Print
          </button>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-slate-100 px-5 py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                tab === t.id ? "bg-[#2563EB] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "overview" && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-800">General Information</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field label="Machine Name" value={m.name} />
                  <Field label="Machine Code" value={m.code} />
                  <Field label="Machine Type" value={m.machine_type} />
                  <Field label="Manufacturer" value={m.manufacturer} />
                  <Field label="Model" value={m.model_name} />
                  <Field label="Serial Number" value={m.serial_number} />
                  <Field label="Purchase Date" value={m.purchase_date} />
                  <Field label="Warranty" value={m.warranty_until} />
                  <Field label="Department" value={m.department} />
                  <Field label="Work Center" value={m.work_center} />
                  <Field label="Production Line" value={m.production_line} />
                  <Field label="Location" value={m.location} />
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-800">Live Production</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field label="Current Work Order" value={m.current_work_order} />
                  <Field label="Current Product" value={m.current_product} />
                  <Field label="Quantity Produced" value={m.todays_output} />
                  <Field label="Target Quantity" value={m.target_quantity} />
                  <Field label="Remaining" value={remaining} />
                  <Field label="Shift" value={m.current_shift} />
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-800">Performance</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Efficiency %" value={m.efficiency_pct != null ? `${m.efficiency_pct}%` : "—"} />
                  <Field label="OEE %" value={m.oee_pct != null ? `${m.oee_pct}%` : "—"} />
                  <Field label="Availability" value={m.availability_pct != null ? `${m.availability_pct}%` : "—"} />
                  <Field label="Performance" value={m.performance_pct != null ? `${m.performance_pct}%` : "—"} />
                  <Field label="Quality" value={m.quality_pct != null ? `${m.quality_pct}%` : "—"} />
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-800">Operator</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field label="Assigned Operator" value={m.assigned_operator} />
                  <Field label="Shift" value={m.current_shift} />
                  <Field label="Login Time" value={m.login_time} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ChartPlaceholder title="Machine Utilization" subtitle="Last 7 days trend" />
                <ChartPlaceholder title="Downtime Trend" subtitle="Breakdown & maintenance hours" />
                <ChartPlaceholder title="Production Trend" subtitle="Daily output vs target" />
                <ChartPlaceholder title="OEE Dashboard" subtitle="Availability · Performance · Quality" />
              </div>
            </div>
          )}

          {tab === "production" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Today's Output" value={m.todays_output} />
                <Field label="Target" value={m.target_quantity} />
                <Field label="Efficiency" value={m.efficiency_pct != null ? `${m.efficiency_pct}%` : "—"} />
                <Field label="Current WO" value={m.current_work_order} />
              </div>
              <ChartPlaceholder title="Production Trend" subtitle="Hourly output chart — connect to daily reports API" />
            </div>
          )}

          {tab === "maintenance" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Last Maintenance" value={m.last_maintenance_date} />
                <Field label="Next Maintenance" value={m.next_maintenance_date} />
                <Field label="Downtime (Total)" value={m.downtime_minutes != null ? `${m.downtime_minutes} min` : "—"} />
              </div>
              {maintHistory.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-slate-400">
                      <th className="py-2">Date</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Description</th>
                      <th className="py-2">Performed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintHistory.map((row) => (
                      <tr key={row.id} className="border-b border-slate-50">
                        <td className="py-2">{row.maintenance_date}</td>
                        <td className="py-2">{row.maintenance_type}</td>
                        <td className="py-2">{row.description || "—"}</td>
                        <td className="py-2">{row.performed_by || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No maintenance records yet.
                </p>
              )}
              <ChartPlaceholder title="Maintenance History" subtitle="Preventive vs breakdown maintenance" />
            </div>
          )}

          {tab === "work_orders" && (
            workOrders.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-400">
                    <th className="py-2">WO Number</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Planned</th>
                    <th className="py-2 text-right">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((wo) => (
                    <tr key={wo.id} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-[#2563EB]">{wo.work_order_number}</td>
                      <td className="py-2 capitalize">{wo.status}</td>
                      <td className="py-2 text-right">{wo.planned_quantity}</td>
                      <td className="py-2 text-right">{wo.actual_quantity ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No work orders assigned to this machine.
              </p>
            )
          )}

          {tab === "history" && (
            statusLogs.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-400">
                    <th className="py-2">Status</th>
                    <th className="py-2">Started</th>
                    <th className="py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {statusLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50">
                      <td className="py-2"><StatusBadge status={log.status} /></td>
                      <td className="py-2">{log.started_at?.slice?.(0, 16)?.replace("T", " ") || log.started_at}</td>
                      <td className="py-2">{log.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No status history available.
              </p>
            )
          )}

          {tab === "documents" && (
            documents.length > 0 ? (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.name} className="flex items-center gap-3 rounded-lg border border-slate-100 px-4 py-3">
                    <FileText className="h-5 w-5 text-[#2563EB]" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                      <p className="text-xs text-slate-400">{doc.type}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No documents uploaded.
              </p>
            )
          )}

          {tab === "iot" && (
            <div className="space-y-4">
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                IoT sensors — real-time data will appear here when connected.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Temperature" value={iot.temperature != null ? `${iot.temperature} °C` : m.temperature_c != null ? `${m.temperature_c} °C` : "—"} />
                <Field label="RPM" value={iot.rpm ?? m.rpm ?? "—"} />
                <Field label="Vibration" value={iot.vibration != null ? `${iot.vibration} mm/s` : "—"} />
                <Field label="Power" value={iot.power_kw != null ? `${iot.power_kw} kW` : "—"} />
                <Field label="Machine Health" value={iot.health != null ? `${iot.health}%` : m.health_score != null ? `${m.health_score}%` : "—"} />
                <Field label="Running Time" value={iot.running_time_hrs != null ? `${iot.running_time_hrs} hrs` : "—"} />
                <Field label="Downtime" value={iot.downtime_hrs != null ? `${iot.downtime_hrs} hrs` : "—"} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ChartPlaceholder title="Temperature Trend" subtitle="Live IoT feed" />
                <ChartPlaceholder title="Energy Consumption" subtitle="kWh per shift" />
              </div>
            </div>
          )}

          {tab === "audit" && (
            auditLogs.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-400">
                    <th className="py-2">Action</th>
                    <th className="py-2">User</th>
                    <th className="py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2">{log.action}</td>
                      <td className="py-2">{log.user}</td>
                      <td className="py-2">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No audit logs for this machine.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
