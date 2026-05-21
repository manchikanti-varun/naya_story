import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
};

export function AuthField({ label, htmlFor, hint, error, children, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="font-sans text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="font-sans text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const authInputClass =
  "w-full rounded-2xl border border-ivory-deep bg-white px-4 py-3 font-sans text-sm text-ink outline-none transition placeholder:text-ink-soft/70 focus:border-gold/50 focus:ring-2 focus:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-60";
