import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const inputClass = "admin-input mt-1.5 w-full";

type LabelProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function AdminField({ label, hint, children, className }: LabelProps) {
  return (
    <label className={cn("block", className)}>
      <span className="admin-label">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-relaxed text-[var(--admin-faint)]">{hint}</span> : null}
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
