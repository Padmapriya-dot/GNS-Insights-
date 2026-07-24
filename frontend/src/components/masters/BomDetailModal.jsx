import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  FileText,
  History,
  Package,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "components", label: "Components" },
  { id: "costing", label: "Costing" },
  { id: "routing", label: "Routing" },
  { id: "machines", label: "Machines" },
  { id: "inventory", label: "Inventory" },
  { id: "documents", label: "Documents" },
  { id: "versions", label: "Version History" },
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

function StatusPill({ status }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    draft: "bg-amber-100 text-amber-700",
    inactive: "bg-slate-100 text-slate-600",
    pending_approval: "bg-blue-100 text-blue-700",
    low_stock: "bg-orange-100 text-orange-700",
    available: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
    pending: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {String(status).replace(/_/g, " ")}
    </span>
  );
}

function WorkflowStep({ step, index, total }) {
  const Icon = step.status === "completed" ? CheckCircle2 : step.status === "active" ? Clock : Circle;
  const color = step.status === "completed" ? "text-green-500" : step.status === "active" ? "text-[#2563EB]" : "text-slate-300";
  return (
    <div className="flex flex-col items-center">
      <Icon className={`h-6 w-6 ${color}`} />
      <p className="mt-1 text-xs font-semibold text-slate-700">{step.step}</p>
      <p className="text-[10px] text-slate-400">{step.date !== "—" ? step.date : "Pending"}</p>
      {index < total - 1 && <ArrowDown className="my-1 h-4 w-4 text-slate-300" />}
    </div>
  );
}

