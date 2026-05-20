import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const inputClass =
  "mt-1.5 w-full rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-3 py-2.5 font-sans text-sm text-[var(--admin-ink)] shadow-sm transition placeholder:text-[var(--admin-faint)] focus:border-[var(--admin-accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent-ring)]";

type LabelProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function AdminField({ label, hint, children, className }: LabelProps) {
  return (
    <label className={cn("block font-sans", className)}>
      <span className="text-xs font-medium text-[var(--admin-muted)]">{label}</span>
      {hint ? <span className="mt-0.5 block text-[11px] text-[var(--admin-faint)]">{hint}</span> : null}
      {children}
    </label>
  );
}

export function AdminInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, props.className)} {...props} />;
}

export function AdminTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "min-h-[88px] resize-y", props.className)} {...props} />;
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function AdminSelect({ className, ...props }: SelectProps) {
  return <select className={cn(inputClass, className)} {...props} />;
}
