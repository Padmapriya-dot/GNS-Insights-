import { Clock, RefreshCw } from "lucide-react";

function formatTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function AnalyticsDashboardHeader({
  title, subtitle, lastUpdated, onRefresh, autoRefresh, onAutoRefreshChange, loading, dark = false,
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>{title}</h1>
        {subtitle && (
          <p className={`mt-1 text-sm ${dark ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>{subtitle}</p>
        )}
        {lastUpdated && (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" /> Last updated: {formatTime(lastUpdated)}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className={`flex items-center gap-2 text-sm ${dark ? "text-slate-300" : "text-slate-600 dark:text-slate-300"}`}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => onAutoRefreshChange?.(e.target.checked)}
            className="rounded border-slate-300"
          />
          Auto refresh (60s)
        </label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 ${
            dark
              ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
    </header>
  );
}
