import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
  size?: "sm" | "md";
};

const variantClass: Record<Variant, string> = {
  primary: "admin-btn--primary",
  secondary: "admin-btn--secondary",
  ghost: "admin-btn--ghost",
  danger: "admin-btn--danger",
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
        "admin-btn",
        size === "sm" ? "admin-btn--sm" : "admin-btn--md",
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
