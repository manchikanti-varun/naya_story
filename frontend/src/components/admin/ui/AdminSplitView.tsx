"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Left panel (master list) */
  list: ReactNode;
  /** Right panel (detail view) */
  detail: ReactNode;
  /** Whether a detail item is selected (shows detail panel on mobile) */
  hasSelection?: boolean;
  /** Left panel width class */
  listWidth?: string;
  className?: string;
};

/**
 * Master-detail split layout for admin workspaces.
 * Desktop: side-by-side panels with resizable border.
 * Mobile: list view; slides to detail when item selected.
 */
export function AdminSplitView({
  list,
  detail,
  hasSelection = false,
  listWidth = "w-[420px] min-w-[320px] max-w-[500px]",
  className,
}: Props) {
  return (
    <div className={cn("flex h-full min-h-0 overflow-hidden", className)}>
      {/* List Panel */}
      <div
        className={cn(
          "shrink-0 overflow-hidden border-r border-[var(--admin-border)] bg-[var(--admin-surface)]",
          listWidth,
          // On mobile, hide list when detail is shown
          hasSelection ? "hidden lg:flex lg:flex-col" : "flex flex-col",
        )}
      >
        {list}
      </div>

      {/* Detail Panel */}
      <div
        className={cn(
          "min-w-0 flex-1 overflow-hidden bg-[var(--admin-surface-raised)]",
          // On mobile, show detail only when selected
          hasSelection ? "flex flex-col" : "hidden lg:flex lg:flex-col",
        )}
      >
        {detail}
      </div>
    </div>
  );
}
