import Link from "next/link";
import { MapPin } from "lucide-react";

export default function OrdersTrackingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-faint)]">
          Orders
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">Tracking</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Webhook-driven carrier events and bulk AWB imports will centralize here. Use the orders table to persist
          tracking numbers today.
        </p>
      </header>
      <div className="admin-surface flex gap-4 rounded-2xl p-5">
        <MapPin className="h-8 w-8 shrink-0 text-[var(--admin-accent)]" strokeWidth={1.5} />
        <p className="font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Shoppers see tracking on their account area once the storefront refetches order data (same live-sync channel as
          CMS when fulfilment fields are exposed publicly).
        </p>
      </div>
      <Link href="/admin/orders" className="font-sans text-sm font-medium text-[var(--admin-accent)] underline-offset-4 hover:underline">
        Orders board →
      </Link>
    </div>
  );
}
