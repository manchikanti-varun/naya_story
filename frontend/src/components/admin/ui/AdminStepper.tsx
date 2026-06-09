"use client";

import { cn } from "@/lib/cn";
import { Check } from "lucide-react";

export type StepperStep = {
  id: string;
  label: string;
};

type Props = {
  steps: StepperStep[];
  currentStepId: string;
  /** If true, shows cancelled state (red cross-through) */
  cancelled?: boolean;
  className?: string;
};

/**
 * Horizontal workflow stepper for order status visualization.
 * Shows progression through ordered steps with completed/active/pending states.
 */
export function AdminStepper({ steps, currentStepId, cancelled = false, className }: Props) {
  const currentIdx = steps.findIndex((s) => s.id === currentStepId);

  if (cancelled) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600">
          <span className="text-sm font-bold">×</span>
        </div>
        <span className="font-sans text-sm font-medium text-red-700">Cancelled</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isCompleted && "bg-emerald-100 text-emerald-700",
                  isCurrent && "bg-[var(--admin-accent)] text-white shadow-md",
                  isPending && "border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-[var(--admin-faint)]",
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 whitespace-nowrap font-sans text-[10px] font-medium",
                  isCompleted && "text-emerald-700",
                  isCurrent && "font-semibold text-[var(--admin-ink)]",
                  isPending && "text-[var(--admin-faint)]",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1.5 h-0.5 w-6 sm:w-10 rounded-full",
                  idx < currentIdx ? "bg-emerald-300" : "bg-[var(--admin-border)]",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
