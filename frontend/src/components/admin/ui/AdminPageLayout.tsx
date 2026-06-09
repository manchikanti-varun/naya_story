import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  description?: ReactNode;
  /** Primary actions (right side of header on desktop) */
  actions?: ReactNode;
  /** Toolbar row below header (search, filters) */
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  maxWidthClass?: string;
};

/** Page scaffold: title, optional description, content with consistent spacing. */
export function AdminPageLayout({
  title,
  description,
  actions,
  toolbar,
  children,
  className,
  maxWidthClass = "max-w-6xl",
}: Props) {
  return (
    <div className={cn("admin-page-shell mx-auto space-y-5", maxWidthClass, className)}>
      <header className="admin-page-header">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="admin-page-title">{title}</h1>
            {description ? <div className="admin-page-desc">{description}</div> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </header>

      {toolbar ? <div className="pb-0.5">{toolbar}</div> : null}

      <div className="space-y-4">{children}</div>
    </div>
  );
}
