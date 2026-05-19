import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Wider layouts for tables and editors */
  maxWidthClass?: string;
};

export function AdminPageShell({
  eyebrow,
  title,
  description,
  children,
  className,
  maxWidthClass = "max-w-6xl",
}: Props) {
  return (
    <div className={cn("admin-page-shell mx-auto space-y-8", maxWidthClass, className)}>
      <header className="admin-surface-elevated rounded-2xl p-6 sm:p-8">
        {eyebrow ? (
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)] md:text-4xl">
          {title}
        </h1>
        {description ? (
          <div className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
            {description}
          </div>
        ) : null}
      </header>
      {children}
    </div>
  );
}