export default function BomDetailModal({ bom, onClose, onEdit, onCopy, onDelete, onPrint }) {
  const [tab, setTab] = useState("overview");
  if (!bom) return null;

  const formatInr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const componentCount = bom.components?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-[#2563EB]">{bom.bom_number}</p>
            <h2 className="text-xl font-bold text-slate-900">{bom.product_name}</h2>
            <p className="text-sm text-slate-500">{bom.product_code} · {bom.version} · {componentCount} components</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-5 py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === t.id ? "bg-[#2563EB] text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "overview" && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-800">BOM Information</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field label="BOM Number" value={bom.bom_number} />
                  <Field label="Product Name" value={bom.product_name} />
                  <Field label="Product Code" value={bom.product_code} />
                  <Field label="Version" value={bom.version} />
                  <Field label="Revision" value={bom.revision} />
                  <Field label="Status" value={<StatusPill status={bom.status} />} />
                  <Field label="Effective Date" value={bom.effective_date || "—"} />
                  <Field label="Expiry Date" value={bom.expiry_date || "N/A"} />
                  <Field label="Created By" value={bom.created_by} />
                  <Field label="Approved By" value={bom.approved_by} />
                </div>
                <div className="mt-3"><Field label="Description" value={bom.description} /></div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-800">Approval Workflow</h3>
                <div className="flex flex-wrap items-start justify-center gap-2 rounded-xl bg-slate-50 p-4">
                  {(bom.approval_workflow || []).map((step, i, arr) => (
                    <WorkflowStep key={step.step} step={step} index={i} total={arr.length} />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to="/masters/products" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 no-underline">View Product</Link>
                <Link to="/inventory/raw-materials" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 no-underline">View Inventory</Link>
                <Link to="/procurement/purchase-orders" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 no-underline">Purchase Orders</Link>
                <Link to="/production/work-orders" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 no-underline">Production Orders</Link>
                <Link to="/quality/inspection" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 no-underline">Quality Reports</Link>
              </div>
            </div>
          )}

          {tab === "components" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Add Component</button>
                <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Remove Component</button>
                <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Duplicate Component</button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Component</th>
                      <th className="px-3 py-2">Item Code</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Unit Cost</th>
                      <th className="px-3 py-2">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bom.components || []).map((c) => (
                      <tr key={c.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium">{c.component}</td>
                        <td className="px-3 py-2">{c.item_code}</td>
                        <td className="px-3 py-2">{c.category}</td>
                        <td className="px-3 py-2">{c.unit}</td>
                        <td className="px-3 py-2">{c.qty}</td>
                        <td className="px-3 py-2">{formatInr(c.unit_cost)}</td>
                        <td className="px-3 py-2 font-semibold">{formatInr(c.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "costing" && bom.costing && (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Material Cost", bom.costing.material_cost],
                ["Labour Cost", bom.costing.labour_cost],
                ["Machine Cost", bom.costing.machine_cost],
                ["Electricity Cost", bom.costing.electricity_cost],
                ["Overhead Cost", bom.costing.overhead_cost],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="font-bold text-slate-900">{formatInr(val)}</span>
                </div>
              ))}
              <div className="sm:col-span-2 flex justify-between rounded-xl bg-[#2563EB]/10 px-4 py-4">
                <span className="font-bold text-[#2563EB]">Total Manufacturing Cost</span>
                <span className="text-xl font-bold text-[#2563EB]">{formatInr(bom.costing.total_cost)}</span>
              </div>
            </div>
          )}

          {tab === "routing" && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Operation</th>
                    <th className="px-3 py-2">Work Center</th>
                    <th className="px-3 py-2">Machine</th>
                    <th className="px-3 py-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {(bom.routing || []).length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">No routing defined</td></tr>
                  ) : (
                    bom.routing.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium">{r.operation}</td>
                        <td className="px-3 py-2">{r.work_center}</td>
                        <td className="px-3 py-2">{r.machine}</td>
                        <td className="px-3 py-2">{r.duration}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === "machines" && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Machine Name</th>
                    <th className="px-3 py-2">Machine Code</th>
                    <th className="px-3 py-2">Capacity</th>
                    <th className="px-3 py-2">Operators</th>
                    <th className="px-3 py-2">Setup Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(bom.machines || []).map((m, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium">{m.name}</td>
                      <td className="px-3 py-2">{m.code}</td>
                      <td className="px-3 py-2">{m.capacity}</td>
                      <td className="px-3 py-2">{m.operator_required}</td>
                      <td className="px-3 py-2">{m.setup_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "inventory" && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Component</th>
                    <th className="px-3 py-2">Required</th>
                    <th className="px-3 py-2">Available</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(bom.inventory_availability || []).map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium">{row.component}</td>
                      <td className="px-3 py-2">{row.required}</td>
                      <td className="px-3 py-2">{row.available}</td>
                      <td className="px-3 py-2"><StatusPill status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "documents" && (
            <ul className="space-y-2">
              {(bom.documents || []).length === 0 ? (
                <li className="text-sm text-slate-400">No documents attached</li>
              ) : (
                bom.documents.map((d, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                    <FileText className="h-5 w-5 text-[#2563EB]" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.type} · {d.size}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}

          {tab === "versions" && (
            <ul className="space-y-3">
              {(bom.version_history || []).map((v, i) => (
                <li key={i} className="rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2563EB]">{v.version}</span>
                    <span className="text-xs text-slate-400">{v.date}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{v.changes}</p>
                  <p className="text-xs text-slate-500">By {v.author}</p>
                </li>
              ))}
            </ul>
          )}

          {tab === "audit" && bom.audit && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Created By" value={bom.audit.created_by} />
              <Field label="Modified By" value={bom.audit.modified_by} />
              <Field label="Approved By" value={bom.audit.approved_by} />
              <Field label="Modified Date" value={bom.audit.modified_date} />
              <div className="col-span-2"><Field label="Remarks" value={bom.audit.remarks} /></div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button type="button" onClick={() => onEdit(bom)} className="ui-btn-primary text-xs">Edit BOM</button>
          <button type="button" onClick={() => onCopy(bom)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Copy className="h-3.5 w-3.5" /> Copy BOM
          </button>
          <button type="button" onClick={() => onPrint(bom)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <FileText className="h-3.5 w-3.5" /> Print PDF
          </button>
          <Link to="/production/work-orders/create-quick" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 no-underline">
            <Package className="h-3.5 w-3.5" /> Create Production Order
          </Link>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <History className="h-3.5 w-3.5" /> Material Requirement
          </button>
          <button type="button" onClick={() => onDelete(bom)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function BomFormModal({ bom, onClose, onSave }) {
  const [form, setForm] = useState({
    bom_number: bom?.bom_number || "",
    product_name: bom?.product_name || "",
    product_code: bom?.product_code || "",
    version: bom?.version || "V1.0",
    total_cost: bom?.costing?.total_cost ?? "",
    status: bom?.status || "active",
    description: bom?.description || "",
    category: bom?.category || "Finished Goods",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(e) => { e.preventDefault(); onSave(form); }}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{bom?.bom_number ? "Edit BOM" : "Create BOM"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="text-xs font-semibold text-slate-500">BOM No</span>
            <input value={form.bom_number} onChange={(e) => set("bom_number", e.target.value)} placeholder="e.g. BOM-2024-001" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-500">Version</span>
            <input value={form.version} onChange={(e) => set("version", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-500">Product Name *</span>
            <input required value={form.product_name} onChange={(e) => set("product_name", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-500">Product Code</span>
            <input value={form.product_code} onChange={(e) => set("product_code", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-500">Cost (₹)</span>
            <input type="number" min="0" step="0.01" value={form.total_cost} onChange={(e) => set("total_cost", e.target.value)} placeholder="e.g. 500" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-500">Status</span>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-500">Description</span>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
          <button type="submit" className="ui-btn-primary">Save BOM</button>
        </div>
      </form>
    </div>
  );
}
