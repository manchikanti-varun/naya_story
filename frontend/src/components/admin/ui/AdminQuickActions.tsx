"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

type Props = {
  actions: QuickAction[];
  className?: string;
};

export function AdminQuickActions({ actions, className }: Props) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[var(--admin-shadow-sm)] transition-all hover:border-[rgba(166,124,50,0.28)] hover:shadow-[var(--admin-shadow)] hover:-translate-y-0.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] transition group-hover:bg-[var(--admin-accent)] group-hover:text-white">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">
                {action.label}
              </p>
              {action.description ? (
                <p className="mt-0.5 truncate font-sans text-[11px] text-[var(--admin-faint)]">
                  {action.description}
                </p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
