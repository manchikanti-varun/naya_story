export default function AdminLoading() {
  return (
    <div className="min-h-[40vh] space-y-4 p-6 md:p-8">
      <div className="h-4 w-40 animate-pulse rounded bg-[var(--admin-surface-raised)]" />
      <div className="h-9 max-w-md animate-pulse rounded-lg bg-[var(--admin-surface-raised)]" />
      <div className="h-20 max-w-2xl animate-pulse rounded-xl bg-[var(--admin-surface-raised)]" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-36 animate-pulse rounded-[var(--admin-radius)] bg-[var(--admin-surface-raised)]" />
        <div className="h-36 animate-pulse rounded-[var(--admin-radius)] bg-[var(--admin-surface-raised)]" />
      </div>
    </div>
  );
}
