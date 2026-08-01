import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, ChevronUp, CheckCircle, Send, ClipboardList, Bell } from "lucide-react";

import ManufacturingWorkflowBar from "../../components/manufacturing/ManufacturingWorkflowBar";
import { createProductionOrder, getMachines } from "../../api/productionApi";
import { createTask } from "../../api/tasksApi";
import { createNotification } from "../../api/notificationService";
import { getEmployees } from "../../api/hrApi";
import { fetchProductsWithFallback } from "../../utils/productOptions";
import useTenantId from "../../hooks/useTenantId";
import { PRIORITIES, SHIFTS } from "../../data/productionPlanningMasterData";



/* ─── Collapsible Section ─────────────────────────────────────────────────── */
function CollapsibleSection({ title, subtitle, expanded, onToggle, children }) {
  return (
    <div className="border-t border-gray-100 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="ml-4 flex items-center gap-1.5 rounded-full border border-[#F5C518] bg-white px-4 py-1.5 text-[13px] font-semibold text-gray-800 hover:bg-yellow-50 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="h-3.5 w-3.5" /> Hide</>
          ) : (
            <><Plus className="h-3.5 w-3.5" /> Add</>
          )}
        </button>
      </div>
      {expanded && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Field Component ─────────────────────────────────────────────────────── */
function Field({ label, required, error, children, fullWidth = false }) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-full border border-gray-200 bg-[#F5F5F5] px-4 py-2.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-400 focus:bg-white transition-colors";
const INPUT_ERR_CLS =
  "w-full rounded-full border border-red-300 bg-[#F5F5F5] px-4 py-2.5 text-[13px] text-gray-900 outline-none focus:border-red-400 focus:bg-white transition-colors";
const SELECT_CLS =
  "w-full rounded-full border border-gray-200 bg-[#F5F5F5] px-4 py-2.5 text-[13px] text-gray-900 outline-none focus:border-gray-400 focus:bg-white transition-colors appearance-none";

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function CreateProduction() {
  const tenantId = useTenantId();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("id") || "";
  const salesOrderId = searchParams.get("sales_order_id");
  const salesOrderNumber = searchParams.get("sales_order_number") || "";
  const prefilledProductId = searchParams.get("product_id") || "";
  const prefilledOrderNumber = searchParams.get("order_number") || "";
  const prefilledCustomer = searchParams.get("customer_name") || "";
  const prefilledBuyerCompany = searchParams.get("buyer_company") || "";
  const prefilledOperatorName = searchParams.get("operator_name") || "";
  const prefilledOperatorId = searchParams.get("operator_id") || "";
  const prefilledBom = searchParams.get("bom_version") || "BOM v1.0";
  const prefilledQty = searchParams.get("planned_quantity") || searchParams.get("quantity") || "";
  const prefilledPriority = searchParams.get("priority") || "medium";
  const rawShiftParam = searchParams.get("shift") || "General";
  const prefilledShift = (rawShiftParam === "[object Object]" || rawShiftParam.includes("Object")) ? "General" : rawShiftParam;
  const prefilledMachineId = searchParams.get("machine_id") || "";
  const prefilledStart = searchParams.get("start_date") || "";
  const prefilledEnd = searchParams.get("due_date") || "";
  const prefilledSize = searchParams.get("size") || "";
  const prefilledStatus = searchParams.get("status") || "planned";

  const prefilledProducedQty = searchParams.get("produced_quantity") || "0";
  const prefilledProgress = searchParams.get("progress") || "";

  const isEditing = Boolean(editId || prefilledOrderNumber);

  const [products, setProducts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [form, setForm] = useState({
    id: editId ? (isNaN(Number(editId)) ? editId : Number(editId)) : null,
    tenant_id: tenantId,
    product_id: prefilledProductId,
    order_number:
      prefilledOrderNumber
        ? prefilledOrderNumber
        : salesOrderNumber
        ? `PO-${salesOrderNumber}`
        : "",
    customer_name: prefilledCustomer || prefilledBuyerCompany,
    buyer_company: prefilledBuyerCompany || prefilledCustomer,
    operator_name: prefilledOperatorName,
    operator_id: prefilledOperatorId,
    bom_version: prefilledBom,
    planned_quantity: prefilledQty,
    produced_quantity: prefilledProducedQty,
    progress: prefilledProgress,
    size: prefilledSize,
    status: prefilledStatus,
    priority: prefilledPriority,
    machine_id: prefilledMachineId,
    shift: prefilledShift,
    start_date: prefilledStart ? String(prefilledStart).slice(0, 16) : "",
    due_date: prefilledEnd ? String(prefilledEnd).slice(0, 16) : "",
    sales_order_id: salesOrderId ? Number(salesOrderId) : null,
    sales_order_number: salesOrderNumber || null,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successOrder, setSuccessOrder] = useState(null);

  /* expandable sections — auto-open when editing so pre-filled fields show */
  const [expandProductionDetails, setExpandProductionDetails] = useState(Boolean(editId || prefilledOrderNumber));
  const [expandSchedule, setExpandSchedule] = useState(Boolean(editId || prefilledOrderNumber));

  useEffect(() => {
    setLoadingProducts(true);
    Promise.all([
      fetchProductsWithFallback().catch(() => []),
      getMachines().catch(() => ({ data: [] })),
      getEmployees().catch(() => ({ data: [] })),
    ])
      .then(([pRes, mRes, eRes]) => {
        const rawProducts = Array.isArray(pRes) ? pRes : pRes?.data || [];
        setProducts([...rawProducts].sort((a, b) => (b.id || 0) - (a.id || 0)));
        setMachines(mRes?.data || []);
        const empList = Array.isArray(eRes?.data) ? eRes.data : [];
        setEmployees(empList);
      })
      .finally(() => setLoadingProducts(false));
  }, [tenantId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
    setError("");
  };

  const validate = () => {
    const errs = {};
    if (!form.product_id) errs.product_id = "Please select a product";
    const qty = Number(form.planned_quantity);
    if (form.planned_quantity === "" || form.planned_quantity === undefined || isNaN(qty)) {
      errs.planned_quantity = "Planned quantity is required";
      setExpandProductionDetails(true);
    } else if (qty <= 0) {
      errs.planned_quantity = "Planned quantity must be greater than 0";
      setExpandProductionDetails(true);
    }
    if (form.start_date && form.due_date) {
      if (new Date(form.due_date) < new Date(form.start_date)) {
        errs.due_date = "Due date must be on or after start date";
        setExpandSchedule(true);
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError("");

    /* ── resolve product details ───────────────────────────────── */
    const selectedProd = products.find(
      (p) =>
        String(p.id) === String(form.product_id) ||
        String(p.name) === String(form.product_id) ||
        String(p.sku) === String(form.product_id)
    );
    const prodName = selectedProd?.name || form.product_id || "Product";
    const prodSku = selectedProd?.sku || selectedProd?.product_code || "—";
    const poNumber = form.order_number?.trim() || `PO-${Date.now()}`;
    const pid =
      !isNaN(Number(form.product_id)) && Number(form.product_id) > 0
        ? Number(form.product_id)
        : form.product_id;

    /* ── resolve shift label ──────────────────────────────────── */
    const shiftObj = Array.isArray(SHIFTS)
      ? SHIFTS.find((s) => (typeof s === "object" ? s.id : s) === form.shift)
      : null;
    const shiftLabel = shiftObj
      ? `${shiftObj.label} (${shiftObj.timing})`
      : form.shift;

    const plannedNum = Number(form.planned_quantity || 0);
    const producedNum = Number(form.produced_quantity || 0);
    const targetId = form.id || editId || `po-${Date.now()}`;

    /* ── 1. Create or update production order API ─────────────── */
    try {
      await createProductionOrder({
        ...form,
        order_number: poNumber,
        product_id: pid,
        planned_quantity: plannedNum,
        actual_quantity: producedNum,
        produced_quantity: producedNum,
        customer_name: form.buyer_company || form.customer_name || null,
        buyer_company: form.buyer_company || form.customer_name || null,
        operator_name: form.operator_name || null,
        operator_id: form.operator_id || null,
        bom_version: form.bom_version || "BOM v1.0",
        priority: form.priority || "medium",
        machine_id: form.machine_id ? Number(form.machine_id) : null,
        shift: form.shift || "General",
        start_date: form.start_date || null,
        due_date: form.due_date || null,
        size: form.size || null,
        status: form.status || "planned",
        progress: form.progress !== "" ? Number(form.progress) : undefined,
        sales_order_id: form.sales_order_id || null,
        sales_order_number: form.sales_order_number || null,
      }).catch(() => null);
    } catch { /* fall through */ }

    /* ── 2. Save to localStorage ──────────────────────────────── */
    const savedPO = {
      id: targetId,
      order_number: poNumber,
      product_name: prodName,
      product_sku: prodSku,
      product_id: form.product_id,
      planned_qty: plannedNum,
      planned_quantity: plannedNum,
      produced_qty: producedNum,
      produced_quantity: producedNum,
      customer_name: form.buyer_company || form.customer_name || "",
      buyer_company: form.buyer_company || form.customer_name || "",
      operator_name: form.operator_name || "",
      operator_id: form.operator_id || "",
      size: form.size || "",
      bom_version: form.bom_version || "BOM v1.0",
      priority: form.priority || "medium",
      machine_id: form.machine_id || "",
      shift: typeof form.shift === "object" ? (form.shift.label || form.shift.id) : (form.shift || "General"),
      start_date: form.start_date || "",
      due_date: form.due_date || "",
      status: form.status || "planned",
      progress: form.progress !== "" ? Number(form.progress) : (plannedNum > 0 ? Math.min(100, Math.round((producedNum / plannedNum) * 100)) : 0),
      sales_order_number: form.sales_order_number || "",
      updated_at: new Date().toISOString(),
    };

    const stored = localStorage.getItem("smrt_local_production_orders");
    const localPOs = stored ? JSON.parse(stored) : [];
    let updatedArray;
    const matchIdx = localPOs.findIndex(
      (o) => (editId && String(o.id) === String(editId)) || String(o.order_number) === String(poNumber)
    );
    if (matchIdx >= 0) {
      updatedArray = [...localPOs];
      updatedArray[matchIdx] = {
        ...updatedArray[matchIdx],
        ...savedPO,
        id: updatedArray[matchIdx].id || targetId,
      };
    } else {
      updatedArray = [savedPO, ...localPOs];
    }
    localStorage.setItem("smrt_local_production_orders", JSON.stringify(updatedArray));
    localStorage.setItem("smrt_production_orders", JSON.stringify(updatedArray));

    /* ── 3. Create task in Assign Tasks ───────────────────────── */
    const taskTitle = `Production Order: ${poNumber} — ${prodName}`;
    const taskDescription = [
      `Order No: ${poNumber}`,
      form.buyer_company ? `Buyer: ${form.buyer_company}` : "",
      `Product: ${prodName}${prodSku !== "—" ? ` (${prodSku})` : ""}`,
      `Planned Qty: ${form.planned_quantity}`,
      form.size ? `Size: ${form.size}` : "",
      `Priority: ${form.priority}`,
      `Shift: ${shiftLabel}`,
      form.start_date ? `Start: ${String(form.start_date).slice(0, 10)}` : "",
      form.due_date ? `Due: ${String(form.due_date).slice(0, 10)}` : "",
      form.operator_id ? `Operator ID: ${form.operator_id}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await createTask({
        tenant_id: tenantId,
        title: taskTitle,
        description: taskDescription,
        assigned_to_name: form.operator_name || undefined,
        module: "production",
        priority: form.priority || "medium",
        status: "open",
        start_date: form.start_date ? String(form.start_date).slice(0, 10) : undefined,
        due_date: form.due_date ? String(form.due_date).slice(0, 10) : undefined,
        reference_id: poNumber,
      });
    } catch {
      /* task creation is best-effort */
    }

    /* ── 4. Also persist task in localStorage for offline-first ── */
    const localTask = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      description: taskDescription,
      assigned_to_name: form.operator_name || "—",
      module: "production",
      priority: form.priority || "medium",
      status: "open",
      start_date: form.start_date ? String(form.start_date).slice(0, 10) : null,
      due_date: form.due_date ? String(form.due_date).slice(0, 10) : null,
      reference_id: poNumber,
      created_at: new Date().toISOString(),
    };
    const storedTasks = localStorage.getItem("smrt_local_tasks");
    const localTasks = storedTasks ? JSON.parse(storedTasks) : [];
    localStorage.setItem("smrt_local_tasks", JSON.stringify([localTask, ...localTasks]));

    /* ── 5. Push notification ─────────────────────────────────── */
    const notifMsg = form.operator_name
      ? `Production Order ${poNumber} sent to ${form.operator_name}. Assigned task created.`
      : `Production Order ${poNumber} created. Task assigned in production queue.`;

    try {
      await createNotification({
        message: notifMsg,
        type: "info",
        module: "production",
        reference_id: poNumber,
      });
    } catch {
      /* best-effort */
    }

    /* Also persist notification locally */
    const localNotif = {
      id: `notif-${Date.now()}`,
      message: notifMsg,
      type: "info",
      module: "production",
      reference_id: poNumber,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    const storedNotifs = localStorage.getItem("smrt_local_notifications");
    const localNotifs = storedNotifs ? JSON.parse(storedNotifs) : [];
    localStorage.setItem(
      "smrt_local_notifications",
      JSON.stringify([localNotif, ...localNotifs])
    );

    setSaving(false);

    /* ── 6. Directly navigate to Production Planning fastly ──── */
    const targetUrl = salesOrderId ? `/sales/orders/${salesOrderId}` : "/production/planning";
    navigate(targetUrl, {
      state: { createdOrder: { ...savedPO, shift: shiftLabel } },
      replace: true,
    });
  };

  const backTo = salesOrderId ? `/sales/orders/${salesOrderId}` : "/production/planning";

  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl bg-white shadow-lg ring-1 ring-gray-100">
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="flex items-start justify-between border-b border-gray-100 px-6 pb-4 pt-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Production Order" : "Create Production Order"}
            </h2>
            <Link
              to={backTo}
              className="mt-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </Link>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="px-6 py-5">

              {salesOrderNumber && (
                <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-2.5 text-sm text-teal-800">
                  Linked sales order: <strong>{salesOrderNumber}</strong>
                </div>
              )}

              {isEditing ? (
                /* ── EDIT PRODUCTION ORDER FIELDS (Matching Image 1 & 2) ── */
                <div className="space-y-4">
                  {/* ── Product ── */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                      PRODUCT <span className="text-red-500">*</span>
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
                        {loadingProducts ? "Loading products…" : "Select a product"}
                      </option>
                      {products.map((p) => {
                        const code =
                          p.product_code || p.sku || p.code || (p.id ? `PRD${String(p.id).padStart(3, "0")}` : "");
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name}{code ? ` (${code})` : ""}
                          </option>
                        );
                      })}
                    </select>
                    {fieldErrors.product_id && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.product_id}</p>
                    )}
                  </div>

                  {/* ── Buyer Company ── */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                      BUYER COMPANY
                    </label>
                    <input
                      type="text"
                      name="buyer_company"
                      value={form.buyer_company}
                      onChange={handleChange}
                      placeholder="Enter buyer company name"
                      className={INPUT_CLS}
                    />
                  </div>

                  {/* ── Operator Name & Operator ID ── */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
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
                            setError("");
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
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
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

                  {/* ── Order No & Size ── */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                        ORDER NO <span className="text-red-500">*</span>
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
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                        SIZE
                      </label>
                      <input
                        type="text"
                        name="size"
                        value={form.size}
                        onChange={handleChange}
                        placeholder="e.g. Large, 42, XL"
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>

                  {/* ── Quantities: Planned & Produced ── */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                        PLANNED QUANTITY <span className="text-red-500">*</span>
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
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                        PRODUCED
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

                  {/* ── Priority, Machine, Shift ── */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                        PRIORITY
                      </label>
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
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                        MACHINE
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
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                        SHIFT
                      </label>
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
                  </div>

                  {/* ── Start & Due Dates ── */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                        START
                      </label>
                      <input
                        type="datetime-local"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleChange}
                        className={INPUT_CLS}
                        style={{ colorScheme: "light" }}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                        DUE
                      </label>
                      <input
                        type="datetime-local"
                        name="due_date"
                        value={form.due_date}
                        onChange={handleChange}
                        className={fieldErrors.due_date ? INPUT_ERR_CLS : INPUT_CLS}
                        style={{ colorScheme: "light" }}
                      />
                      {fieldErrors.due_date && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.due_date}</p>
                      )}
                    </div>
                  </div>

                  {/* ── Status ── */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                      STATUS
                    </label>
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
              ) : (
                /* ── CREATE PRODUCTION ORDER FIELDS (Untouched) ── */
                <>
                  {/* ── Product (full width) ──────────────────────────── */}
                  <div className="mb-4">
                    <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                      Product
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
                        {loadingProducts ? "Loading products…" : "Select a product"}
                      </option>
                      {products.map((p) => {
                        const code =
                          p.product_code || p.sku || p.code || (p.id ? `PRD${String(p.id).padStart(3, "0")}` : "");
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name}{code ? ` (${code})` : ""}
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

                  {/* ── Buyer Company ─────────────────────────────────── */}
                  <div className="mb-1">
                    <label className="mb-1.5 block text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                      Buyer Company Name
                    </label>
                    <input
                      type="text"
                      name="buyer_company"
                      value={form.buyer_company}
                      onChange={handleChange}
                      placeholder="Enter buyer company name"
                      className={INPUT_CLS}
                    />
                  </div>

                  {/* ── Operator subsection ───────────────────────────── */}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Operator Name">
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
                            setError("");
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
                    </Field>
                    <Field label="Operator ID">
                      <input
                        type="text"
                        name="operator_id"
                        value={form.operator_id}
                        onChange={handleChange}
                        placeholder="e.g. EMP-1042"
                        className={INPUT_CLS}
                      />
                    </Field>
                  </div>

                  {/* ── Order No ──────────────────────────────────────── */}
                  <div className="mt-3">
                    <Field label="Order Number" error={fieldErrors.order_number}>
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
                    </Field>
                  </div>

                  {/* ── Divider ───────────────────────────────────────── */}
                  <div className="my-4 border-t border-gray-100" />

                  {/* ── SECTION: Production Details ───────────────────── */}
                  <CollapsibleSection
                    title="Production Details"
                    subtitle="Planned Quantity, Priority, Shift, Machine, Size, Status"
                    expanded={expandProductionDetails}
                    onToggle={() => setExpandProductionDetails((v) => !v)}
                  >
                    <Field label="Planned Quantity" required error={fieldErrors.planned_quantity}>
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
                    </Field>
                    <Field label="Priority">
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
                    </Field>
                    <Field label="Shift">
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
                              {label}{timing ? `  (${timing})` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </Field>
                    <Field label="Machine">
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
                    </Field>
                    <Field label="Size">
                      <input
                        type="text"
                        name="size"
                        value={form.size}
                        onChange={handleChange}
                        placeholder="e.g. Large, 42, XL"
                        className={INPUT_CLS}
                      />
                    </Field>
                    <Field label="Status">
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
                    </Field>
                  </CollapsibleSection>

                  {/* ── SECTION: Schedule ─────────────────────────────── */}
                  <CollapsibleSection
                    title="Schedule"
                    subtitle="Start Date, Due Date"
                    expanded={expandSchedule}
                    onToggle={() => setExpandSchedule((v) => !v)}
                  >
                    <Field label="Start Date">
                      <input
                        type="datetime-local"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleChange}
                        className={INPUT_CLS}
                        style={{ colorScheme: "light" }}
                      />
                    </Field>
                    <Field label="Due Date" error={fieldErrors.due_date}>
                      <input
                        type="datetime-local"
                        name="due_date"
                        value={form.due_date}
                        onChange={handleChange}
                        className={fieldErrors.due_date ? INPUT_ERR_CLS : INPUT_CLS}
                        style={{ colorScheme: "light" }}
                      />
                    </Field>
                  </CollapsibleSection>

                  {/* ── Show All Fields ───────────────────────────────── */}
                  <div className="mt-2 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-full border border-purple-200 px-4 py-1.5 text-[13px] font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                      onClick={() => {
                        setExpandProductionDetails(true);
                        setExpandSchedule(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Show All Fields
                    </button>
                  </div>
                </>
              )}

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
            </div>

            {/* ── Footer Buttons ──────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-6 py-4">
              <Link
                to={backTo}
                className="flex items-center justify-center rounded-full bg-gray-100 py-3 text-[15px] font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || loadingProducts}
                className="flex items-center justify-center gap-2 rounded-full bg-[#F5C518] py-3 text-[15px] font-bold text-gray-900 shadow-sm hover:bg-yellow-400 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
                {saving ? "Saving…" : isEditing ? "Update Order" : "Create & Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}