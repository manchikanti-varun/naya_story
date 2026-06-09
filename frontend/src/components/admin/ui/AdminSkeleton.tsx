import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Rounded shape variant */
  variant?: "text" | "circle" | "card" | "image";
};

const variantClass = {
  text: "h-4 w-full rounded-md",
  circle: "h-10 w-10 rounded-full",
  card: "h-32 w-full rounded-[var(--admin-radius)]",
  image: "aspect-[4/3] w-full rounded-[var(--admin-radius)]",
};

export function AdminSkeleton({ className, variant = "text" }: Props) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[var(--admin-surface-raised)]",
        variantClass[variant],
        className,
      )}
      aria-hidden
    />
  );
}

/** Prebuilt skeleton: Metric cards row */
export function AdminMetricsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="admin-panel space-y-3 p-5"
        >
          <AdminSkeleton className="h-3 w-24" />
          <AdminSkeleton className="h-8 w-32" />
          <AdminSkeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Prebuilt skeleton: Table rows */
export function AdminTableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="admin-panel overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <AdminSkeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-[var(--admin-border)] px-4 py-4 last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <AdminSkeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Prebuilt skeleton: Page layout with title + cards */
export function AdminPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <AdminSkeleton className="h-7 w-48" />
        <AdminSkeleton className="h-4 w-72" />
      </div>
      <AdminMetricsSkeleton />
      <AdminTableSkeleton />
    </div>
  );
}
