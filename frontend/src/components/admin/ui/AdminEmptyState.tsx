import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Optional icon override — defaults to Inbox */
  icon?: ReactNode;
};

export function AdminEmptyState({ title, description, action, className, icon }: Props) {
  return (
    <div
      className={cn(
        "admin-empty-state flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--admin-surface-sunken)] text-[var(--admin-faint)]">
        {icon ?? <Inbox className="h-5 w-5" strokeWidth={1.5} />}
      </span>
      <p className="font-sans text-base font-semibold text-[var(--admin-ink)]">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm font-sans text-sm text-[var(--admin-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
