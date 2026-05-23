"use client";

import type { ReactNode } from "react";
import { CircleHelp, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "tip" | "warning";

const toneStyles: Record<Tone, { box: string; icon: typeof Info }> = {
  info: {
    box: "border-[var(--admin-border)] bg-[var(--admin-surface-raised)] text-[var(--admin-muted)]",
    icon: Info,
  },
  tip: {
    box: "border-[var(--admin-accent)]/25 bg-[var(--admin-accent-soft)] text-[var(--admin-ink)]",
    icon: Lightbulb,
  },
  warning: {
    box: "border-amber-200/80 bg-amber-50/90 text-amber-950",
    icon: TriangleAlert,
  },
};

type Props = {
  title?: string;
  children: ReactNode;
  tone?: Tone;
  className?: string;
  /** Optional action (link or button) on the right */
  action?: ReactNode;
};

export function AdminHelpBanner({ title, children, tone = "tip", className, action }: Props) {
  const Icon = tone === "info" ? CircleHelp : toneStyles[tone].icon;
  return (
    <div
      className={cn(
        "admin-help-banner flex flex-col gap-3 rounded-[var(--admin-radius)] border px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5",
        toneStyles[tone].box,
        className,
      )}
      role="note"
    >
      <div className="flex min-w-0 gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
        <div className="min-w-0 font-sans text-sm leading-relaxed">
          {title ? <p className="mb-1 font-semibold text-[var(--admin-ink)]">{title}</p> : null}
          <div className={title ? "" : ""}>{children}</div>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
