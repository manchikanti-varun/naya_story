"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/cn";

type Props<K extends string = string> = {
  label: string;
  sortKey: K;
  activeKey: K;
  dir: "asc" | "desc";
  onSort: (key: K) => void;
  align?: "left" | "right";
};

/**
 * Sortable table header button — use inside `<th>`.
 * Shows directional arrow when active, neutral indicator otherwise.
 */
export function AdminSortableHeader<K extends string = string>({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = "left",
}: Props<K>) {
  const active = activeKey === sortKey;
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th className={align === "right" ? "text-right" : "text-left"}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] transition",
          align === "right" && "ml-auto",
          active
            ? "text-[var(--admin-ink)]"
            : "text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} aria-hidden />
      </button>
    </th>
  );
}
