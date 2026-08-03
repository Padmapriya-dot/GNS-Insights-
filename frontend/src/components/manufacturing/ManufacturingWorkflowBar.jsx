import { Link } from "react-router-dom";
import { ArrowRight, Check, Circle, Lock } from "lucide-react";

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
  const completedCount = steps.filter((s) => s.state === "completed").length;
  const pct = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;

  if (!steps.length) {
    return (
      <div
        className={`rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900 ${className}`}
      >
        No manufacturing workflow stages are assigned to your role ({roleName || "unknown"}).
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {canViewFullWorkflow(roleName) ? "Manufacturing workflow" : `My workflow · ${roleName}`}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{pct}% complete</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {prev && (
            <>
              <Link
                to={prev.path}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800"
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
                <span className="text-slate-500 dark:text-slate-400">Prev</span>
                {prev.label}
              </Link>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" aria-hidden />
            </>
          )}
          {curr && (
            <>
              <Link
                to={curr.path}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 font-semibold text-teal-900 ring-1 ring-inset ring-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-200 dark:ring-teal-800"
              >
                <Circle className="h-2.5 w-2.5 fill-current" aria-hidden />
                <span className="text-slate-500 dark:text-slate-400">Current</span>
                {curr.label}
              </Link>
              {next && <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" aria-hidden />}
            </>
          )}
          {next && (
            <Link
              to={next.path}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
            >
              <Lock className="h-3 w-3 opacity-60" aria-hidden />
              <span className="text-slate-400">Next</span>
              {next.label}
            </Link>
          )}
        </div>

        <Link
          to="/manufacturing/workflow"
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
        >
          Role board
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      {!compact && (
        <div className="flex gap-1 overflow-x-auto px-3 py-3">
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
                    ? "bg-teal-50 ring-1 ring-teal-200 dark:bg-teal-950/30 dark:ring-teal-800"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-teal-600 text-white"
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
                      ? "text-teal-900 dark:text-teal-200"
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
