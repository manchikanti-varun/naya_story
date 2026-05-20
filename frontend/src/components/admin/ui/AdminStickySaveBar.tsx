"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  dirty?: boolean;
  message?: string;
  children: ReactNode;
  className?: string;
};

export function AdminStickySaveBar({ dirty, message, children, className }: Props) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pt-6 lg:pl-[272px]",
        className,
      )}
    >
      <div className="pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-full border border-[var(--admin-border-strong)] bg-[var(--admin-surface)]/95 px-4 py-2.5 shadow-[var(--admin-shadow)] backdrop-blur-md">
        <div className="min-w-0 pl-1 font-sans text-xs text-[var(--admin-muted)]">
          {dirty ? (
            <span className="inline-flex items-center gap-2 font-medium text-amber-950">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden />
              Unsaved changes
            </span>
          ) : (
            <span className="text-[var(--admin-faint)]">{message ?? "In sync with live store"}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    </div>
  );
}
