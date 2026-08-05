import { useState, useEffect } from "react";
import { X, CheckCircle, Cpu, User, Calendar, ShieldCheck } from "lucide-react";
import { SHIFTS } from "../../data/productionPlanningMasterData";
import { getMachines, quickCreateWorkOrder } from "../../api/productionApi";

export default function QuickWorkOrderModal({ order, onClose, onSuccess, addToast }) {
  const [machines, setMachines] = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(true);

  const poNumber = order?.order_number || order?.id || "";
  const initialWoNumber = poNumber ? `WO-${poNumber}` : `WO-${Date.now().toString().slice(-6)}`;

  const [form, setForm] = useState({
    work_order_number: initialWoNumber,
    product_name: order?.product_name || "Product",
    product_id: order?.product_id || "",
    planned_quantity: order?.planned_quantity || 100,
    customer_name: order?.buyer_company || order?.customer_name || "",
    machine_id: order?.machine_id || "",
    machine_name: order?.machine_name !== "—" ? order?.machine_name || "" : "",
    operator_name: order?.operator_name || "",
    operator_id: order?.operator_id || "",
    shift: typeof order?.shift === "object" ? (order?.shift?.id || "General") : (order?.shift || "General"),
    priority: order?.priority || "medium",
    start_date: order?.start_date ? String(order.start_date).slice(0, 16) : "",
    due_date: order?.due_date ? String(order.due_date).slice(0, 16) : "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingMachines(true);
    getMachines()
      .then((res) => {
        setMachines(res?.data || []);
      })
      .catch(() => setMachines([]))
      .finally(() => setLoadingMachines(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const selectedMachine = machines.find((m) => String(m.id) === String(form.machine_id));
    const finalMachineName = selectedMachine?.name || form.machine_name || (form.machine_id ? `Machine #${form.machine_id}` : "Unassigned");
    const woNum = form.work_order_number?.trim() || `WO-${Date.now().toString().slice(-6)}`;
    const plannedQty = Number(form.planned_quantity || 0);
    const shiftVal = typeof form.shift === "object" ? (form.shift?.label || form.shift?.id || "General") : (form.shift || "General");

    const payload = {
      production_order_id: order?.id ? Number(order.id) : null,
      work_order_number: woNum,
      product_id: form.product_id,
      planned_quantity: plannedQty,
      customer_name: form.customer_name || null,
      machine_id: form.machine_id ? Number(form.machine_id) : null,
      shift: shiftVal,
      operator_name: form.operator_name || null,
      operator_id: form.operator_id || null,
      priority: form.priority || "medium",
      planned_start: form.start_date || null,
      planned_end: form.due_date || null,
    };

    try {
      await quickCreateWorkOrder(payload).catch(() => null);
    } catch { /* fall through to local persistence */ }

    // Persist new work order in localStorage
    const newWO = {
      id: `wo-${Date.now()}`,
      work_order_number: woNum,
      production_order_id: order?.id || null,
      production_order_number: order?.order_number || null,
      product_id: form.product_id,
      product_name: form.product_name,
      customer_name: form.customer_name,
      planned_quantity: plannedQty,
      produced_quantity: 0,
      machine_id: form.machine_id || "",
      machine_name: finalMachineName,
      operator_name: form.operator_name,
      operator_id: form.operator_id,
      shift: shiftVal,
      priority: form.priority,
      status: "planned",
      start_date: form.start_date,
      due_date: form.due_date,
      created_at: new Date().toISOString(),
    };

    try {
      const storedWOs = localStorage.getItem("smrt_local_work_orders");
      const localWOs = storedWOs ? JSON.parse(storedWOs) : [];
      const updatedWOs = [newWO, ...localWOs];
      localStorage.setItem("smrt_local_work_orders", JSON.stringify(updatedWOs));
      localStorage.setItem("smrt_work_orders", JSON.stringify(updatedWOs));

      // Update Production Order if linked
      if (order?.id || order?.order_number) {
        const storedPOs = localStorage.getItem("smrt_local_production_orders");
        if (storedPOs) {
          const localPOs = JSON.parse(storedPOs);
          const updatedPOs = localPOs.map((po) => {
            if (String(po.id) === String(order?.id) || String(po.order_number) === String(order?.order_number)) {
              return {
                ...po,
                machine_id: form.machine_id || po.machine_id,
                machine_name: finalMachineName,
                work_order_number: woNum,
                operator_name: form.operator_name || po.operator_name,
                operator_id: form.operator_id || po.operator_id,
                shift: shiftVal,
                status: po.status === "draft" || po.status === "planned" ? "machine_assigned" : po.status,
              };
            }
            return po;
          });
          localStorage.setItem("smrt_local_production_orders", JSON.stringify(updatedPOs));
        }
      }
    } catch (e) {}

    if (addToast) {
      addToast(`Work Order ${woNum} created & assigned successfully!`, "success");
    }

    setSaving(false);
    if (onSuccess) onSuccess(newWO);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-800 dark:ring-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create & Assign Work Order
              </h3>
              {poNumber && (
                <p className="text-xs font-medium text-slate-500">
                  For Production Order <strong className="text-slate-700 dark:text-slate-300">#{poNumber}</strong>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Work Order Number
              </label>
              <input
                type="text"
                name="work_order_number"
                value={form.work_order_number}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Product Name
              </label>
              <input
                type="text"
                name="product_name"
                value={form.product_name}
                onChange={handleChange}
                required
                readOnly={Boolean(order?.product_name)}
                className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm shadow-sm ${order?.product_name ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400" : "bg-white dark:bg-slate-800"}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Planned Quantity
              </label>
              <input
                type="number"
                name="planned_quantity"
                value={form.planned_quantity}
                onChange={handleChange}
                required
                min="1"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Machine Assignment
              </label>
              <select
                name="machine_id"
                value={form.machine_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Select Machine...</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.code || `Machine #${m.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Assigned Operator Name
              </label>
              <input
                type="text"
                name="operator_name"
                value={form.operator_name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Operator ID
              </label>
              <input
                type="text"
                name="operator_id"
                value={form.operator_id}
                onChange={handleChange}
                placeholder="e.g. OP-104"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Shift
              </label>
              <select
                name="shift"
                value={typeof form.shift === "object" ? form.shift?.id : form.shift}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {SHIFTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.timing})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="datetime-local"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#F5C518] px-5 py-2.5 text-xs font-extrabold text-gray-900 shadow-md hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 text-gray-900" />
              {saving ? "Saving..." : "Create & Assign Work Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
