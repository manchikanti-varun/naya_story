"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/cn";

export type TimelineStep = {
  id: string;
  label: string;
  description?: string;
  timestamp?: string;
};

type Props = {
  steps: TimelineStep[];
  currentStepId: string;
  className?: string;
};

export function AdminStatusTimeline({ steps, currentStepId, className }: Props) {
  const currentIdx = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className={cn("relative", className)} role="list" aria-label="Status timeline">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isUpcoming = idx > currentIdx;

        return (
          <div
            key={step.id}
            className="relative flex gap-4 pb-8 last:pb-0"
            role="listitem"
            aria-current={isCurrent ? "step" : undefined}
          >
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 rounded-full",
                  isCompleted
                    ? "bg-emerald-400"
                    : isCurrent
                      ? "bg-gradient-to-b from-[var(--admin-accent)] to-[var(--admin-border)]"
                      : "bg-[var(--admin-border)]",
                )}
                aria-hidden
              />
            )}

            {/* Step icon */}
            <div className="relative z-10 shrink-0">
              {isCompleted ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 ring-2 ring-emerald-400/30">
                  <Check className="h-3.5 w-3.5 text-emerald-700" strokeWidth={2.5} />
                </div>
              ) : isCurrent ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--admin-accent-soft)] ring-2 ring-[var(--admin-accent)]/30">
                  <Circle className="h-3 w-3 fill-[var(--admin-accent)] text-[var(--admin-accent)]" strokeWidth={0} />
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--admin-border)] bg-[var(--admin-surface)]">
                  <Circle className="h-2.5 w-2.5 text-[var(--admin-faint)]" strokeWidth={0} fill="currentColor" />
                </div>
              )}
            </div>

            {/* Step content */}
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "font-sans text-sm font-medium",
                  isCompleted
                    ? "text-emerald-800"
                    : isCurrent
                      ? "text-[var(--admin-ink)]"
                      : "text-[var(--admin-faint)]",
                )}
              >
                {step.label}
              </p>
              {step.description ? (
                <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">
                  {step.description}
                </p>
              ) : null}
              {step.timestamp ? (
                <p className="mt-1 font-sans text-[10px] tabular-nums text-[var(--admin-faint)]">
                  {step.timestamp}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
