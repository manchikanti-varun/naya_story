import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { AdminCard } from "./AdminCard";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string;
  /** Percentage change vs previous period. Positive = growth. */
  trend?: number;
  /** Period label for the trend (e.g. "vs last 7d") */
  trendLabel?: string;
  icon?: LucideIcon;
  href?: string;
  accent?: boolean;
};

/**
 * KPI metric card with trend indicator — Stripe-style presentation.
 * Shows growth/decline with clear visual hierarchy.
 */
export function AdminKPITrend({ label, value, trend, trendLabel, icon: Icon, accent }: Props) {
  const isPositive = trend !== undefined && trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <AdminCard
      padding="md"
      className={cn(
        "admin-metric-card group h-full",
        accent && "border-amber-200/60 bg-amber-50/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="admin-metric-label">{label}</p>
        {Icon ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-surface-sunken)] text-[var(--admin-muted)] transition-colors group-hover:bg-[var(--admin-accent-soft)] group-hover:text-[var(--admin-accent-bright)]">
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="admin-metric-value mt-2.5 text-[1.625rem] tabular-nums text-[var(--admin-ink)]">
        {value}
      </p>
      {trend !== undefined ? (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-sans text-[10px] font-semibold tabular-nums",
              isPositive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600",
            )}
          >
            <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
            {isPositive ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          {trendLabel ? (
            <span className="font-sans text-[10px] text-[var(--admin-faint)]">{trendLabel}</span>
          ) : null}
        </div>
      ) : null}
    </AdminCard>
  );
}
