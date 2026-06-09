"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const WIDTH: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: Size;
  className?: string;
};

export function AdminModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

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

  // Trap focus inside modal
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--admin-ink)]/30 backdrop-blur-[3px] transition-opacity"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className={cn(
          "relative w-full animate-[admin-modal-in_0.2s_cubic-bezier(0.32,0.72,0,1)] rounded-[var(--admin-radius-xl)] border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-lg)]",
          WIDTH[size],
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--admin-border)] px-5 py-4">
          <div className="min-w-0">
            <h2
              id="admin-modal-title"
              className="font-sans text-base font-semibold text-[var(--admin-ink)]"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 font-sans text-sm text-[var(--admin-muted)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-[var(--admin-border)] p-1.5 text-[var(--admin-muted)] transition hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-sunken)] hover:text-[var(--admin-ink)]"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </header>

        <div className="px-5 py-4">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-5 py-3.5 rounded-b-[var(--admin-radius-xl)]">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/** Convenience: Destructive confirmation modal. */
export function AdminConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Delete",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn--md admin-btn--ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="admin-btn admin-btn--md admin-btn--danger"
          >
            {loading ? "Processing…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="font-sans text-sm text-[var(--admin-muted)]">
        This action cannot be undone.
      </p>
    </AdminModal>
  );
}
