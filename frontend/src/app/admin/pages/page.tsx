import Link from "next/link";
import { ArrowUpRight, Globe, Home, ImageIcon, Package, ShoppingBag } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminCard } from "@/components/admin/ui/AdminCard";

import { websitePagesUrl } from "@/lib/admin/website-pages";

const cards = [
  {
    title: "Website → Pages",
    description: "Homepage builder, collections browse, New In, and Our Story.",
    href: websitePagesUrl("homepage"),
    icon: Home,
  },
  {
    title: "Products",
    description: "Catalog — what you sell. Homepage rails pick from here.",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Orders",
    description: "Fulfillment status and tracking.",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Media library",
    description: "Reusable image URLs for CMS and products.",
    href: "/admin/media",
    icon: ImageIcon,
  },
];

export default function AdminMapPage() {
  return (
    <AdminPageLayout
      eyebrow="System"
      title="Admin map"
      maxWidthClass="max-w-3xl"
      description="Quick reference — sidebar follows workflows: Website, Products, Orders, Customers, Marketing."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ title, description, href, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="group block h-full">
              <AdminCard className="flex h-full flex-col transition hover:border-[var(--admin-border-strong)]" padding="md">
                <Icon className="h-5 w-5 text-[var(--admin-accent)]" strokeWidth={1.5} aria-hidden />
                <h2 className="mt-3 font-sans text-sm font-semibold text-[var(--admin-ink)]">{title}</h2>
                <p className="mt-2 flex-1 font-sans text-xs text-[var(--admin-muted)]">{description}</p>
                <ArrowUpRight className="mt-3 h-4 w-4 text-[var(--admin-faint)] group-hover:text-[var(--admin-ink)]" />
              </AdminCard>
            </Link>
          </li>
        ))}
      </ul>
      <p className="font-sans text-xs text-[var(--admin-muted)]">
        <Globe className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        Legacy URLs under <code className="font-mono">/admin/content/*</code> and{" "}
        <code className="font-mono">/admin/storefront/*</code> redirect automatically.
      </p>
    </AdminPageLayout>
  );
}
