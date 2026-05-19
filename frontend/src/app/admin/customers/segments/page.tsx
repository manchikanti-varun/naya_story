import Link from "next/link";
import { Users } from "lucide-react";

export default function CustomersSegmentsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-faint)]">
          Customers
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">Segments</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Cohort builder (RFM, geography, lifetime value) will power campaigns and private collections. Export customer
          lists from the directory until automation ships.
        </p>
      </header>
      <div className="admin-surface rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Users className="h-7 w-7 shrink-0 text-[var(--admin-accent)]" strokeWidth={1.5} />
          <div className="font-sans text-sm text-[var(--admin-muted)]">
            <p className="font-medium text-[var(--admin-ink)]">Planned segments</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>VIP spenders</li>
              <li>Newsletter subscribers without purchase</li>
              <li>Return buyers in last 90 days</li>
            </ul>
          </div>
        </div>
      </div>
      <Link href="/admin/customers" className="font-sans text-sm font-medium text-[var(--admin-accent)] underline-offset-4 hover:underline">
        Customer list →
      </Link>
    </div>
  );
}
