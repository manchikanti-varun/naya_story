"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within AdminToastProvider");
  return ctx;
}

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success:
    "border-emerald-200/60 bg-gradient-to-r from-emerald-50/95 to-white/95 text-emerald-900",
  error:
    "border-red-200/60 bg-gradient-to-r from-red-50/95 to-white/95 text-red-900",
  info:
    "border-sky-200/60 bg-gradient-to-r from-sky-50/95 to-white/95 text-sky-900",
};

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    toast: addToast,
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex w-80 max-w-[calc(100vw-3rem)] animate-[admin-toast-in_0.3s_cubic-bezier(0.22,1,0.36,1)] items-start gap-3 rounded-[var(--admin-radius-sm)] border px-4 py-3.5 shadow-lg backdrop-blur-sm",
                styles[t.type],
              )}
              role="alert"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
              <p className="min-w-0 flex-1 font-sans text-sm font-medium leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-full p-1 opacity-60 transition hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
