"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg" | "xl";

const WIDTH: Record<Size, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Footer actions (buttons). If omitted, no footer is rendered. */
  footer?: ReactNode;
  className?: string;
  size?: Size;
};

/**
 * Generic slide-over panel. Used for order details, customer profiles,
 * media metadata, CMS section editing, etc.
 */
export function AdminDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  size = "md",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-drawer-title"
        className={cn(
          "admin-drawer-panel absolute right-0 top-0 flex h-full w-full flex-col border-l border-[var(--admin-border)] bg-[var(--admin-surface)]",
          WIDTH[size],
          className,
        )}
      >
        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--admin-border)] px-6 py-5">
          <div className="min-w-0">
            <h2
              id="admin-drawer-title"
              className="font-sans text-lg font-semibold text-[var(--admin-ink)]"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 font-sans text-sm text-[var(--admin-muted)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>

        {/* Body */}
        <div className="admin-drawer-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer ? (
          <footer className="shrink-0 border-t border-[var(--admin-border)] px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
