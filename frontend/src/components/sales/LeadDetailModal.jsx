import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, X } from "lucide-react";

import { formatInr, priorityColor, statusColor } from "../../data/salesMasterData";

const TABS = ["Overview", "Contacts", "Notes", "Timeline", "Activities"];

export default function LeadDetailModal({ lead, onClose, onStatusChange, onConvertToQuotation, converting }) {
  const [tab, setTab] = useState("Overview");
  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-[#2563EB]">{lead.lead_id}</p>
            <h2 className="text-xl font-bold text-slate-900">{lead.customer_name}</h2>
            <p className="text-sm text-slate-500">{lead.company} · {lead.industry}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b px-5">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold ${tab === t ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500"}`}>{t}</button>
          ))}
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {tab === "Overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Field label="Sales Executive" value={lead.sales_executive} />
                <Field label="Source" value={lead.source} />
                <Field label="Region" value={lead.region} />
                <Field label="Priority"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${priorityColor(lead.priority)}`}>{lead.priority}</span></Field>
                <Field label="Status"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(lead.status)}`}>{lead.status}</span></Field>
                <Field label="Opportunity Value" value={lead.opportunity_value ? formatInr(lead.opportunity_value) : "—"} />
                <Field label="Next Follow-up" value={lead.next_followup || "—"} />
              </div>
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Workflow: Lead → Qualification → Opportunity → Quotation → Sales Order
              </div>
            </div>
          )}
          {tab === "Contacts" && (
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{lead.contact || "—"}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{lead.email || "—"}</p>
            </div>
          )}
          {tab === "Notes" && <p className="text-sm text-slate-600">{lead.notes || "No notes yet."}</p>}
          {tab === "Timeline" && (
            <ul className="space-y-2 text-sm">
              <li className="rounded-lg bg-slate-50 px-3 py-2">Lead created · {lead.next_followup || "Today"}</li>
              <li className="rounded-lg bg-slate-50 px-3 py-2">Follow-up scheduled</li>
            </ul>
          )}
          {tab === "Activities" && <p className="text-sm text-slate-500">Call and email history will appear here.</p>}
        </div>

        <div className="flex flex-wrap gap-2 border-t px-5 py-4">
          {lead.status !== "converted" && lead.status !== "lost" && (
            <select value={lead.status} onChange={(e) => onStatusChange?.(lead, e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
              {["new", "contacted", "qualified", "converted", "lost"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {typeof lead.id === "number" && lead.status !== "converted" && lead.status !== "lost" && (
            <button
              type="button"
              disabled={converting}
              onClick={() => onConvertToQuotation?.(lead)}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {converting ? "Converting…" : "Convert to Quotation"}
            </button>
          )}
          <Link to="/sales/quotations" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            Quotations
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, children }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-slate-400">{label}</p>
      {children || <p className="mt-0.5 text-sm font-medium text-slate-800">{value ?? "—"}</p>}
    </div>
  );
}
