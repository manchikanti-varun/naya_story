import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
  size?: "sm" | "md";
};

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-[#292524] to-[#1c1917] text-white shadow-md shadow-stone-900/12 ring-1 ring-white/10 hover:from-[#44403c] hover:to-[#292524] disabled:shadow-none",
  secondary:
    "border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-[var(--admin-ink)] shadow-sm hover:border-[var(--admin-accent)]/35 hover:bg-[var(--admin-surface-raised)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--admin-muted)] hover:border-[var(--admin-border)] hover:bg-black/[0.03] hover:text-[var(--admin-ink)]",
  danger:
    "border border-red-200/80 bg-red-50/80 text-red-900 hover:bg-red-100/90",
};

const sizes = {
  sm: "px-3.5 py-1.5 text-[10px] tracking-[0.14em]",
  md: "px-5 py-2.5 text-[11px] tracking-[0.14em]",
};

export function AdminButton({
  variant = "secondary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-sans font-semibold uppercase transition disabled:cursor-not-allowed disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
