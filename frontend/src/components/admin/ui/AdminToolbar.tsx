import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children?: ReactNode;
  className?: string;
};

/** Filters, search, and bulk actions row — consistent spacing above tables/lists. */
export function AdminToolbar({ children, className }: Props) {
  if (!children) return null;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[var(--admin-shadow-sm)] sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
