import Link from "next/link";
import { Activity } from "lucide-react";

export default function CustomersActivityPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-faint)]">
          Customers
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">Activity</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Unified timeline (orders, wishlists, sessions, support notes) will give stylists full context. Wire events as
          the data model matures.
        </p>
      </header>
      <div className="admin-surface flex gap-4 rounded-2xl p-5">
        <Activity className="h-8 w-8 shrink-0 text-[var(--admin-accent)]" strokeWidth={1.5} />
        <p className="font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Today: infer engagement from order history inside each customer profile (list view shows registered accounts).
        </p>
      </div>
      <Link href="/admin/customers" className="font-sans text-sm font-medium text-[var(--admin-accent)] underline-offset-4 hover:underline">
        Customer list →
      </Link>
    </div>
  );
}
