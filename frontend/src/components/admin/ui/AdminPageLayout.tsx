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

/** Simple page scaffold: title, optional one-line description, content. */
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
    <div className={cn("admin-page-shell mx-auto space-y-6", maxWidthClass, className)}>
      <header className="admin-page-header">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="admin-page-title">{title}</h1>
            {description ? <div className="admin-page-desc">{description}</div> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      </header>

      {toolbar ? <div>{toolbar}</div> : null}

      <div className="space-y-5">{children}</div>
    </div>
  );
}
