import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

import { setApiErrorHandler } from "../api/axiosConfig";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const lastErrorRef = useRef({ message: null, at: 0 });

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
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
      <div className="fixed bottom-4 right-4 z-[9999] flex max-w-sm flex-col gap-1.5 pointer-events-none">
        {toasts.map((t) => (
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
