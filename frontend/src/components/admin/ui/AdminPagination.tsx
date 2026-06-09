"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: Props) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-4",
        className,
      )}
    >
      <p className="font-sans text-xs text-[var(--admin-muted)]">
        Showing{" "}
        <span className="font-medium tabular-nums text-[var(--admin-ink)]">
          {start}–{end}
        </span>{" "}
        of <span className="font-medium tabular-nums text-[var(--admin-ink)]">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] transition hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)] disabled:opacity-30 disabled:hover:border-[var(--admin-border)] disabled:hover:bg-transparent"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <span className="min-w-[3.5rem] text-center font-sans text-xs tabular-nums text-[var(--admin-muted)]">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] transition hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)] disabled:opacity-30 disabled:hover:border-[var(--admin-border)] disabled:hover:bg-transparent"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
