import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  elevated?: boolean;
};

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function AdminCard({ children, className, padding = "md", elevated = false }: Props) {
  return (
    <div
      className={cn(
        elevated ? "admin-surface-elevated" : "admin-surface",
        "rounded-[var(--admin-radius)]",
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
