import Link from "next/link";
import { LayoutGrid, Package } from "lucide-react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { websitePagesUrl } from "@/lib/admin/website-pages";

const lanes = [
  {
    href: websitePagesUrl("homepage", { edit: "bestsellers" }),
    title: "Bestsellers rail",
    description: "Curate SKUs for the homepage bestseller strip.",
    icon: LayoutGrid,
  },
  {
    href: websitePagesUrl("homepage", { edit: "newIn" }),
    title: "New In rail",
    description: "Fresh arrivals row on the homepage.",
    icon: Package,
  },
];

export default function MarketingFeaturedPage() {
  return (
    <AdminPageLayout
      eyebrow="Marketing"
      title="Featured placements"
      maxWidthClass="max-w-3xl"
      description="Homepage merchandising is driven by explicit product IDs so merchandisers control the story without duplicate catalog entries."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {lanes.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group block h-full">
            <AdminCard className="h-full transition hover:border-[var(--admin-border-strong)]" padding="md">
              <Icon className="h-4 w-4 text-[var(--admin-accent)]" strokeWidth={1.65} aria-hidden />
              <p className="mt-3 font-sans text-sm font-semibold text-[var(--admin-ink)]">{title}</p>
              <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">{description}</p>
            </AdminCard>
          </Link>
        ))}
      </div>
    </AdminPageLayout>
  );
}
