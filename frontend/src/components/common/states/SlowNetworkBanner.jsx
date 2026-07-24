import { Loader2 } from "lucide-react";

/**
 * Informational banner when a request is taking longer than expected.
 */
export default function SlowNetworkBanner({
  message = "This is taking longer than usual. Please keep this page open…",
  className = "",
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
