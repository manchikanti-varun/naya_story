import Link from "next/link";
import { Compass, FileText, Palette } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminToolbar } from "@/components/admin/ui/AdminToolbar";
import { storeNavRowsForAdmin } from "@/lib/store-nav";
import { websitePagesUrl } from "@/lib/admin/website-pages";

export default function WebsiteNavigationPage() {
  const rows = storeNavRowsForAdmin();

  return (
    <AdminPageLayout
      title="Store navigation"
      maxWidthClass="max-w-3xl"
      description="Menu links in the store header."
    >
      <AdminToolbar className="mb-6">
        <p className="font-sans text-xs text-[var(--admin-muted)]">
          Menu structure is version-controlled today; this screen is your operational map. CMS-driven IA
          can replace static links in a future release.
        </p>
      </AdminToolbar>

      <AdminCard padding="md" className="mb-8">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
          Live primary links
        </h2>
        <ul className="mt-4 divide-y divide-[var(--admin-border)]">
          {rows.map((row) => (
            <li
              key={row.href + row.label}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"
            >
              <span className="font-sans text-sm font-medium text-[var(--admin-ink)]">{row.label}</span>
              <code className="rounded-md bg-[var(--admin-surface-raised)] px-2 py-1 font-mono text-[11px] text-[var(--admin-muted)]">
                {row.href}
              </code>
            </li>
          ))}
        </ul>
      </AdminCard>

      <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
        Related workflows
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        <li>
          <Link href="/admin/website/pages" className="group block h-full">
            <AdminCard className="h-full transition hover:border-[var(--admin-border-strong)]" padding="md">
              <FileText className="h-4 w-4 text-[var(--admin-accent)]" strokeWidth={1.65} aria-hidden />
              <p className="mt-3 font-sans text-sm font-semibold text-[var(--admin-ink)]">Pages</p>
              <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">
                Homepage, /collections browse, New In, and Our Story.
              </p>
            </AdminCard>
          </Link>
        </li>
        <li>
          <Link href="/admin/website/theme" className="group block h-full">
            <AdminCard className="h-full transition hover:border-[var(--admin-border-strong)]" padding="md">
              <Palette className="h-4 w-4 text-[var(--admin-accent)]" strokeWidth={1.65} aria-hidden />
              <p className="mt-3 font-sans text-sm font-semibold text-[var(--admin-ink)]">Theme Studio</p>
              <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">
                Typography and color tokens that wrap every page, including the header.
              </p>
            </AdminCard>
          </Link>
        </li>
        <li className="sm:col-span-2">
          <Link href={websitePagesUrl("homepage")} className="group block h-full">
            <AdminCard className="h-full transition hover:border-[var(--admin-border-strong)]" padding="md">
              <Compass className="h-4 w-4 text-[var(--admin-accent)]" strokeWidth={1.65} aria-hidden />
              <p className="mt-3 font-sans text-sm font-semibold text-[var(--admin-ink)]">Homepage builder</p>
              <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">
                Hero, rails, and editorial sections — separate from the slim header links above.
              </p>
            </AdminCard>
          </Link>
        </li>
      </ul>
    </AdminPageLayout>
  );
}
