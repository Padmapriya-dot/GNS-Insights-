import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Circle, Lock, RefreshCw } from "lucide-react";

import Loader from "../../components/common/Loader";
import ManufacturingWorkflowBar from "../../components/manufacturing/ManufacturingWorkflowBar";
import { useToast } from "../../context/ToastContext";
import useAuth from "../../hooks/useAuth";
import { getManufacturingWorkflowBoard, getSalesOrderWorkflow } from "../../api/salesApi";
import { getPrimaryRoleName, WORKFLOW_PHASES } from "../../config/manufacturingWorkflow";

const STATUS_STYLES = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-900",
  current: "border-amber-300 bg-amber-50 text-amber-950 ring-1 ring-amber-200",
  pending: "border-slate-200 bg-white text-slate-700",
  blocked: "border-slate-200 bg-slate-50 text-slate-400",
};

export default function RoleWorkflowBoard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const roleName = getPrimaryRoleName(user);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getManufacturingWorkflowBoard();
      setBoard(res?.data ?? res);
    } catch (err) {
      addToast(err?.response?.data?.detail || "Could not load workflow board", "error");
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const openOrder = async (orderId) => {
    setSelectedOrderId(orderId);
    setDetailLoading(true);
    try {
      const res = await getSalesOrderWorkflow(orderId);
      setDetail(res?.data ?? res);
    } catch (err) {
      addToast(err?.response?.data?.detail || "Could not load order workflow", "error");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <Loader label="Loading role workflow..." />;

  const roleStages = board?.role_stages || [];
  const orders = board?.orders || [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Role Workflow Board</h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{roleName || "—"}</span>
            {board?.full_access ? " · Full chain (Management)" : " · Department stages only"}
            {" · "}Enquiry → Closure (9 phases)
          </p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        {WORKFLOW_PHASES.map((p) => (
          <span
            key={p.id}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {p.id}. {p.label}
          </span>
        ))}
      </div>

      <ManufacturingWorkflowBar
        currentStepId={detail?.current_stage_id || roleStages[0]?.id || "sales_order"}
        filterByRole
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">My responsibilities</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roleStages.length === 0 ? (
            <p className="text-sm text-slate-500">No workflow stages are assigned to your role.</p>
          ) : (
            roleStages.map((s) => (
              <Link
                key={s.id}
                to={s.path}
                className="rounded-xl border border-slate-100 px-4 py-3 hover:border-teal-200 hover:bg-teal-50/40 dark:border-slate-700"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-100">{s.label}</p>
                <p className="mt-1 text-xs text-slate-500">{s.responsible_role}</p>
                <ul className="mt-2 list-inside list-disc text-xs text-slate-600 dark:text-slate-300">
                  {(s.tasks || []).slice(0, 3).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Sales orders · my pending work</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Current stage</th>
                <th className="px-3 py-2">My pending</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-slate-500">
                    No sales orders found. Create and confirm an order to start the spine.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.sales_order_id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 font-medium text-[#0f6d84]">{o.order_number}</td>
                    <td className="px-3 py-2 capitalize">{o.status}</td>
                    <td className="px-3 py-2">{o.current_stage_id || "—"}</td>
                    <td className="px-3 py-2">
                      {(o.my_pending_stages || []).length
                        ? o.my_pending_stages.map((s) => s.label).join(", ")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => openOrder(o.sales_order_id)}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        View stages
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedOrderId ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Stage detail · {detail?.order_number || `#${selectedOrderId}`}
            </h2>
            <button type="button" className="text-xs text-slate-500 hover:underline" onClick={() => setSelectedOrderId(null)}>
              Close
            </button>
          </div>
          {detailLoading ? (
            <Loader label="Loading stages..." />
          ) : (
            <div className="space-y-3">
              {(detail?.stages || []).map((s) => (
                <div
                  key={s.id}
                  className={`rounded-xl border px-4 py-3 ${STATUS_STYLES[s.status] || STATUS_STYLES.pending}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {s.status === "completed" ? (
                        <Check className="h-4 w-4" />
                      ) : s.status === "blocked" ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <div>
                        <p className="font-semibold">{s.label}</p>
                        <p className="text-xs opacity-80">
                          {s.responsible_role}
                          {s.assigned_user ? ` · ${s.assigned_user}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold capitalize">{s.status}</p>
                      {s.approval_status ? <p>Approval: {s.approval_status}</p> : null}
                      {s.started_at ? <p>Start: {s.started_at}</p> : null}
                      {s.completed_at ? <p>Done: {s.completed_at}</p> : null}
                    </div>
                  </div>
                  {s.block_reason ? (
                    <p className="mt-2 text-xs font-medium text-rose-600">{s.block_reason}</p>
                  ) : null}
                  {(s.pending_actions || []).length ? (
                    <ul className="mt-2 list-inside list-disc text-xs">
                      {s.pending_actions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  ) : null}
                  {s.path && s.status !== "blocked" ? (
                    <Link to={s.path} className="mt-2 inline-block text-xs font-semibold underline">
                      Open module →
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
