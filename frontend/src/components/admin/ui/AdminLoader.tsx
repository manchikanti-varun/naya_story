import { cn } from "@/lib/cn";

function AdminShimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-r from-[var(--admin-surface-raised)] via-[var(--admin-border)]/40 to-[var(--admin-surface-raised)] bg-[length:200%_100%] animate-[naya-shimmer_2s_ease-in-out_infinite]",
        className,
      )}
      aria-hidden
    />
  );
}

/** Route-level admin loading with editorial skeleton blocks. */
export function AdminRouteLoading() {
  return (
    <div className="min-h-[50vh] space-y-6 p-6 md:p-8" role="status" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-4">
        <span
          className="h-9 w-9 shrink-0 rounded-full border-2 border-transparent border-t-[var(--admin-accent)] border-r-[var(--admin-accent)]/30 naya-loader-orbit"
          aria-hidden
        />
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-[var(--admin-muted)]">
          Loading workspace…
        </p>
      </div>
      <AdminShimmer className="h-4 w-36" />
      <AdminShimmer className="h-9 max-w-md" />
      <AdminShimmer className="h-20 max-w-2xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminShimmer className="h-36" />
        <AdminShimmer className="h-36" />
      </div>
    </div>
  );
}

/** Inline CMS / panel loading state. */
export function AdminInlineLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-4"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-7 w-7 shrink-0 rounded-full border-2 border-transparent border-t-[var(--admin-accent)] naya-loader-orbit"
        aria-hidden
      />
      <p className="font-sans text-sm text-[var(--admin-muted)]">{label}</p>
    </div>
  );
}
