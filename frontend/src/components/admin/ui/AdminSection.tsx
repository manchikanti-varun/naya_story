import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminSection({ title, description, actions, children, className }: Props) {
  return (
    <section className={cn("space-y-4", className)}>
      {title || description || actions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="admin-section-heading">{title}</h2> : null}
            {description ? (
              <p className="mt-1 max-w-2xl font-sans text-sm text-[var(--admin-muted)]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
