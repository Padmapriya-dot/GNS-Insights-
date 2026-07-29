import { Link } from "react-router-dom";
import { Check, Circle, Lock } from "lucide-react";

import {
  buildWorkflowProgress,
  getPrimaryRoleName,
  canViewFullWorkflow,
} from "../../config/manufacturingWorkflow";
import useAuth from "../../hooks/useAuth";

/**
 * Manufacturing spine progress filtered by the signed-in user's role.
 * Admin / Management see the full chain; others see only their stages.
 */
export default function ManufacturingWorkflowBar({
  currentStepId,
  className = "",
  compact = false,
  /** Force a role (tests); defaults to signed-in user role */
  roleName: roleNameProp = null,
  filterByRole = true,
}) {
  const { user } = useAuth();
  const roleName = roleNameProp || getPrimaryRoleName(user);
  const steps = buildWorkflowProgress(currentStepId, {
    roleName,
    filterByRole: filterByRole && !canViewFullWorkflow(roleName),
  });
  const currentIdx = steps.findIndex((s) => s.state === "current");
  const prev = currentIdx > 0 ? steps[currentIdx - 1] : null;
  const curr = currentIdx >= 0 ? steps[currentIdx] : steps.find((s) => s.state === "current") || steps[0];
  const next =
    currentIdx >= 0 && currentIdx < steps.length - 1 ? steps[currentIdx + 1] : null;

  if (!steps.length) {
    return (
      <div
        className={`rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
      >
        No manufacturing workflow stages are assigned to your role ({roleName || "unknown"}).
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {canViewFullWorkflow(roleName) ? "Manufacturing workflow" : `My workflow · ${roleName}`}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {prev && (
            <>
              <Link
                to={prev.path}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <span aria-hidden>✔</span>
                <span className="text-slate-500 dark:text-slate-400">Prev:</span>
                {prev.label}
              </Link>
              <span className="text-slate-300 dark:text-slate-600">↓</span>
            </>
          )}
          {curr && (
            <>
              <Link
                to={curr.path}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 font-semibold text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <span aria-hidden>🟡</span>
                <span className="text-slate-500 dark:text-slate-400">Current:</span>
                {curr.label}
              </Link>
              {next && <span className="text-slate-300 dark:text-slate-600">↓</span>}
            </>
          )}
          {next && (
            <Link
              to={next.path}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
            >
              <span aria-hidden>⚪</span>
              <span className="text-slate-400">Next:</span>
              {next.label}
            </Link>
          )}
        </div>
        <Link
          to="/manufacturing/workflow"
          className="ml-auto text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
        >
          Open role board →
        </Link>
      </div>

      {!compact && (
        <div className="flex gap-1 overflow-x-auto px-3 py-3 scrollbar-thin">
          {steps.map((step) => {
            const isDone = step.state === "completed";
            const isCurrent = step.state === "current";
            return (
              <Link
                key={step.id}
                to={step.path}
                title={`${step.label} · ${step.responsibleRole || ""}`}
                className={`flex min-w-[5rem] flex-col items-center gap-1 rounded-lg px-1.5 py-1.5 text-center transition ${
                  isCurrent
                    ? "bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-950/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-amber-400 text-amber-950"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isCurrent ? (
                    <Circle className="h-2.5 w-2.5 fill-current" />
                  ) : (
                    <Lock className="h-3 w-3 opacity-50" />
                  )}
                </span>
                <span
                  className={`max-w-[5rem] truncate text-[10px] font-medium leading-tight ${
                    isCurrent
                      ? "text-amber-900 dark:text-amber-200"
                      : isDone
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                {step.responsibleRole ? (
                  <span className="max-w-[5rem] truncate text-[9px] text-slate-400">{step.responsibleRole}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
