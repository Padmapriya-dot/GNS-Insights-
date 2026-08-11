import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Pause,
  Play,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Upload,
  X,
} from "lucide-react";

import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import ManufacturingWorkflowBar from "../../components/manufacturing/ManufacturingWorkflowBar";
import ProductionOrderDetailModal, {
  CompleteWorkflowModal,
  StartCheckModal,
} from "../../components/production/ProductionOrderDetailModal";
import { useToast } from "../../context/ToastContext";
import useManufacturingRefresh from "../../hooks/useManufacturingRefresh";
import { notifyManufacturingSpine, MANUFACTURING_EVENTS } from "../../utils/manufacturingEvents";
import useAuth from "../../hooks/useAuth";
import { isOperator } from "../../config/permissions";
import {
  completeProductionOrder,
  createProductionOrder,
  getProductionOrderDetail,
  getProductionOrderStartChecks,
  getProductionOrders,
  getProductionPlanningSummary,
  pauseProductionOrder,
  startProductionOrder,
  updateProductionOrderPriority,
  updateProductionOrderMachine,
  getMachines,
} from "../../api/productionApi";
import {
  DEPARTMENTS,
  IMPORT_TEMPLATE_HEADERS,
  ORDER_STATUSES,
  PRIORITIES,
  SHIFTS,
  STATUS_FLOW,
  canComplete,
  canPause,
  canStart,
  calculateProgressPct,
  computePlanningSummary,
  enrichApiOrder,
  priorityBadge,
  statusLabel,
} from "../../data/productionPlanningMasterData";
import { exportToExcel, exportToPdf } from "../../utils/exportUtils";
import { printProductionOrder } from "../../utils/printUtils";
import QuickWorkOrderModal from "../../components/production/QuickWorkOrderModal";
import IssueMaterialsModal from "../../components/production/IssueMaterialsModal";

const PAGE_BG = "#F5F5F5";
const YELLOW = "#F5C518";
const PAGE_SIZES = [20, 50, 100];

/* ─── Priority dot helper ─── */
const PRIORITY_DOT = {
  high: { dot: "🔴", label: "High" },
  medium: { dot: "🟡", label: "Medium" },
  low: { dot: "🟢", label: "Low" },
};

/* ─── Create Production Order Modal ─────────────────────────────── */
const MODAL_INPUT =
  "w-full rounded-xl border border-[#dcdce3] bg-[#fafafa] px-3.5 py-2.5 text-[13px] text-[#1a1a1f] placeholder:text-[#b0b0bb] focus:border-[#F5C518] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5C51830] transition-all";
const MODAL_SELECT =
  "w-full rounded-xl border border-[#dcdce3] bg-[#fafafa] px-3.5 py-2.5 text-[13px] text-[#1a1a1f] focus:border-[#F5C518] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5C51830] transition-all appearance-none cursor-pointer";
const MODAL_LABEL =
  "block mb-1 text-[11px] font-bold uppercase tracking-wider text-[#6b6b76]";

