import { createContext, useContext, useState, useCallback } from "react";
import "../styles/Toast.css";
import { playSuccessChime, playErrorBeep } from "../lib/soundFx";
import { CheckIcon, AlertIcon, SparkleIcon, CloseIcon } from "../components/icons";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = "info", duration = 4000 }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newToast = { id, title, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (type === "success") {
        playSuccessChime();
      } else if (type === "error") {
        playErrorBeep();
      }

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (title, message, duration) =>
      addToast({ title, message, type: "success", duration }),
    error: (title, message, duration) =>
      addToast({ title, message, type: "error", duration }),
    info: (title, message, duration) =>
      addToast({ title, message, type: "info", duration }),
    warning: (title, message, duration) =>
      addToast({ title, message, type: "warning", duration }),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Render Stack */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast--${t.type}`}>
            <div className="toast-icon-wrap">
              {t.type === "success" && <CheckIcon width={16} height={16} />}
              {t.type === "error" && <AlertIcon width={16} height={16} />}
              {t.type === "warning" && <AlertIcon width={16} height={16} />}
              {t.type === "info" && <SparkleIcon width={16} height={16} />}
            </div>
            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(t.id)}
              aria-label="Close notification"
            >
              <CloseIcon width={12} height={12} />
            </button>
            {t.duration > 0 && (
              <div
                className="toast-progress"
                style={{ animationDuration: `${t.duration}ms` }}
              />
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastContext;
