"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export type AdminTabItem = {
  id: string;
  label: string;
  href?: string;
};

type Props = {
  tabs: AdminTabItem[];
  activeId: string;
  onChange?: (id: string) => void;
  className?: string;
};

export function AdminTabs({ tabs, activeId, onChange, className }: Props) {
  return (
    <nav className={cn("admin-page-tabs", className)} aria-label="Sections">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const classNames = cn("admin-page-tab", active && "admin-page-tab--active");

        if (tab.href) {
          return (
            <Link key={tab.id} href={tab.href} className={classNames} data-active={active}>
              {tab.label}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            className={classNames}
            data-active={active}
            onClick={() => onChange?.(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
