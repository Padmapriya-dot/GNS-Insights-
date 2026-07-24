import { SearchX } from "lucide-react";

/**
 * Shown when search/filters match nothing (data exists, filters empty it).
 */
export default function NoResultsState({
  query = "",
  title = "No results found",
  description,
  onClear,
  clearLabel = "Clear filters",
  className = "",
}) {
  const desc =
    description ||
    (query
      ? `Nothing matched “${query}”. Try a different keyword or remove filters.`
      : "Nothing matched your current filters. Try adjusting or clearing them.");

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-800/30 ${className}`}
      role="status"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
        <SearchX className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{desc}</p>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}