function CreateProductionOrderModal({ open, onClose, machines, onCreated }) {
  const emptyForm = {
    product_no: "",
    machine_id: "",
    operator_name: "",
    operator_id: "",
    planned_quantity: "",
    size: "",
    priority: "medium",
    shift: "General",
    status: "planned",
    start_date: "",
    due_date: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.product_no.trim()) errs.product_no = "Product No. is required.";
    if (!form.planned_quantity || Number(form.planned_quantity) <= 0)
      errs.planned_quantity = "Enter a valid quantity.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const selectedMachine = machines.find((m) => String(m.id) === String(form.machine_id));
    const payload = {
      order_number: form.product_no,
      product_no: form.product_no,
      machine_id: form.machine_id ? Number(form.machine_id) : null,
      machine_name: selectedMachine ? (selectedMachine.name || selectedMachine.code) : undefined,
      operator_name: form.operator_name,
      operator_id: form.operator_id,
      planned_quantity: Number(form.planned_quantity),
      size: form.size,
      priority: form.priority,
      shift: form.shift,
      status: form.status,
      start_date: form.start_date || undefined,
      due_date: form.due_date || undefined,
    };
    try {
      await createProductionOrder(payload);
      onCreated?.(payload);
      onClose();
    } catch {
      // Save locally if API fails
      const localOrder = enrichApiOrder({
        ...payload,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
      });
      try {
        const stored = localStorage.getItem("smrt_local_production_orders");
        const existing = stored ? JSON.parse(stored) : [];
        localStorage.setItem(
          "smrt_local_production_orders",
          JSON.stringify([localOrder, ...existing])
        );
      } catch {}
      onCreated?.(localOrder);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[760px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ animation: "modalIn 0.18s cubic-bezier(.4,0,.2,1) both" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-[#f0f0f4] bg-white px-6 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3C4] text-xl">
            📋
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-bold text-[#1a1a1f] leading-tight">New Production Order</h2>
            <p className="text-[12px] text-[#9a9aa5] mt-0.5">Fill in the details to create a production order</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9a9aa5] hover:bg-[#f5f5f7] hover:text-[#1a1a1f] transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4 bg-[#fafbfc]">

            {/* Row 1: Product No + Select Machine */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={MODAL_LABEL}>
                  Product No <span className="text-red-500 normal-case font-bold">*</span>
                </label>
                <input
                  id="create_modal_product_no"
                  name="product_no"
                  type="text"
                  value={form.product_no}
                  onChange={handleChange}
                  placeholder="e.g. PROD-1042"
                  className={`${MODAL_INPUT} ${errors.product_no ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                />
                {errors.product_no && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.product_no}</p>
                )}
              </div>
              <div>
                <label className={MODAL_LABEL}>
                  Select Machine <span className="text-[#9a9aa5] normal-case font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9aa5] text-sm">⚙</span>
                  <select
                    id="create_modal_machine_id"
                    name="machine_id"
                    value={form.machine_id}
                    onChange={handleChange}
                    className={`${MODAL_SELECT} pl-8 pr-8`}
                  >
                    <option value="">Select machine (optional)</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.machine_name || `Machine ${m.id}`}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9aa5]">▾</span>
                </div>
              </div>
            </div>

            {/* Row 2: Operator Name + Operator ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={MODAL_LABEL}>Operator Name</label>
                <input
                  id="create_modal_operator_name"
                  name="operator_name"
                  type="text"
                  value={form.operator_name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className={MODAL_INPUT}
                />
              </div>
              <div>
                <label className={MODAL_LABEL}>Operator ID</label>
                <input
                  id="create_modal_operator_id"
                  name="operator_id"
                  type="text"
                  value={form.operator_id}
                  onChange={handleChange}
                  placeholder="e.g. OP-104"
                  className={MODAL_INPUT}
                />
              </div>
            </div>

            {/* Row 3: Planned Quantity + Output Quantity Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={MODAL_LABEL}>
                  Planned Quantity <span className="text-red-500 normal-case font-bold">*</span>
                </label>
                <input
                  id="create_modal_planned_quantity"
                  name="planned_quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.planned_quantity}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className={`${MODAL_INPUT} ${errors.planned_quantity ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                />
                {errors.planned_quantity && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.planned_quantity}</p>
                )}
              </div>
              <div>
                <label className={MODAL_LABEL}>Output Quantity Size</label>
                <input
                  id="create_modal_size"
                  name="size"
                  type="text"
                  value={form.size}
                  onChange={handleChange}
                  placeholder="e.g. Large, XL, 500ml"
                  className={MODAL_INPUT}
                />
              </div>
            </div>

            {/* Row 4: Priority + Shift */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={MODAL_LABEL}>Priority</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm leading-none">
                    {PRIORITY_DOT[form.priority]?.dot || "🟡"}
                  </span>
                  <select
                    id="create_modal_priority"
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className={`${MODAL_SELECT} pl-9 pr-8`}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_DOT[p]?.label || p}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9aa5]">▾</span>
                </div>
              </div>
              <div>
                <label className={MODAL_LABEL}>Shift</label>
                <div className="relative">
                  <select
                    id="create_modal_shift"
                    name="shift"
                    value={form.shift}
                    onChange={handleChange}
                    className={`${MODAL_SELECT} pr-8`}
                  >
                    {SHIFTS.map((s) => {
                      const id = typeof s === "object" ? s.id : s;
                      const label = typeof s === "object" ? s.label : s;
                      const timing = typeof s === "object" ? s.timing : "";
                      return (
                        <option key={id} value={id}>
                          {label}{timing ? ` (${timing})` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9aa5]">▾</span>
                </div>
              </div>
            </div>

            {/* Row 5: Status (full width) */}
            <div>
              <label className={MODAL_LABEL}>Status</label>
              <div className="relative">
                <select
                  id="create_modal_status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={`${MODAL_SELECT} pr-8`}
                >
                  {["planned", "draft", "material_ready", "in_progress", "completed", "cancelled"].map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9aa5]">▾</span>
              </div>
            </div>

            {/* Row 6: Start Date & Time + Due Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={MODAL_LABEL}>Start Date &amp; Time</label>
                <input
                  id="create_modal_start_date"
                  name="start_date"
                  type="datetime-local"
                  value={form.start_date}
                  onChange={handleChange}
                  className={MODAL_INPUT}
                />
              </div>
              <div>
                <label className={MODAL_LABEL}>Due Date &amp; Time</label>
                <input
                  id="create_modal_due_date"
                  name="due_date"
                  type="datetime-local"
                  value={form.due_date}
                  onChange={handleChange}
                  className={MODAL_INPUT}
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-[#f0f0f4] bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dcdce3] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#1a1a1f] hover:bg-[#f5f5f7] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-bold text-[#1a1a1f] shadow-sm hover:brightness-95 disabled:opacity-60 transition-all"
              style={{ background: YELLOW }}
            >
              <CheckCircle className="h-4 w-4" />
              {saving ? "Creating…" : "Create Production Order"}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, onClick }) {
  const displayVal =
    value === null || value === undefined
      ? "0"
      : typeof value === "object"
      ? (value?.value ?? value?.count ?? value?.total ?? JSON.stringify(value))
      : String(value);

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs min-h-[86px] flex flex-col justify-between min-w-0 overflow-hidden ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
      title={typeof label === "string" ? label : undefined}
    >
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <p className="truncate text-[11px] font-medium text-slate-500 leading-tight sm:text-xs min-w-0 flex-1">{label}</p>
        {Icon && (
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${color}`}>
            <Icon className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="truncate text-xl font-extrabold tabular-nums text-slate-900 leading-none">{displayVal}</p>
      </div>
    </div>
  );
}

function PriorityPill({ priority }) {
  const p = priorityBadge(priority || "medium");
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${p.bg} ${p.text}`}>
      {p.dot} {p.label}
    </span>
  );
}

function ProgressCell({ row }) {
  const pct = calculateProgressPct(row);
  const planned = Number(row.planned_quantity || 0);
  const rawProduced = Number(row.produced_quantity ?? row.actual_quantity ?? 0);
  const produced = (row.status === "completed" || row.status === "closed" || row.status === "done")
    ? Math.max(rawProduced, planned)
    : rawProduced > 0
    ? rawProduced
    : Math.round((planned * pct) / 100);
  return (
    <div className="min-w-[100px]">
      <div className="mb-0.5 flex justify-between text-[10px] text-slate-500 print:text-black">
        <span>{produced}/{planned}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 print:border print:border-slate-300">
        <div className="h-full rounded-full bg-[#2563EB] print:bg-slate-700" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

const defaultFilters = {
  order_number: "",
  product: "",
  customer: "",
  work_order: "",
  machine: "",
  department: "",
  shift: "",
  priority: "",
  status: "",
  date_from: "",
  date_to: "",
};

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val).slice(0, 10) : d.toLocaleDateString(undefined, { dateStyle: "short" });
}

/* ─── Bottom-Right Yellow Order Created Toast Popup ───────────────────────── */
function OrderCreatedToast({ order, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 7000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!order) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-full max-w-sm animate-in slide-in-from-bottom-5 duration-300 print:hidden">
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-yellow-400/40 border-l-6 border-[#F5C518]">
        {/* close */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-yellow-100 hover:text-gray-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-3.5 mb-3 pr-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F5C518] shadow-sm text-gray-900">
            <CheckCircle className="h-6 w-6 text-gray-900" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-gray-900">
              Production Order Created!
            </h4>
            <p className="text-xs font-medium text-gray-600 mt-0.5">
              Order <strong className="text-gray-900 font-bold">#{order.order_number || order.id}</strong> has been saved.
            </p>
          </div>
        </div>

        {/* Operator card if present with Yellow/Amber accent */}
        {order.operator_name && (
          <div className="flex items-center justify-between rounded-xl bg-amber-50/90 border border-amber-200 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Send className="h-4 w-4 text-amber-700 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Sent to Operator</p>
                <p className="truncate text-xs font-bold text-gray-900">{order.operator_name}</p>
              </div>
            </div>
            {order.operator_id && order.operator_id !== "—" && (
              <span className="text-[11px] font-bold text-gray-900 bg-[#F5C518] px-2 py-0.5 rounded-md shrink-0 shadow-xs">
                ID: {order.operator_id}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductionPlanning() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [apiSummary, setApiSummary] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [startModal, setStartModal] = useState(null);
  const [startChecks, setStartChecks] = useState([]);
  const [startLoading, setStartLoading] = useState(false);
  const [completeModal, setCompleteModal] = useState(null);
  const [completeSteps, setCompleteSteps] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [createdToastOrder, setCreatedToastOrder] = useState(null);
  const [quickWoOrder, setQuickWoOrder] = useState(null);
  const [issueModalOrder, setIssueModalOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    if (location.state?.createdOrder) {
      setCreatedToastOrder(location.state.createdOrder);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [machines, setMachines] = useState([]);
  // State to track which single order is being printed
  const [printDetailOrder, setPrintDetailOrder] = useState(null);

  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, sRes, mRes] = await Promise.all([
        getProductionOrders().catch(() => ({ data: [] })),
        getProductionPlanningSummary().catch(() => ({ data: null })),
        getMachines().catch(() => ({ data: [] })),
      ]);
      setMachines(mRes?.data || []);
      const apiOrders = Array.isArray(oRes.data) ? oRes.data.map(enrichApiOrder) : [];
      let localOrders = [];
      try {
        const stored = localStorage.getItem("smrt_local_production_orders");
        if (stored) {
          const parsed = JSON.parse(stored);
          let modified = false;
          localOrders = parsed.map((r, i) => {
            if (r && typeof r.shift === "object" && r.shift !== null) {
              r.shift = r.shift.label || r.shift.id || "General";
              modified = true;
            }
            return enrichApiOrder(r, i);
          });
          if (modified) {
            try {
              localStorage.setItem("smrt_local_production_orders", JSON.stringify(localOrders));
            } catch (e) {}
          }
        }
      } catch (e) {}
      const rawList = [...localOrders, ...apiOrders];
      const seen = new Set();
      const list = rawList.filter((o) => {
        const key = o.id ? `id-${o.id}` : o.order_number ? `num-${o.order_number}` : null;
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      list.sort((a, b) => {
        const idA = typeof a.id === "number" ? a.id : Number(String(a.id).replace(/\D/g, "")) || 0;
        const idB = typeof b.id === "number" ? b.id : Number(String(b.id).replace(/\D/g, "")) || 0;
        if (idA && idB && idA !== idB) return idB - idA;
        const dateA = a.created_at || a.start_date || "";
        const dateB = b.created_at || b.start_date || "";
        return dateB.localeCompare(dateA);
      });
      setOrders(list);
      setApiSummary(sRes.data || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const date_from = searchParams.get("date_from") ?? "";
    const date_to = searchParams.get("date_to") ?? "";
    if (date_from || date_to) {
      setFilters({ ...defaultFilters, date_from, date_to });
      setShowAdvanced(true);
    }
  }, [searchParams]);

  // Clean up print state after printing dialog closes
  useEffect(() => {
    const handleAfterPrint = () => setPrintDetailOrder(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  useManufacturingRefresh(load);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filters.order_number && !String(o.order_number).toLowerCase().includes(filters.order_number.toLowerCase())) return false;
      if (filters.product && !String(o.product_name || "").toLowerCase().includes(filters.product.toLowerCase())) return false;
      if (filters.customer && !String(o.customer_name || "").toLowerCase().includes(filters.customer.toLowerCase())) return false;
      if (filters.work_order && !String(o.work_order_number || "").toLowerCase().includes(filters.work_order.toLowerCase())) return false;
      if (filters.machine && !String(o.machine_name || "").toLowerCase().includes(filters.machine.toLowerCase())) return false;
      if (filters.department && o.department !== filters.department) return false;
      if (filters.shift && o.shift !== filters.shift) return false;
      if (filters.priority && o.priority !== filters.priority) return false;
      if (filters.status && o.status !== filters.status) return false;
      const startDate = o.start_date ? String(o.start_date).slice(0, 10) : "";
      if (filters.date_from && (!startDate || startDate < filters.date_from)) return false;
      if (filters.date_to && (!startDate || startDate > filters.date_to)) return false;
      return true;
    });
  }, [orders, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const total = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredOrders, page, pageSize]);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const summary = useMemo(() => {
    // Always compute from the actual merged orders list (local + API)
    // so status changes (e.g. completed) are reflected immediately
    const computed = computePlanningSummary(filteredOrders);
    if (apiSummary && !Object.values(filters).some(Boolean)) {
      // Use API values only for fields not derivable from local orders (e.g. todays_target from backend)
      return {
        ...computed,
        todays_target: apiSummary.todays_target ?? computed.todays_target,
      };
    }
    return computed;
  }, [apiSummary, filteredOrders, filters]);

  const showTodayStartOrders = () => {
    const today = new Date().toISOString().slice(0, 10);
    setFilters({ ...defaultFilters, date_from: today, date_to: today });
    setSearchParams({ date_from: today, date_to: today });
    setShowAdvanced(true);
  };

  const openOrder = async (order) => {
    setSelected(order);
    setDetail(null);
    if (typeof order.id === "number") {
      try {
        const res = await getProductionOrderDetail(order.id);
        setDetail(enrichApiOrder(res.data));
      } catch {
        /* use list */
      }
    }
  };

  const handlePriorityChange = async (orderId, newPriority) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, priority: newPriority } : o)));
    addToast(`Priority updated to ${newPriority}`);
    if (typeof orderId === "number") {
      try {
        await updateProductionOrderPriority(orderId, newPriority);
        notifyManufacturingSpine(MANUFACTURING_EVENTS.WORK_ORDER_UPDATED, { orderId, priority: newPriority });
      } catch {
        addToast("Priority update failed on server", "error");
      }
    }
  };

  const handleMachineChange = async (orderId, machineId) => {
    const numId = machineId ? Number(machineId) : null;
    const selectedM = machines.find((m) => String(m.id) === String(machineId));
    const mName = selectedM ? (selectedM.name || selectedM.code) : (machineId ? `Machine #${machineId}` : "—");

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId || o.order_number === orderId) {
          return { ...o, machine_id: numId, machine_name: mName };
        }
        return o;
      })
    );

    // Save to local storage for POs and WOs
    try {
      const storedPOs = localStorage.getItem("smrt_local_production_orders");
      if (storedPOs) {
        const localPOs = JSON.parse(storedPOs);
        const updatedPOs = localPOs.map((po) =>
          po.id === orderId || po.order_number === orderId
            ? { ...po, machine_id: numId, machine_name: mName }
            : po
        );
        localStorage.setItem("smrt_local_production_orders", JSON.stringify(updatedPOs));
      }

      const storedWOs = localStorage.getItem("smrt_local_work_orders");
      if (storedWOs) {
        const localWOs = JSON.parse(storedWOs);
        const updatedWOs = localWOs.map((wo) =>
          wo.production_order_id === orderId || wo.production_order_number === orderId
            ? { ...wo, machine_id: numId, machine_name: mName }
            : wo
        );
        localStorage.setItem("smrt_local_work_orders", JSON.stringify(updatedWOs));
      }
    } catch {}

    addToast(numId ? `Machine (${mName}) assigned` : "Machine unassigned", "success");

    if (typeof orderId === "number" && numId) {
      try {
        await updateProductionOrderMachine(orderId, numId);
        notifyManufacturingSpine(MANUFACTURING_EVENTS.WORK_ORDER_UPDATED, { orderId, machineId: numId });
      } catch {
        // Fallback info
      }
    }
  };

  const handleStartClick = async (order) => {
    if (typeof order.id === "number") {
      try {
        const res = await getProductionOrderStartChecks(order.id);
        setStartChecks(res.data || []);
        setStartModal(order);
        return;
      } catch {
        addToast("Could not load start checks", "error");
        return;
      }
    }
    const hasMachine = Boolean(order.machine_name && order.machine_name !== "—");
    const hasOperator = Boolean(order.operator_name && order.operator_name !== "—");
    setStartChecks([
      { check_type: "material", label: "Material Availability", ready: true, message: "All required materials available" },
      { check_type: "machine", label: "Machine Availability", ready: hasMachine, message: hasMachine ? `Machine ready (${order.machine_name})` : "No machine assigned" },
      { check_type: "operator", label: "Operator Availability", ready: hasOperator, message: hasOperator ? `Operator assigned (${order.operator_name})` : "No operator assigned" },
    ]);
    setStartModal(order);
  };

  const confirmStart = async () => {
    const order = startModal;
    if (!order) return;
    setStartLoading(true);
    if (typeof order.id === "number") {
      try {
        const res = await startProductionOrder(order.id);
        if (res.data?.success) {
          addToast("Production started");
          load();
          setStartModal(null);
        } else {
          setStartChecks(res.data?.checks || []);
          addToast(res.data?.message || "Checks failed", "error");
        }
      } catch (err) {
        addToast(err.response?.data?.detail || "Start failed", "error");
      } finally {
        setStartLoading(false);
      }
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "in_progress" } : o)));
    try {
      const storedPOs = localStorage.getItem("smrt_local_production_orders");
      if (storedPOs) {
        const list = JSON.parse(storedPOs);
        const updated = list.map((o) =>
          o.id === order.id || o.plan_code === order.plan_code || o.order_number === order.order_number
            ? { ...o, status: "in_progress" }
            : o
        );
        localStorage.setItem("smrt_local_production_orders", JSON.stringify(updated));
      }
      const storedTasks = localStorage.getItem("smrt_local_tasks");
      if (storedTasks) {
        const taskList = JSON.parse(storedTasks);
        const updatedTasks = taskList.map((t) => {
          if (
            t.status === "open" ||
            t.reference_id === order.plan_code ||
            t.reference_id === order.order_number ||
            t.work_order_id === order.id
          ) {
            return { ...t, status: "in_progress" };
          }
          return t;
        });
        localStorage.setItem("smrt_local_tasks", JSON.stringify(updatedTasks));
      }
    } catch {}
    addToast("Production started — Tasks set to In Progress");
    setStartModal(null);
    setStartLoading(false);
  };

  const handlePause = async (order) => {
    if (typeof order.id === "number") {
      try {
        await pauseProductionOrder(order.id);
        addToast("Production paused");
        load();
      } catch {
        addToast("Pause failed", "error");
      }
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "planned" } : o)));
    addToast("Production paused");
  };

  const handleComplete = async (order) => {
    if (typeof order.id === "number") {
      try {
        const res = await completeProductionOrder(order.id);
        if (res.data?.success) {
          setCompleteSteps(res.data.steps || []);
          setCompleteModal(order);
          addToast(res.data.message || "Completed");
          load();
          setSelected(null);
        } else {
          addToast(res.data?.message || "Complete failed", "error");
        }
      } catch (err) {
        addToast(err.response?.data?.detail || "Complete failed", "error");
      }
      return;
    }
    setCompleteSteps([
      "Production finished — quality inspection initiated",
      "Quality inspection passed",
      "Inventory updated with finished goods",
      "Order marked completed",
    ]);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "completed", produced_quantity: o.planned_quantity, progress_pct: 100 } : o)));
    // Persist the completed status to localStorage so summary counts update correctly
    try {
      const stored = localStorage.getItem("smrt_local_production_orders");
      if (stored) {
        const localOrders = JSON.parse(stored);
        const updated = localOrders.map((o) =>
          (o.id === order.id || o.order_number === order.order_number)
            ? { ...o, status: "completed", produced_quantity: o.planned_quantity, progress_pct: 100 }
            : o
        );
        localStorage.setItem("smrt_local_production_orders", JSON.stringify(updated));
      }
    } catch (e) {}
    setCompleteModal(order);
    addToast("Order completed");
  };

  const handleImportFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
        if (lines.length <= 1) {
          addToast("Import failed: CSV file is empty or missing data rows", "error");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim());
        const importedRows = lines.slice(1).map((line, idx) => {
          const values = line.split(",").map((v) => v.trim());
          const obj = {};
          headers.forEach((header, index) => {
            const key = header.toLowerCase().replace(/ /g, "_");
            obj[key] = values[index] || "";
          });

          return enrichApiOrder({
            id: `imported-${Date.now()}-${idx}`,
            order_number: obj.order_number || obj.po_number || `PO-IMP-${idx + 1}`,
            product_name: obj.product_name || obj.product || "Imported Product",
            customer_name: obj.customer_name || obj.customer || "N/A",
            planned_quantity: Number(obj.planned_quantity || obj.quantity || 0),
            priority: (obj.priority || "medium").toLowerCase(),
            department: obj.department || "Production",
            shift: obj.shift || "Shift A",
            start_date: obj.start_date || new Date().toISOString().slice(0, 10),
            due_date: obj.due_date || new Date().toISOString().slice(0, 10),
            status: obj.status || "planned",
            produced_quantity: Number(obj.produced_quantity || 0),
          });
        });

        setOrders((prev) => {
          const updated = [...importedRows, ...prev];
          try {
            const stored = localStorage.getItem("smrt_local_production_orders");
            const existing = stored ? JSON.parse(stored) : [];
            localStorage.setItem("smrt_local_production_orders", JSON.stringify([...importedRows, ...existing]));
          } catch (e) {}
          return updated;
        });
        addToast(`Successfully imported ${importedRows.length} production orders`);
      } catch (err) {
        addToast("Error parsing file. Please check CSV format.", "error");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const exportColumns = [
    { key: "order_number", label: "Order No" },
    { key: "product_name", label: "Product" },
    { key: "buyer_company", label: "Buyer Company" },
    { key: "size", label: "Size" },
    { key: "planned_quantity", label: "Planned" },
    { key: "produced_quantity", label: "Produced" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status" },
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredOrders, exportColumns, "production-planning");
    addToast("Exported products to Excel");
  };

  const handleExportPdf = () => {
    exportToPdf(filteredOrders, exportColumns, "Production Planning", "production-planning");
    addToast("Exported products to PDF");
  };

  const handleGlobalPrint = () => {
    setPrintDetailOrder(null);
    setTimeout(() => window.print(), 100);
  };

  const handleIndividualPrint = (order) => {
    setPrintDetailOrder(order);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintDetailOrder(null), 500);
    }, 150);
  };

  const columns = [
    { key: "order_number", label: "Order No" },
    { 
      key: "product_name", 
      label: "Product",
      render: (r) => (
        <span className="font-medium text-slate-900 print:text-black print:font-semibold">
          {r.product_name || "—"}
        </span>
      )
    },
    {
      key: "buyer_company",
      label: "Buyer Company",
      render: (r) => r.buyer_company || r.customer_name || "—",
    },
    {
      key: "size",
      label: "Size",
      render: (r) => r.size || "—",
    },
    { key: "planned_quantity", label: "Planned Quantity" },
    {
      key: "produced_quantity",
      label: "Produced",
      render: (r) => r.produced_quantity ?? 0,
    },
    {
      key: "balance_quantity",
      label: "Balance",
      render: (r) => Math.max((r.planned_quantity || 0) - (r.produced_quantity || 0), 0),
    },
    {
      key: "priority",
      label: "Priority",
      render: (r) => <PriorityPill priority={r.priority} />,
    },
    {
      key: "machine_name",
      label: "Machine",
      render: (r) => (
        <span className={r.machine_name && r.machine_name !== "—" && r.machine_name !== "Unassigned" ? "font-semibold text-slate-800" : "text-slate-400"}>
          {r.machine_name && r.machine_name !== "—" && r.machine_name !== "Unassigned" ? r.machine_name : "—"}
        </span>
      ),
    },
    { key: "shift", label: "Shift", render: (r) => typeof r.shift === "object" ? (r.shift?.label || r.shift?.id || "—") : (r.shift || "—") },
    {
      key: "start_date",
      label: "Start",
      render: (r) => formatDate(r.start_date),
    },
    {
      key: "due_date",
      label: "Due",
      render: (r) => formatDate(r.due_date),
    },
    {
      key: "progress",
      label: "Progress",
      sortable: false,
      printHidden: true,
      render: (r) => <ProgressCell row={r} />,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize print:border print:border-slate-300 ${
          r.is_delayed ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
        }`}>
          {r.is_delayed ? "delayed" : statusLabel(r.status)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      printHidden: true,
      render: (r) => {
        const shiftStr = typeof r.shift === "object" ? (r.shift?.label || r.shift?.id || "General") : (r.shift || "General");
        return (
          <div className="flex flex-wrap gap-1 text-xs print:hidden">
            <button type="button" title="View" onClick={() => openOrder(r)} className="font-semibold text-[#2563EB] hover:underline">👁 View</button>
            <Link to={`/production/create?id=${r.id}&product_id=${r.product_id || ""}&order_number=${encodeURIComponent(r.order_number || "")}&buyer_company=${encodeURIComponent(r.buyer_company || r.customer_name || "")}&operator_name=${encodeURIComponent(r.operator_name || "")}&operator_id=${encodeURIComponent(r.operator_id || "")}&bom_version=${encodeURIComponent(r.bom_version || "BOM v1.0")}&planned_quantity=${r.planned_quantity || ""}&produced_quantity=${r.produced_quantity ?? 0}&priority=${r.priority || "medium"}&shift=${encodeURIComponent(shiftStr)}&machine_id=${r.machine_id || ""}&start_date=${r.start_date || ""}&due_date=${r.due_date || ""}&size=${encodeURIComponent(r.size || "")}&status=${encodeURIComponent(r.status || "planned")}&progress=${calculateProgressPct(r)}`} className="font-semibold text-slate-600 hover:underline">✏ Edit</Link>
            <button type="button" onClick={() => handleIndividualPrint(r)} className="font-semibold text-slate-500 hover:underline">🖨 Print</button>
            {canStart(r.status) && (
              <button type="button" onClick={() => handleStartClick(r)} className="font-semibold text-green-700 hover:underline">▶ Start</button>
            )}
            {canPause(r.status) && (
              <button type="button" onClick={() => handlePause(r)} className="font-semibold text-amber-700 hover:underline">⏸ Pause</button>
            )}
            {(!r.machine_name || r.machine_name === "—" || r.machine_name === "Unassigned") && (
              <button type="button" onClick={() => setIssueModalOrder(r)} className="font-semibold text-cyan-700 hover:underline">📄 Work Order</button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) return <Loader label="Loading production planning..." />;

  return (
    <>
      <div className={`min-h-full pb-8 ${printDetailOrder ? "hidden print:hidden" : "print:p-0 print:space-y-4 print:block"}`} style={{ background: PAGE_BG }}>
        <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
          {/* Global Print-only Header */}
          <div className="hidden print:block mb-4 border-b pb-4">
            <h1 className="text-xl font-bold text-black">Production Planning Report</h1>
            <p className="text-xs text-slate-600">
              Generated on: {new Date().toLocaleDateString()} | Total Orders: {filteredOrders.length}
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv, .txt"
            className="hidden"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-[#1a1a1f]">Production Planning</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Plan, schedule, and monitor production orders across machines, materials, and operators.
              </p>
            </div>
            {!isOperator(user) && (
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={load}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e4e4ea] bg-white px-4 py-2 text-[13px] font-semibold text-[#1a1a1f] shadow-sm hover:bg-[#f3f3f6] transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-bold text-[#1a1a1f] shadow-sm hover:brightness-95 transition-all"
                  style={{ background: YELLOW }}
                >
                  <Plus className="h-4 w-4" />
                  New Production Order
                </button>
              </div>
            )}
          </div>

          <div className="print:hidden">
            <ManufacturingWorkflowBar currentStepId="production_planning" />
          </div>

          <div className="my-3 flex flex-wrap gap-2 print:hidden">
            <Link to="/production/mrp" className="ui-btn-secondary text-sm">Run MRP</Link>
            <Link to="/production/work-orders" className="ui-btn-secondary text-sm">Work Orders</Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8 print:hidden">
            <SummaryCard label="Total Orders" value={summary.total_orders} icon={ClipboardList} color="bg-[#2563EB]" />
            <SummaryCard label="Planned" value={summary.planned_orders} icon={FileText} color="bg-blue-500" />
            <SummaryCard label="In Progress" value={summary.in_progress_orders} icon={Play} color="bg-amber-500" />
            <SummaryCard label="Completed" value={summary.completed_orders} icon={CheckCircle2} color="bg-green-500" />
            <SummaryCard label="Delayed" value={summary.delayed_orders} icon={AlertTriangle} color="bg-red-500" />
            <SummaryCard label="Cancelled" value={summary.cancelled_orders} icon={Pause} color="bg-slate-500" />
            <SummaryCard label="Today's Target" value={summary.todays_target?.toLocaleString?.() ?? summary.todays_target} icon={ClipboardList} color="bg-indigo-500" />
            <SummaryCard
              label="Today's Production"
              value={summary.todays_production?.toLocaleString?.() ?? summary.todays_production}
              icon={CheckCircle2}
              color="bg-teal-500"
              onClick={showTodayStartOrders}
            />
          </div>

          {/* Main Container */}
          <div className="rounded-xl border border-[#e4e4ea] bg-white p-4 shadow-sm sm:p-5 print:p-0 print:border-none print:shadow-none">
            {/* Action Bar */}
            <div className="mb-4 flex flex-wrap items-center gap-2.5 print:hidden">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa5]" />
                <input
                  type="search"
                  placeholder="Search production orders..."
                  value={filters.order_number || filters.product || ""}
                  onChange={(e) => setFilters((f) => ({ ...f, order_number: e.target.value, product: e.target.value }))}
                  className="w-full rounded-full border border-[#e8e8ee] bg-[#f3f3f6] py-2.5 pl-10 pr-4 text-[13px] outline-none placeholder:text-[#a0a0ab] focus:border-[#d0d0d8] focus:bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e4ea] bg-[#f3f3f6] px-3.5 py-2.5 text-[13px] font-semibold text-[#1a1a1f] hover:bg-[#ececf0]"
              >
                {showAdvanced ? "Hide Filters" : "Advanced Filters"}
              </button>
              <button
                type="button"
                onClick={handleImportFileClick}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e4ea] bg-[#f3f3f6] px-3.5 py-2.5 text-[13px] font-semibold text-[#1a1a1f] hover:bg-[#ececf0]"
              >
                <Upload className="h-4 w-4" />
                Import
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e4ea] bg-[#f3f3f6] px-3.5 py-2.5 text-[13px] font-semibold text-[#1a1a1f] hover:bg-[#ececf0]"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e4ea] bg-[#f3f3f6] px-3.5 py-2.5 text-[13px] font-semibold text-[#1a1a1f] hover:bg-[#ececf0]"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </button>
              <button
                type="button"
                onClick={handleGlobalPrint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e4ea] bg-[#f3f3f6] px-3.5 py-2.5 text-[13px] font-semibold text-[#1a1a1f] hover:bg-[#ececf0]"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>

            {showAdvanced && (
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 print:hidden">
                <input placeholder="Order No." value={filters.order_number} onChange={(e) => setFilters((f) => ({ ...f, order_number: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
                <input placeholder="Product" value={filters.product} onChange={(e) => setFilters((f) => ({ ...f, product: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
                <input placeholder="Customer" value={filters.customer} onChange={(e) => setFilters((f) => ({ ...f, customer: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
                <input placeholder="Work Order" value={filters.work_order} onChange={(e) => setFilters((f) => ({ ...f, work_order: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
                <input placeholder="Machine" value={filters.machine} onChange={(e) => setFilters((f) => ({ ...f, machine: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
                <select value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm">
                  <option value="">Department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={filters.shift} onChange={(e) => setFilters((f) => ({ ...f, shift: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm">
                  <option value="">Shift</option>
                  {SHIFTS.map((s) => {
                    const id = typeof s === "object" ? s.id : s;
                    const label = typeof s === "object" ? s.label : s;
                    return <option key={id} value={id}>{label}</option>;
                  })}
                </select>
                <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm">
                  <option value="">Priority</option>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm">
                  <option value="">Status</option>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
                <input type="date" value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
                <input type="date" value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
                <button type="button" onClick={() => setFilters(defaultFilters)} className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Clear</button>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-[#ececf0] print:w-full print:border-none">
              <DataTable
                columns={columns}
                data={paginatedOrders}
                showSearch={false}
                pagination={false}
                emptyState={
                  <div className="py-12 text-center">
                    <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-4 text-sm font-medium text-slate-600">No production orders found.</p>
                    {!isOperator(user) && (
                      <button type="button" onClick={() => setShowCreateModal(true)} className="ui-btn-primary mt-4 inline-flex print:hidden">
                        Create Production Order
                      </button>
                    )}
                  </div>
                }
              />
            </div>

            {/* Pagination Controls like Customers Page */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#6b6b76] print:hidden">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded border border-[#e2e2e8] bg-white px-2 py-1 outline-none"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span>{total === 0 ? "0-0 of 0" : `${from}-${to} of ${total}`}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="grid h-8 w-8 place-items-center rounded border border-[#e2e2e8] bg-white disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="grid h-8 min-w-8 place-items-center rounded border border-[#e0b400] px-2 text-[13px] font-semibold"
                  style={{ background: "#fff2b8" }}
                >
                  {page}
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="grid h-8 w-8 place-items-center rounded border border-[#e2e2e8] bg-white disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="print:hidden">
            <ManufacturingWorkflowBar currentStepId="production_planning" compact />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 print:hidden">
            <p className="mb-2 text-xs font-semibold text-slate-500">Status Flow</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FLOW.map((s, i) => (
                <span key={s} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">{s}</span>
                  {i < STATUS_FLOW.length - 1 && <span className="text-slate-300">↓</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Single Item Print View */}
      {printDetailOrder && (
        <div className="hidden print:block p-8 bg-white text-black h-screen">
          <div className="flex justify-between items-center mb-5 text-xs text-slate-600">
            <div>
              <span className="font-bold text-blue-600 text-xs tracking-wide">Production</span>
              {(user?.full_name || user?.name) && <span className="ml-2.5 text-slate-600">Welcome, {user.full_name || user.name}</span>}
            </div>
            <span className="font-bold text-blue-600 text-xs tracking-wide">GNS Insights</span>
          </div>
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <h1 className="print-title text-4xl font-black uppercase tracking-wide text-black">Production Order Details</h1>
            <p className="text-sm text-slate-500 mt-1">Order # {printDetailOrder.order_number} | Printed on {new Date().toLocaleDateString()} {(user?.full_name || user?.name) ? `| By: ${user.full_name || user.name}` : ""}</p>
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-8">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Product Information</p>
              <p className="text-xl font-bold text-slate-900">{printDetailOrder.product_name || "—"}</p>
              <p className="text-sm text-slate-700 mt-1">BOM Version: {printDetailOrder.bom_version || "Default"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Customer</p>
              <p className="text-lg font-medium text-slate-800">{printDetailOrder.customer_name || "Internal"}</p>
            </div>
            
            <div className="col-span-2 border-t border-slate-200 pt-6"></div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority & Status</p>
              <div className="flex items-center gap-4 mt-1">
                <PriorityPill priority={printDetailOrder.priority} />
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize border border-slate-300`}>
                  {printDetailOrder.is_delayed ? "delayed" : statusLabel(printDetailOrder.status)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Production Quantities</p>
              <div className="grid grid-cols-3 gap-4 mt-1">
                <div>
                  <span className="block text-xl font-bold">{printDetailOrder.planned_quantity}</span>
                  <span className="text-xs text-slate-500">Planned</span>
                </div>
                <div>
                  <span className="block text-xl font-bold">{printDetailOrder.produced_quantity || 0}</span>
                  <span className="text-xs text-slate-500">Produced</span>
                </div>
                <div>
                  <span className="block text-xl font-bold">{Math.max((printDetailOrder.planned_quantity || 0) - (printDetailOrder.produced_quantity || 0), 0)}</span>
                  <span className="text-xs text-slate-500">Balance</span>
                </div>
              </div>
            </div>

            <div className="col-span-2 border-t border-slate-200 pt-6"></div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Schedule</p>
              <p className="text-sm"><span className="font-medium">Start:</span> {formatDate(printDetailOrder.start_date)}</p>
              <p className="text-sm mt-1"><span className="font-medium">Due:</span> {formatDate(printDetailOrder.due_date)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assignment</p>
              <p className="text-sm"><span className="font-medium">Machine:</span> {printDetailOrder.machine_name || "Unassigned"}</p>
              <p className="text-sm mt-1"><span className="font-medium">Shift:</span> {typeof printDetailOrder.shift === "object" ? (printDetailOrder.shift?.label || printDetailOrder.shift?.id || "—") : (printDetailOrder.shift || "—")}</p>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <ProductionOrderDetailModal
          order={selected}
          detail={detail}
          onClose={() => { setSelected(null); setDetail(null); }}
          onStart={handleStartClick}
          onPause={handlePause}
          onComplete={handleComplete}
          onQuickWorkOrder={(o) => setQuickWoOrder(o)}
        />
      )}

      {startModal && (
        <StartCheckModal
          order={startModal}
          checks={startChecks}
          onClose={() => setStartModal(null)}
          onConfirm={confirmStart}
          loading={startLoading}
        />
      )}

      {completeModal && (
        <CompleteWorkflowModal
          order={completeModal}
          steps={completeSteps}
          onClose={() => setCompleteModal(null)}
        />
      )}

      {quickWoOrder && (
        <QuickWorkOrderModal
          order={quickWoOrder}
          onClose={() => setQuickWoOrder(null)}
          onSuccess={() => load()}
          addToast={addToast}
        />
      )}

      {issueModalOrder && (
        <IssueMaterialsModal
          workOrder={issueModalOrder}
          onClose={() => setIssueModalOrder(null)}
          onSuccess={() => load()}
          addToast={addToast}
        />
      )}

      {createdToastOrder && (
        <OrderCreatedToast
          order={createdToastOrder}
          onClose={() => setCreatedToastOrder(null)}
        />
      )}

      <CreateProductionOrderModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        machines={machines}
        onCreated={(newOrder) => {
          addToast("Production order created!", "success");
          setCreatedToastOrder(newOrder);
          load();
        }}
      />

      {/* Global CSS for Print Optimization */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 4mm;
          }
          *, *::before, *::after {
            box-shadow: none !important;
            text-shadow: none !important;
            scrollbar-width: none !important;
          }
          *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          html, body, #root {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background-color: #fff !important;
            color: #000 !important;
          }
          div, section, article, main, table, .overflow-x-auto {
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          body * {
            background-color: #fff !important;
            background: transparent !important;
            color: #000 !important;
            font-size: 10px !important;
            font-weight: 400 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
            table-layout: auto !important;
            margin: 0 !important;
          }
          th {
            border: 1px solid #cbd5e1 !important;
            padding: 4px 6px !important;
            white-space: normal !important;
            word-break: break-word !important;
            background-color: #f8fafc !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            text-align: left !important;
          }
          td {
            border: 1px solid #cbd5e1 !important;
            padding: 4px 6px !important;
            white-space: normal !important;
            word-break: break-word !important;
            font-size: 10px !important;
            vertical-align: middle !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          h1, .print-title, .title {
            font-size: 28px !important;
            font-weight: 900 !important;
            text-transform: uppercase !important;
            line-height: 1.2 !important;
            margin-bottom: 4px !important;
          }
          .print\\:hidden, th.print\\:hidden, td.print\\:hidden, [class*="print:hidden"] {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}