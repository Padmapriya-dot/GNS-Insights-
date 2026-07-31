import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

import { setApiErrorHandler } from "../api/axiosConfig";
import { formatApiError } from "../utils/apiError";

const ToastContext = createContext(null);

function normalizeToastMessage(message) {
  if (message == null || message === "") return "Something went wrong.";
  if (typeof message === "string" || typeof message === "number") return String(message);
  return formatApiError(message);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const lastErrorRef = useRef({ message: null, at: 0 });

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    const text = normalizeToastMessage(message);
    setToasts((prev) => [...prev, { id, message: text, type }]);
    const ttl = type === "error" ? 5000 : 3200;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ttl);
  }, []);

  useEffect(() => {
    setApiErrorHandler((message) => {
      // Debounce identical errors fired within 4s to avoid toast spam.
      const now = Date.now();
      if (
        lastErrorRef.current.message === message &&
        now - lastErrorRef.current.at < 4000
      ) {
        return;
      }
      lastErrorRef.current = { message, at: now };
      addToast(message, "error");
    });
    return () => setApiErrorHandler(null);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-1.5 pointer-events-none px-4">
        {toasts.filter((t) => t.type === "alert").map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex min-w-[280px] max-w-md items-center justify-between gap-6 rounded-full bg-[#FF4500] px-5 py-2.5 text-[13px] font-medium text-white shadow-lg"
          >
            <span>{t.message}</span>
            <button
              type="button"
              className="shrink-0 font-bold"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            >
              Close
            </button>
          </div>
        ))}
      </div>
      <div className="fixed bottom-4 right-4 z-[9999] flex max-w-sm flex-col gap-1.5 pointer-events-none">
        {toasts.filter((t) => t.type !== "alert").map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto max-w-xs rounded-lg border px-3 py-2 text-xs font-medium shadow-md animate-in slide-in-from-right-2"
            style={{
              background:
                t.type === "success"
                  ? "#f0fdf4"
                  : t.type === "error"
                    ? "#fef2f2"
                    : t.type === "warning"
                      ? "#fffbeb"
                      : "#f8fafc",
              color:
                t.type === "success"
                  ? "#166534"
                  : t.type === "error"
                    ? "#b91c1c"
                    : t.type === "warning"
                      ? "#92400e"
                      : "#334155",
              borderColor:
                t.type === "success"
                  ? "#bbf7d0"
                  : t.type === "error"
                    ? "#fecaca"
                    : t.type === "warning"
                      ? "#fde68a"
                      : "#e2e8f0",
            }}
          >
            {t.type === "success" && "✓ "}
            {t.type === "error" && "✕ "}
            {t.type === "warning" && "! "}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { addToast: () => {} };
  return ctx;
}
