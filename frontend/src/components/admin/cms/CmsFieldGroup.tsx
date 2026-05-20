import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Grouped CMS fields with consistent admin kicker styling. */
export function CmsFieldGroup({ title, description, actions, children, className }: Props) {
  return (
    <section className={cn("admin-cms-group", className)}>
      <div className="admin-cms-group-header">
        <div className="min-w-0">
          <h4 className="admin-cms-kicker">{title}</h4>
          {description ? (
            <p className="mt-1.5 font-sans text-xs leading-relaxed text-[var(--admin-muted)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="admin-cms-group-body">{children}</div>
    </section>
  );
}
