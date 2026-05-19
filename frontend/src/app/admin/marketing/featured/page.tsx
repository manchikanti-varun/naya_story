import Link from "next/link";
import { LayoutGrid, Package } from "lucide-react";

export default function MarketingFeaturedPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-faint)]">
          Marketing
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">
          Featured placements
        </h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Homepage merchandising is driven by explicit product IDs so merchandisers control the story without duplicate
          catalog entries.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/content/bestsellers"
          className="admin-surface flex flex-col rounded-2xl p-5 transition hover:border-[var(--admin-border-strong)]"
        >
          <LayoutGrid className="h-6 w-6 text-[var(--admin-accent)]" strokeWidth={1.5} />
          <h2 className="mt-4 font-sans text-base font-semibold text-[var(--admin-ink)]">Bestsellers rail</h2>
          <p className="mt-2 font-sans text-sm text-[var(--admin-muted)]">Curate SKUs for the homepage bestseller strip.</p>
        </Link>
        <Link
          href="/admin/content/new-in-home"
          className="admin-surface flex flex-col rounded-2xl p-5 transition hover:border-[var(--admin-border-strong)]"
        >
          <Package className="h-6 w-6 text-[var(--admin-accent)]" strokeWidth={1.5} />
          <h2 className="mt-4 font-sans text-base font-semibold text-[var(--admin-ink)]">New In rail</h2>
          <p className="mt-2 font-sans text-sm text-[var(--admin-muted)]">Fresh arrivals row on the homepage.</p>
        </Link>
      </div>
      <Link href="/admin/products" className="font-sans text-sm font-medium text-[var(--admin-accent)] underline-offset-4 hover:underline">
        Browse catalog for IDs →
      </Link>
    </div>
  );
}
