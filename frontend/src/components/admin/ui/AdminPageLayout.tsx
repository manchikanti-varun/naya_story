import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Primary actions (right side of header on desktop) */
  actions?: ReactNode;
  /** Toolbar row below header (search, filters) */
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  maxWidthClass?: string;
  /** Skip elevated header card — for nested CMS layouts */
  bareHeader?: boolean;
};

/**
 * Standard admin page scaffold: title, description, actions, optional toolbar, content.
 */
export function AdminPageLayout({
  eyebrow,
  title,
  description,
  actions,
  toolbar,
  children,
  className,
  maxWidthClass = "max-w-6xl",
  bareHeader = false,
}: Props) {
  return (
    <div className={cn("admin-page-shell mx-auto space-y-6", maxWidthClass, className)}>
      <header
        className={cn(
          !bareHeader &&
            "admin-page-header-card admin-surface-elevated rounded-[var(--admin-radius)] p-6 sm:p-8",
        )}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            {eyebrow ? <p className="admin-kicker">{eyebrow}</p> : null}
            <h1
              className={cn(
                "admin-page-title text-[var(--admin-ink)]",
                eyebrow ? "mt-2 text-2xl md:text-3xl" : "text-2xl md:text-3xl",
              )}
            >
              {title}
            </h1>
            {description ? (
              <div className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
                {description}
              </div>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      </header>

      {toolbar ? <div>{toolbar}</div> : null}

      <div className="space-y-6">{children}</div>
    </div>
  );
}
