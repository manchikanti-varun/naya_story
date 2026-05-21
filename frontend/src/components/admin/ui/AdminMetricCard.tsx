import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  accent?: boolean;
};

export function AdminMetricCard({ label, value, hint, icon: Icon, href, accent }: Props) {
  const card = (
    <AdminCard
      padding="md"
      className={cn(
        "admin-metric-card h-full",
        accent && "border-amber-200/70 bg-amber-50/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
          {label}
        </p>
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-[var(--admin-accent-bright)]" strokeWidth={1.5} aria-hidden />
        ) : null}
      </div>
      <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)] md:text-3xl">
        {value}
      </p>
      {hint ? <p className="mt-2 font-sans text-[11px] leading-relaxed text-[var(--admin-muted)]">{hint}</p> : null}
    </AdminCard>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {card}
      </Link>
    );
  }
  return card;
}
