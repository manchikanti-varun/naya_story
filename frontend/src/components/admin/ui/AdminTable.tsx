import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  /** Hide on small screens — pair with mobile card list */
  responsiveHide?: "sm" | "md" | "lg";
};

const hideMap = {
  sm: "hidden sm:block",
  md: "hidden md:block",
  lg: "hidden lg:block",
};

/** Consistent data table shell — use with `admin-table` class on `<table>`. */
export function AdminTable({ children, className, responsiveHide = "md" }: Props) {
  return (
    <div className={cn("admin-table-wrap", hideMap[responsiveHide], className)}>
      {children}
    </div>
  );
}
