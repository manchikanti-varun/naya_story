"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const WIDTH: Record<Size, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
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
        className="absolute inset-0 bg-[var(--admin-ink)]/40 backdrop-blur-[3px] transition-opacity"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className={cn(
          "relative w-full animate-[admin-modal-in_0.2s_cubic-bezier(0.22,1,0.36,1)] rounded-[var(--admin-radius)] border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow)]",
          WIDTH[size],
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--admin-border)] px-6 py-5">
          <div className="min-w-0">
            <h2
              id="admin-modal-title"
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
            className="shrink-0 rounded-full border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] transition hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </header>

        <div className="px-6 py-5">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--admin-border)] px-6 py-4">
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
