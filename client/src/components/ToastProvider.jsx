import { useCallback, useState } from "react";
import { ToastContext } from "../lib/toast";

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2700);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span aria-hidden="true">{t.type === "error" ? "⚠️" : "✓"}</span> {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
