import Link from "next/link";

export default function StorefrontNavigationStubPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-faint)]">
          Storefront CMS
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">Navigation</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Mega-menu, featured links, and mobile navigation will be managed here. Today the live header still follows
          product taxonomy — this module is reserved for the next CMS iteration.
        </p>
      </header>
      <div className="admin-surface rounded-2xl p-6">
        <p className="font-sans text-sm text-[var(--admin-muted)]">
          Until navigation is fully data-driven, update collection URLs from{" "}
          <Link className="font-medium text-[var(--admin-accent)] underline-offset-4 hover:underline" href="/admin/content/collections">
            Collections page
          </Link>{" "}
          and category destinations from{" "}
          <Link className="font-medium text-[var(--admin-accent)] underline-offset-4 hover:underline" href="/admin/content/categories">
            Categories
          </Link>
          .
        </p>
        <Link
          href="/admin/storefront"
          className="mt-6 inline-flex font-sans text-sm font-medium text-[var(--admin-ink)] underline-offset-4 hover:underline"
        >
          ← Back to CMS home
        </Link>
      </div>
    </div>
  );
}
