import { WifiOff } from "lucide-react";

/**
 * Full offline panel (use inside page content when offline and load fails).
 */
export default function OfflineState({
  title = "No internet connection",
  description = "You appear to be offline. Check your network, then try again. We will retry automatically when the connection is restored.",
  onRetry,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/70 px-6 py-14 text-center dark:border-amber-900/40 dark:bg-amber-950/20 ${className}`}
      role="alert"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <WifiOff className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

/**
 * Sticky top banner when the browser reports offline.
 */
export function OfflineBanner({ onRetry }) {
  return (
    <div
      className="sticky top-0 z-[80] flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-2 font-medium">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        You are offline. Some features may be unavailable.
      </span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-md bg-amber-700 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-800"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
