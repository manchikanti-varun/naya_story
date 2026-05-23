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
        "admin-panel flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
