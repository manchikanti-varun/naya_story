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
  sm: "p-3.5 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export function AdminCard({ children, className, padding = "md", elevated = false }: Props) {
  return (
    <div
      className={cn(
        elevated ? "admin-surface-elevated" : "admin-panel",
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
