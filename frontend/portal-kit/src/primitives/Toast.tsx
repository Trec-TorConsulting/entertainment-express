import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { clsx } from "clsx";

export type ToastVariant = "default" | "success" | "warning" | "danger";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  title?: React.ReactNode;
  description: React.ReactNode;
  variant?: ToastVariant;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  toast: (options: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global event bus for non-React call() helper
type ToastListener = (toast: ToastItem) => void;
const listeners = new Set<ToastListener>();

export function showToast(options: Omit<ToastItem, "id">): string {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const item: ToastItem = { ...options, id };
  listeners.forEach((listener) => listener(item));
  return id;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newItem: ToastItem = { ...options, id };
    setToasts((prev) => [...prev, newItem]);
    return id;
  }, []);

  useEffect(() => {
    const handleGlobalToast = (item: ToastItem) => {
      setToasts((prev) => [...prev, item]);
    };
    listeners.add(handleGlobalToast);
    return () => {
      listeners.delete(handleGlobalToast);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Toast viewport */}
      <div
        className="fixed bottom-4 right-4 z-[var(--ee-z-toast)] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toasts: [],
      toast: showToast,
      dismiss: () => {}
    };
  }
  return ctx;
}

const variantStyles: Record<ToastVariant, { border: string; icon: React.ReactNode; text: string }> = {
  default: {
    border: "border-[var(--ee-border)]",
    icon: <Info className="h-4 w-4 text-[var(--ee-brand)]" />,
    text: "text-[var(--ee-text)]"
  },
  success: {
    border: "border-[var(--ee-success-border)]",
    icon: <CheckCircle2 className="h-4 w-4 text-[var(--ee-success)]" />,
    text: "text-[var(--ee-text)]"
  },
  warning: {
    border: "border-[var(--ee-warning-border)]",
    icon: <AlertTriangle className="h-4 w-4 text-[var(--ee-warning)]" />,
    text: "text-[var(--ee-text)]"
  },
  danger: {
    border: "border-[var(--ee-danger-border)]",
    icon: <AlertCircle className="h-4 w-4 text-[var(--ee-danger)]" />,
    text: "text-[var(--ee-text)]"
  }
};

const ToastCard: React.FC<{ item: ToastItem; onDismiss: () => void }> = ({ item, onDismiss }) => {
  const variant = item.variant || "default";
  const config = variantStyles[variant];

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, item.duration || 5000);
    return () => clearTimeout(timer);
  }, [item.duration, onDismiss]);

  return (
    <div
      role="status"
      className={clsx(
        "pointer-events-auto flex items-start gap-3 rounded-[var(--ee-radius-lg)] border bg-[var(--ee-surface-raised)] p-4 shadow-ee-lg text-sm transition-all duration-200",
        "animate-in slide-in-from-bottom-5 fade-in-0",
        config.border
      )}
    >
      <div className="shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 space-y-1">
        {item.title && <div className="font-semibold text-sm text-[var(--ee-text)]">{item.title}</div>}
        <div className="text-xs text-[var(--ee-muted)] leading-relaxed">{item.description}</div>
        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              onDismiss();
            }}
            className="mt-2 text-xs font-semibold text-[var(--ee-brand)] hover:underline focus:outline-none cursor-pointer"
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-1 text-[var(--ee-muted)] opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
        aria-label="Close"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

// Legacy compatibility component
export const Toast: React.FC<{ message: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed right-4 bottom-4 z-[var(--ee-z-toast)] bg-[var(--ee-rail)] text-[var(--ee-rail-text)] px-4 py-2.5 rounded-[var(--ee-radius-md)] shadow-ee-lg text-sm">
      {message}
    </div>
  );
};
