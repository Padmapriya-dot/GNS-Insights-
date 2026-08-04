import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Pencil, Send, CheckCircle } from "lucide-react";

import { createProductionOrder, getMachines } from "../../api/productionApi";
import { createTask } from "../../api/tasksApi";
import { createNotification } from "../../api/notificationService";
import { getEmployees } from "../../api/hrApi";
import { fetchProductsWithFallback } from "../../utils/productOptions";
import useTenantId from "../../hooks/useTenantId";
import { PRIORITIES, SHIFTS } from "../../data/productionPlanningMasterData";

const YELLOW = "#F5C518";

const inputClassModal =
  "w-full rounded-lg border border-[#dcdce3] bg-white px-3 py-2.5 text-[13px] text-[#1a1a1f] placeholder:text-[#a0a0ab] focus:border-[#c4b5fd] focus:outline-none focus:ring-1 focus:ring-[#c4b5fd]";
const selectClassModal =
  "w-full rounded-lg border border-[#dcdce3] bg-white px-3 py-2.5 text-[13px] text-[#1a1a1f] focus:border-[#c4b5fd] focus:outline-none focus:ring-1 focus:ring-[#c4b5fd]";

/* ─── Generic Sub-Modal Container ─── */
function SectionSubModal({ open, onClose, title, children, onSave }) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#ececf0] bg-white px-5 py-4">
          <h2 className="text-[17px] font-bold text-[#1a1a1f]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#9a9aa5] hover:bg-[#f5f5f7]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 bg-[#f3f3f6] px-5 py-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#ececf0] bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#eff0f4] py-2.5 text-[14px] font-semibold text-[#1a1a1f] hover:bg-[#e4e5eb] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave?.();
              onClose?.();
            }}
            className="rounded-xl py-2.5 text-[14px] font-semibold text-[#1a1a1f] transition-colors hover:brightness-95"
            style={{ background: YELLOW }}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ModalField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-[#8a8a95]">
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-400 transition-colors";
const INPUT_ERR_CLS =
  "w-full rounded-lg border border-red-300 bg-white px-4 py-2.5 text-[13px] text-gray-900 outline-none focus:border-red-400 transition-colors";
const SELECT_CLS =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-900 outline-none focus:border-gray-400 transition-colors appearance-none";

export default function CreateProduction() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("id") || "";
  const prefilledOrderNumber = searchParams.get("order_number") || "";
  const isEditing = Boolean(editId || prefilledOrderNumber);

  const [products, setProducts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [form, setForm] = useState({
    id: null,
    product_id: searchParams.get("product_id") || "",
    order_number: prefilledOrderNumber || `PO-${Date.now().toString().slice(-4)}`,
    buyer_company: "",
    customer_name: "",
    machine_id: "",
    planned_quantity: "",
    produced_quantity: "0",
    priority: "medium",
    shift: "General",
    status: "planned",
    start_date: "",
    due_date: "",
    operator_name: "",
    operator_id: "",
    bom_version: "BOM v1.0",
    size: "",
    face_paper_mill_grade: "",
    face_paper_paper: "",
    face_paper_thick_microns: "",
    face_paper_gsm: "",
    coating_quality: "",
    coating_mill_grade: "",
    coating_cra_pct: "",
    coating_colour: "",
    coating_gsm: "",
    coating_width_mm: "",
    release_size_nos: "",
    release_stocks_nos: "",
    release_gsm_sqmtrs: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successOrder, setSuccessOrder] = useState(null);

  const [facePaperModalOpen, setFacePaperModalOpen] = useState(false);
  const [coatingModalOpen, setCoatingModalOpen] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [additionalModalOpen, setAdditionalModalOpen] = useState(false);

  const [tempFacePaper, setTempFacePaper] = useState({});
  const [tempCoating, setTempCoating] = useState({});
  const [tempRelease, setTempRelease] = useState({});
  const [tempSchedule, setTempSchedule] = useState({});
  const [tempAdditional, setTempAdditional] = useState({});

  useEffect(() => {
    setLoadingProducts(true);
    Promise.all([
      fetchProductsWithFallback().catch(() => []),
      getMachines().catch(() => ({ data: [] })),
      getEmployees().catch(() => ({ data: [] })),
    ])
      .then(([pRes, mRes, eRes]) => {
        const rawProducts = Array.isArray(pRes) ? pRes : pRes?.data || [];
        setProducts(rawProducts);
        setMachines(mRes?.data || mRes || []);
        setEmployees(eRes?.data || eRes || []);
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.product_id) errs.product_id = "Please select a product.";
    if (!form.planned_quantity || Number(form.planned_quantity) <= 0) errs.planned_quantity = "Planned quantity must be > 0.";
    if (!form.order_number.trim()) errs.order_number = "Order number required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = { ...form, tenant_id: tenantId };
    try {
      await createProductionOrder(payload);
      setSuccessOrder(payload);
    } catch {
      setError("Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  const backTo = "/production/planning";

  if (successOrder) {
    return (
      <div className="mx-auto max-w-lg p-6 mt-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Created!</h2>
        <button onClick={() => setSuccessOrder(null)} className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-full">Create Another</button>
      </div>
    );
  }

  const hasFacePaper = Boolean(form.face_paper_mill_grade || form.face_paper_paper || form.face_paper_thick_microns || form.face_paper_gsm);
  const hasCoating = Boolean(form.coating_quality || form.coating_mill_grade || form.coating_cra_pct || form.coating_colour || form.coating_gsm || form.coating_width_mm);
  const hasRelease = Boolean(form.release_size_nos || form.release_stocks_nos || form.release_gsm_sqmtrs);
  const hasSchedule = Boolean(form.start_date || form.due_date);
  const hasAdditional = Boolean(form.operator_name || form.operator_id || form.bom_version || form.size);

  return (
    <>
      <div className="min-h-screen bg-slate-100/60 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100"
          >
            {/* ── Form Header ─────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? "Edit Production Order" : "Create Production Order"}
              </h2>
              <Link
                to={backTo}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </Link>
            </div>

            <div className="px-6 py-6 space-y-4">
              {/* ── Row 1: Job Date / Order No & Customer Name ───── */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                    Job Date / Order No.
                  </label>
                  <input
                    id="order_number"
                    type="text"
                    name="order_number"
                    value={form.order_number}
                    onChange={handleChange}
                    required
                    placeholder="e.g. PO-2024-001"
                    className={fieldErrors.order_number ? INPUT_ERR_CLS : INPUT_CLS}
                  />
                  {fieldErrors.order_number && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.order_number}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="buyer_company"
                    value={form.buyer_company}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              {/* ── Product Code ─────────────────────────────────── */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                  Product Code <span className="text-red-500">*</span>
                </label>
                <select
                  id="product_id"
                  name="product_id"
                  value={form.product_id}
                  onChange={handleChange}
                  required
                  disabled={loadingProducts}
                  className={`${SELECT_CLS} ${fieldErrors.product_id ? "border-red-300" : ""}`}
                >
                  <option value="">
                    {loadingProducts ? "Loading products…" : "Select product code"}
                  </option>
                  {products.map((p) => {
                    const code =
                      p.product_code || p.sku || p.code || (p.id ? `PRD${String(p.id).padStart(3, "0")}` : "");
                    return (
                      <option key={p.id} value={p.id}>
                        {code ? `${code} – ` : ""}{p.name}
                      </option>
                    );
                  })}
                </select>
                {fieldErrors.product_id && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.product_id}</p>
                )}
                {products.length === 0 && !loadingProducts && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    No products found. Please add products first via Masters → Products.
                  </p>
                )}
              </div>

              {/* ── Machine Name (AWB / WBHM) ───────────────────── */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                  Machine Name (AWB / WBHM)
                </label>
                <select
                  name="machine_id"
                  value={form.machine_id}
                  onChange={handleChange}
                  className={SELECT_CLS}
                >
                  <option value="">Select machine (optional)</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.machine_name || `Machine ${m.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Operator Name & Operator ID ─────────────────── */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                    Operator Name
                  </label>
                  {employees.length > 0 ? (
                    <select
                      name="operator_name"
                      value={form.operator_name}
                      onChange={(e) => {
                        const emp = employees.find(
                          (x) => x.full_name === e.target.value || String(x.id) === e.target.value
                        );
                        setForm((prev) => ({
                          ...prev,
                          operator_name: emp?.full_name || e.target.value,
                          operator_id: emp
                            ? String(emp.employee_id || emp.id || "")
                            : prev.operator_id,
                        }));
                      }}
                      className={SELECT_CLS}
                    >
                      <option value="">Select operator</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.full_name}>
                          {emp.full_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="operator_name"
                      value={form.operator_name}
                      onChange={handleChange}
                      placeholder="e.g. Ravi Kumar"
                      className={INPUT_CLS}
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                    Operator ID
                  </label>
                  <input
                    type="text"
                    name="operator_id"
                    value={form.operator_id}
                    onChange={handleChange}
                    placeholder="e.g. EMP-1042"
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              {/* ── Planned & Output Quantities ──────────────────── */}
              <div className="grid gap-3 sm:grid-cols-2 pt-1">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                    Planned Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="planned_quantity"
                    value={form.planned_quantity}
                    onChange={handleChange}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 100"
                    className={fieldErrors.planned_quantity ? INPUT_ERR_CLS : INPUT_CLS}
                  />
                  {fieldErrors.planned_quantity && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.planned_quantity}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                    Output Quantity
                  </label>
                  <input
                    type="number"
                    name="produced_quantity"
                    value={form.produced_quantity}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g. 0"
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              {/* ── Priority, Shift, Status ──────────────────────── */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className={SELECT_CLS}
                  >
                    {(PRIORITIES || ["low", "medium", "high", "critical"]).map((p) => (
                      <option key={p} value={p} className="capitalize">
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">Shift</label>
                  <select
                    name="shift"
                    value={form.shift}
                    onChange={handleChange}
                    className={SELECT_CLS}
                  >
                    {(SHIFTS || []).map((s) => {
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
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={SELECT_CLS}
                  >
                    {["planned", "draft", "material_ready", "in_progress", "completed", "cancelled"].map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── SECTION ROW 1: Face Paper Details ─────────────── */}
              <div className="mt-4 border-t border-[#ececf0] pt-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1a1a1f]">Face Paper Details</p>
                    <p className="truncate text-[12px] text-[#6b6b76]">
                      Mill Grade, Paper, Thick in Microns, GSM
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempFacePaper({
                        face_paper_mill_grade: form.face_paper_mill_grade,
                        face_paper_paper: form.face_paper_paper,
                        face_paper_thick_microns: form.face_paper_thick_microns,
                        face_paper_gsm: form.face_paper_gsm,
                      });
                      setFacePaperModalOpen(true);
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#f4c116] px-3.5 py-1.5 text-[12px] font-semibold text-[#1a1a1f] hover:bg-[#ffe885] transition-colors"
                    style={{ background: "#fff2b8" }}
                  >
                    {hasFacePaper ? <Pencil className="h-3.5 w-3.5 text-[#1a1a1f]" /> : <Plus className="h-3.5 w-3.5" />}
                    {hasFacePaper ? "Edit" : "Add"}
                  </button>
                </div>
                {hasFacePaper && (
                  <div className="mt-2.5 flex flex-wrap gap-2 rounded-lg border border-[#e8e8ee] bg-[#fafafa] px-3 py-2 text-[12px] text-[#4a4a55]">
                    {form.face_paper_mill_grade && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Mill Grade: <strong>{form.face_paper_mill_grade}</strong>
                      </span>
                    )}
                    {form.face_paper_paper && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Paper: <strong>{form.face_paper_paper}</strong>
                      </span>
                    )}
                    {form.face_paper_thick_microns && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Thick: <strong>{form.face_paper_thick_microns} µm</strong>
                      </span>
                    )}
                    {form.face_paper_gsm && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        GSM: <strong>{form.face_paper_gsm}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ── SECTION ROW 2: Coating / Adhesive Details ────── */}
              <div className="mt-2 border-t border-[#ececf0] pt-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1a1a1f]">Coating / Adhesive Details</p>
                    <p className="truncate text-[12px] text-[#6b6b76]">
                      Quality, Mill Grade, CRA %, Colour, GSM, Width
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempCoating({
                        coating_quality: form.coating_quality,
                        coating_mill_grade: form.coating_mill_grade,
                        coating_cra_pct: form.coating_cra_pct,
                        coating_colour: form.coating_colour,
                        coating_gsm: form.coating_gsm,
                        coating_width_mm: form.coating_width_mm,
                      });
                      setCoatingModalOpen(true);
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#f4c116] px-3.5 py-1.5 text-[12px] font-semibold text-[#1a1a1f] hover:bg-[#ffe885] transition-colors"
                    style={{ background: "#fff2b8" }}
                  >
                    {hasCoating ? <Pencil className="h-3.5 w-3.5 text-[#1a1a1f]" /> : <Plus className="h-3.5 w-3.5" />}
                    {hasCoating ? "Edit" : "Add"}
                  </button>
                </div>
                {hasCoating && (
                  <div className="mt-2.5 flex flex-wrap gap-2 rounded-lg border border-[#e8e8ee] bg-[#fafafa] px-3 py-2 text-[12px] text-[#4a4a55]">
                    {form.coating_quality && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Quality: <strong>{form.coating_quality}</strong>
                      </span>
                    )}
                    {form.coating_mill_grade && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Mill Grade: <strong>{form.coating_mill_grade}</strong>
                      </span>
                    )}
                    {form.coating_cra_pct && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        CRA: <strong>{form.coating_cra_pct}%</strong>
                      </span>
                    )}
                    {form.coating_colour && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Colour: <strong>{form.coating_colour}</strong>
                      </span>
                    )}
                    {form.coating_gsm && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        GSM: <strong>{form.coating_gsm}</strong>
                      </span>
                    )}
                    {form.coating_width_mm && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Width: <strong>{form.coating_width_mm} mm</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ── SECTION ROW 3: Release Details ───────────────── */}
              <div className="mt-2 border-t border-[#ececf0] pt-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1a1a1f]">Release Details</p>
                    <p className="truncate text-[12px] text-[#6b6b76]">
                      Size (in No.s), Stocks (in No.s), GSM (in sq.mtrs)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempRelease({
                        release_size_nos: form.release_size_nos,
                        release_stocks_nos: form.release_stocks_nos,
                        release_gsm_sqmtrs: form.release_gsm_sqmtrs,
                      });
                      setReleaseModalOpen(true);
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#f4c116] px-3.5 py-1.5 text-[12px] font-semibold text-[#1a1a1f] hover:bg-[#ffe885] transition-colors"
                    style={{ background: "#fff2b8" }}
                  >
                    {hasRelease ? <Pencil className="h-3.5 w-3.5 text-[#1a1a1f]" /> : <Plus className="h-3.5 w-3.5" />}
                    {hasRelease ? "Edit" : "Add"}
                  </button>
                </div>
                {hasRelease && (
                  <div className="mt-2.5 flex flex-wrap gap-2 rounded-lg border border-[#e8e8ee] bg-[#fafafa] px-3 py-2 text-[12px] text-[#4a4a55]">
                    {form.release_size_nos && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Size: <strong>{form.release_size_nos}</strong>
                      </span>
                    )}
                    {form.release_stocks_nos && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Stocks: <strong>{form.release_stocks_nos}</strong>
                      </span>
                    )}
                    {form.release_gsm_sqmtrs && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        GSM: <strong>{form.release_gsm_sqmtrs} sq.mtrs</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ── SECTION ROW 4: Schedule ───────────────────────── */}
              <div className="mt-2 border-t border-[#ececf0] pt-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1a1a1f]">Schedule</p>
                    <p className="truncate text-[12px] text-[#6b6b76]">
                      Start Date, Due Date
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempSchedule({
                        start_date: form.start_date,
                        due_date: form.due_date,
                      });
                      setScheduleModalOpen(true);
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#f4c116] px-3.5 py-1.5 text-[12px] font-semibold text-[#1a1a1f] hover:bg-[#ffe885] transition-colors"
                    style={{ background: "#fff2b8" }}
                  >
                    {hasSchedule ? <Pencil className="h-3.5 w-3.5 text-[#1a1a1f]" /> : <Plus className="h-3.5 w-3.5" />}
                    {hasSchedule ? "Edit" : "Add"}
                  </button>
                </div>
                {hasSchedule && (
                  <div className="mt-2.5 flex flex-wrap gap-2 rounded-lg border border-[#e8e8ee] bg-[#fafafa] px-3 py-2 text-[12px] text-[#4a4a55]">
                    {form.start_date && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Start: <strong>{form.start_date.replace("T", " ")}</strong>
                      </span>
                    )}
                    {form.due_date && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Due: <strong>{form.due_date.replace("T", " ")}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ── SECTION ROW 5: Additional Details ────────────── */}
              <div className="mt-2 border-t border-[#ececf0] pt-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1a1a1f]">Additional Details</p>
                    <p className="truncate text-[12px] text-[#6b6b76]">
                      BOM Version, Size
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempAdditional({
                        bom_version: form.bom_version,
                        size: form.size,
                      });
                      setAdditionalModalOpen(true);
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#f4c116] px-3.5 py-1.5 text-[12px] font-semibold text-[#1a1a1f] hover:bg-[#ffe885] transition-colors"
                    style={{ background: "#fff2b8" }}
                  >
                    {hasAdditional ? <Pencil className="h-3.5 w-3.5 text-[#1a1a1f]" /> : <Plus className="h-3.5 w-3.5" />}
                    {hasAdditional ? "Edit" : "Add"}
                  </button>
                </div>
                {hasAdditional && (
                  <div className="mt-2.5 flex flex-wrap gap-2 rounded-lg border border-[#e8e8ee] bg-[#fafafa] px-3 py-2 text-[12px] text-[#4a4a55]">
                    {form.bom_version && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        BOM: <strong>{form.bom_version}</strong>
                      </span>
                    )}
                    {form.size && (
                      <span className="rounded bg-white px-2 py-0.5 border border-[#dcdce3]">
                        Size: <strong>{form.size}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
            </div>

            {/* ── Footer Buttons ──────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-6 py-4">
              <Link
                to={backTo}
                className="flex items-center justify-center rounded-xl bg-[#eff0f4] py-3 text-[15px] font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || loadingProducts}
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-bold text-gray-900 shadow-sm disabled:opacity-50 transition-colors"
                style={{ background: YELLOW }}
              >
                <Send className="h-4 w-4" />
                {saving ? "Saving…" : isEditing ? "Update Order" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── SUB-MODAL 1: Face Paper Details ── */}
      <SectionSubModal
        open={facePaperModalOpen}
        onClose={() => setFacePaperModalOpen(false)}
        title={hasFacePaper ? "Edit Face Paper Details" : "Add Face Paper Details"}
        onSave={() => setForm((prev) => ({ ...prev, ...tempFacePaper }))}
      >
        <ModalField label="Mill Grade">
          <input
            type="text"
            value={tempFacePaper.face_paper_mill_grade || ""}
            onChange={(e) => setTempFacePaper((p) => ({ ...p, face_paper_mill_grade: e.target.value }))}
            placeholder="e.g. Cosmos"
            className={inputClassModal}
          />
        </ModalField>
        <ModalField label="Paper">
          <input
            type="text"
            value={tempFacePaper.face_paper_paper || ""}
            onChange={(e) => setTempFacePaper((p) => ({ ...p, face_paper_paper: e.target.value }))}
            placeholder="e.g. PPS(TC)"
            className={inputClassModal}
          />
        </ModalField>
        <ModalField label="Thick in Microns">
          <input
            type="number"
            value={tempFacePaper.face_paper_thick_microns || ""}
            onChange={(e) => setTempFacePaper((p) => ({ ...p, face_paper_thick_microns: e.target.value }))}
            placeholder="e.g. 51"
            className={inputClassModal}
          />
        </ModalField>
        <ModalField label="GSM">
          <input
            type="number"
            value={tempFacePaper.face_paper_gsm || ""}
            onChange={(e) => setTempFacePaper((p) => ({ ...p, face_paper_gsm: e.target.value }))}
            placeholder="e.g. 14"
            className={inputClassModal}
          />
        </ModalField>
      </SectionSubModal>

      {/* ── SUB-MODAL 2: Coating / Adhesive Details ── */}
      <SectionSubModal
        open={coatingModalOpen}
        onClose={() => setCoatingModalOpen(false)}
        title={hasCoating ? "Edit Coating / Adhesive Details" : "Add Coating / Adhesive Details"}
        onSave={() => setForm((prev) => ({ ...prev, ...tempCoating }))}
      >
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Quality">
            <input
              type="number"
              value={tempCoating.coating_quality || ""}
              onChange={(e) => setTempCoating((p) => ({ ...p, coating_quality: e.target.value }))}
              placeholder="e.g. 530"
              className={inputClassModal}
            />
          </ModalField>
          <ModalField label="Mill Grade">
            <input
              type="text"
              value={tempCoating.coating_mill_grade || ""}
              onChange={(e) => setTempCoating((p) => ({ ...p, coating_mill_grade: e.target.value }))}
              placeholder="e.g. POLYPLEX"
              className={inputClassModal}
            />
          </ModalField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="CRA %">
            <input
              type="number"
              step="0.1"
              value={tempCoating.coating_cra_pct || ""}
              onChange={(e) => setTempCoating((p) => ({ ...p, coating_cra_pct: e.target.value }))}
              placeholder="e.g. 17.5"
              className={inputClassModal}
            />
          </ModalField>
          <ModalField label="Colour">
            <input
              type="text"
              value={tempCoating.coating_colour || ""}
              onChange={(e) => setTempCoating((p) => ({ ...p, coating_colour: e.target.value }))}
              placeholder="e.g. WHITE"
              className={inputClassModal}
            />
          </ModalField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="GSM">
            <input
              type="number"
              value={tempCoating.coating_gsm || ""}
              onChange={(e) => setTempCoating((p) => ({ ...p, coating_gsm: e.target.value }))}
              placeholder="e.g. 30"
              className={inputClassModal}
            />
          </ModalField>
          <ModalField label="Width (mm)">
            <input
              type="number"
              value={tempCoating.coating_width_mm || ""}
              onChange={(e) => setTempCoating((p) => ({ ...p, coating_width_mm: e.target.value }))}
              placeholder="e.g. 1000"
              className={inputClassModal}
            />
          </ModalField>
        </div>
      </SectionSubModal>

      {/* ── SUB-MODAL 3: Release Details ── */}
      <SectionSubModal
        open={releaseModalOpen}
        onClose={() => setReleaseModalOpen(false)}
        title={hasRelease ? "Edit Release Details" : "Add Release Details"}
        onSave={() => setForm((prev) => ({ ...prev, ...tempRelease }))}
      >
        <ModalField label="Size (in No.s)">
          <input
            type="number"
            value={tempRelease.release_size_nos || ""}
            onChange={(e) => setTempRelease((p) => ({ ...p, release_size_nos: e.target.value }))}
            placeholder="e.g. 500"
            className={inputClassModal}
          />
        </ModalField>
        <ModalField label="Stocks (in No.s)">
          <input
            type="number"
            value={tempRelease.release_stocks_nos || ""}
            onChange={(e) => setTempRelease((p) => ({ ...p, release_stocks_nos: e.target.value }))}
            placeholder="e.g. 1"
            className={inputClassModal}
          />
        </ModalField>
        <ModalField label="GSM (in sq.mtrs)">
          <input
            type="number"
            value={tempRelease.release_gsm_sqmtrs || ""}
            onChange={(e) => setTempRelease((p) => ({ ...p, release_gsm_sqmtrs: e.target.value }))}
            placeholder="e.g. 500"
            className={inputClassModal}
          />
        </ModalField>
      </SectionSubModal>

      {/* ── SUB-MODAL 4: Schedule ── */}
      <SectionSubModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={hasSchedule ? "Edit Schedule" : "Add Schedule"}
        onSave={() => setForm((prev) => ({ ...prev, ...tempSchedule }))}
      >
        <ModalField label="Start Date & Time">
          <input
            type="datetime-local"
            value={tempSchedule.start_date || ""}
            onChange={(e) => setTempSchedule((p) => ({ ...p, start_date: e.target.value }))}
            className={inputClassModal}
            style={{ colorScheme: "light" }}
          />
        </ModalField>
        <ModalField label="Due Date & Time">
          <input
            type="datetime-local"
            value={tempSchedule.due_date || ""}
            onChange={(e) => setTempSchedule((p) => ({ ...p, due_date: e.target.value }))}
            className={inputClassModal}
            style={{ colorScheme: "light" }}
          />
        </ModalField>
      </SectionSubModal>

      {/* ── SUB-MODAL 5: Additional Details ── */}
      <SectionSubModal
        open={additionalModalOpen}
        onClose={() => setAdditionalModalOpen(false)}
        title={hasAdditional ? "Edit Additional Details" : "Add Additional Details"}
        onSave={() => setForm((prev) => ({ ...prev, ...tempAdditional }))}
      >
        <ModalField label="BOM Version">
          <input
            type="text"
            value={tempAdditional.bom_version || ""}
            onChange={(e) => setTempAdditional((p) => ({ ...p, bom_version: e.target.value }))}
            placeholder="e.g. BOM v1.0"
            className={inputClassModal}
          />
        </ModalField>
        <ModalField label="Size">
          <input
            type="text"
            value={tempAdditional.size || ""}
            onChange={(e) => setTempAdditional((p) => ({ ...p, size: e.target.value }))}
            placeholder="e.g. Large, 42, XL"
            className={inputClassModal}
          />
        </ModalField>
      </SectionSubModal>
    </>
  );
}