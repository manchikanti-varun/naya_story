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
 * KPI metric card with trend indicator.
 * Shows growth/decline arrow and percentage change.
 */
export function AdminKPITrend({ label, value, trend, trendLabel, icon: Icon, accent }: Props) {
  const isPositive = trend !== undefined && trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <AdminCard
      padding="md"
      className={cn(
        "admin-metric-card h-full",
        accent && "border-amber-200/70 bg-amber-50/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="admin-metric-label">{label}</p>
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-[var(--admin-accent-bright)]" strokeWidth={1.5} aria-hidden />
        ) : null}
      </div>
      <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)] md:text-3xl">
        {value}
      </p>
      {trend !== undefined ? (
        <div className="mt-2 flex items-center gap-1.5">
          <TrendIcon
            className={cn(
              "h-3.5 w-3.5",
              isPositive ? "text-emerald-600" : "text-red-500",
            )}
            strokeWidth={2}
          />
          <span
            className={cn(
              "font-sans text-xs font-semibold tabular-nums",
              isPositive ? "text-emerald-700" : "text-red-600",
            )}
          >
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
