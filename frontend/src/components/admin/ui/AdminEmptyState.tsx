import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function AdminEmptyState({ title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--admin-radius)] border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-raised)]/60 px-6 py-14 text-center",
        className,
      )}
    >
      <p className="admin-page-title text-lg text-[var(--admin-ink)]">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm font-sans text-sm text-[var(--admin-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
