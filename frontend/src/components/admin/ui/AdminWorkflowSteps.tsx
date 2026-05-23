"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type WorkflowStep = {
  label: string;
  detail?: ReactNode;
  href?: string;
  done?: boolean;
};

type Props = {
  title?: string;
  steps: WorkflowStep[];
  className?: string;
};

export function AdminWorkflowSteps({ title = "Suggested order", steps, className }: Props) {
  return (
    <section className={cn("admin-workflow-steps admin-surface-elevated rounded-[var(--admin-radius)] p-5 sm:p-6", className)}>
      <p className="admin-kicker">{title}</p>
      <ol className="mt-4 space-y-4">
        {steps.map((step, i) => (
          <li key={step.label} className="flex gap-4">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-sans text-xs font-semibold",
                step.done
                  ? "bg-[var(--admin-accent)] text-white"
                  : "border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-[var(--admin-muted)]",
              )}
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              {step.href ? (
                <Link
                  href={step.href}
                  className="font-sans text-sm font-semibold text-[var(--admin-ink)] underline-offset-4 hover:text-[var(--admin-accent)] hover:underline"
                >
                  {step.label}
                </Link>
              ) : (
                <p className="font-sans text-sm font-semibold text-[var(--admin-ink)]">{step.label}</p>
              )}
              {step.detail ? (
                <p className="mt-1 font-sans text-xs leading-relaxed text-[var(--admin-muted)]">{step.detail}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
