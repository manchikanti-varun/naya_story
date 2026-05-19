import Link from "next/link";
import { Package, Truck } from "lucide-react";

export default function OrdersShippingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-faint)]">
          Orders
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">Shipping</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Carrier profiles, SLA cut-offs, and packaging presets will live here. Today, capture tracking numbers inline on
          the orders board — updates publish to shoppers on refresh.
        </p>
      </header>
      <div className="admin-surface flex gap-4 rounded-2xl p-5">
        <Truck className="h-8 w-8 shrink-0 text-[var(--admin-accent)]" strokeWidth={1.5} />
        <div>
          <h2 className="font-sans text-base font-semibold text-[var(--admin-ink)]">Operational checklist</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 font-sans text-sm text-[var(--admin-muted)]">
            <li>Confirm paid orders before dispatch</li>
            <li>Paste AWB / tracking on each row</li>
            <li>Move status to <em>shipped</em> when handed to carrier</li>
          </ul>
        </div>
      </div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 font-sans text-sm font-medium text-[var(--admin-accent)] underline-offset-4 hover:underline"
      >
        <Package className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        Open orders board
      </Link>
    </div>
  );
}
