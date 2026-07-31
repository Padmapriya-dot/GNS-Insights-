import { useState } from "react";

function StatusBadge({ status }) {
  const styles = {
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    running: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    planned: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
    pending: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
    maintenance: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    down: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    stopped: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    idle: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
    cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  };
  const style = styles[status] || "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {status}
    </span>
  );
}

export default function Table({ columns, data, emptyState, sortable }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (key) => {
    if (!sortable || !key) return;
    const nextDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortDir(nextDir);
  };

  const sortedData = [...data];
  if (sortKey && sortable) {
    sortedData.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = aVal == null && bVal == null ? 0 : (aVal ?? "") < (bVal ?? "") ? -1 : (aVal ?? "") > (bVal ?? "") ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 ${
                  sortable && col.sortable !== false ? "cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50" : ""
                }`}
                onClick={() => (col.sortable !== false && sortable) && handleSort(col.key)}
              >
                <span className="flex items-center gap-1.5">
                  {col.label}
                  {sortable && col.sortable !== false && sortKey === col.key && (
                    <span className="text-teal-600 dark:text-teal-400">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {sortedData.map((row, idx) => (
            <tr
              key={row.id ?? idx}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300"
                >
                  {col.render
                    ? col.render(row)
                    : col.statusBadge
                    ? <StatusBadge status={row[col.key]} />
                    : (row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sortedData.length === 0 && (
        <div className="p-8">
          {emptyState || (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              No data available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export { StatusBadge };
