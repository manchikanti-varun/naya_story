"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
  inputClassName?: string;
  variant?: "store" | "admin";
};

const variantInput: Record<NonNullable<Props["variant"]>, string> = {
  store:
    "w-full rounded-2xl border border-ivory-deep py-3 pl-4 pr-12 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40",
  admin:
    "w-full rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] py-2.5 pl-3 pr-11 font-sans text-sm text-[var(--admin-ink)] shadow-sm transition placeholder:text-[var(--admin-faint)] focus:border-[var(--admin-accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent-ring)]",
};

export function PasswordInput({
  value,
  onChange,
  id,
  name,
  autoComplete,
  required,
  minLength,
  disabled,
  className,
  inputClassName,
  variant = "store",
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        name={name}
        className={cn(variantInput[variant], inputClassName)}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        disabled={disabled}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors",
          variant === "admin"
            ? "text-[var(--admin-faint)] hover:text-[var(--admin-ink)]"
            : "text-ink-soft hover:text-ink",
        )}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        ) : (
          <Eye className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        )}
      </button>
    </div>
  );
}
