"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { CmsEditorProvider } from "@/components/admin/cms/CmsEditorContext";
import { cn } from "@/lib/cn";

type Size = "md" | "lg" | "xl";

const WIDTH: Record<Size, string> = {
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
  className?: string;
  size?: Size;
};

/** Slide-over panel for in-context CMS editing (Shopify-style). */
export function AdminDrawer({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "lg",
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
        className="absolute inset-0 bg-[var(--admin-ink)]/30 backdrop-blur-[3px] transition-opacity"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-drawer-title"
        className={cn(
          "admin-drawer-panel absolute right-0 top-0 flex h-full w-full flex-col border-l border-[var(--admin-border-strong)] bg-[var(--admin-surface)] shadow-2xl",
          WIDTH[size],
          className,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--admin-border)] bg-gradient-to-b from-[var(--admin-surface-raised)] to-[var(--admin-surface)] px-6 py-5">
          <div className="min-w-0">
            <p className="admin-kicker">Edit section</p>
            <h2
              id="admin-drawer-title"
              className="admin-page-title mt-1 text-lg text-[var(--admin-ink)] md:text-xl"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] transition hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>
        <div className="admin-drawer-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <CmsEditorProvider compact>{children}</CmsEditorProvider>
        </div>
      </aside>
    </div>
  );
}
