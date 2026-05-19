import Link from "next/link";
import {
  ArrowUpRight,
  ImageIcon,
  LayoutGrid,
  Layers,
  Megaphone,
  Package,
  PanelsTopLeft,
  Sparkles,
} from "lucide-react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

const primary = [
  {
    title: "Homepage blocks",
    description: "Ordered modular sections — hero, rails, categories, and site-wide blocks in one map.",
    href: "/admin/storefront/homepage",
    icon: LayoutGrid,
  },
  {
    title: "Section editors",
    description: "Deep edits per block — copy, imagery, product IDs, and layout order.",
    href: "/admin/content/hero",
    icon: PanelsTopLeft,
  },
  {
    title: "Live preview",
    description: "Review draft storefront rendering before publishing changes.",
    href: "/admin/content/preview/hero",
    icon: Sparkles,
  },
];

const secondary = [
  {
    title: "Products",
    description: "Catalog engine — source of truth for everything shoppers can buy.",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Media library",
    description: "Centralized reusable assets for products, hero, and campaigns.",
    href: "/admin/media",
    icon: ImageIcon,
  },
  {
    title: "Collections page",
    description: "Tabs, pagination, and curated pins for the collections experience.",
    href: "/admin/content/collections",
    icon: Layers,
  },
  {
    title: "Promo & newsletter",
    description: "Top bar strip and footer signup — coordinated brand moments.",
    href: "/admin/content/promo-bar",
    icon: Megaphone,
  },
];

export default function StorefrontCmsHomePage() {
  return (
    <AdminPageShell
      eyebrow="Storefront CMS"
      title="Dynamic storefront control"
      maxWidthClass="max-w-5xl"
      description="Manage homepage composition, page-specific content, and site-wide modules. Changes publish through the same content API the storefront reads — refresh the shop to see updates instantly."
    >
      <section>
        <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-faint)]">
          Start here
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {primary.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="admin-surface group flex flex-col rounded-2xl p-5 transition hover:border-[var(--admin-border-strong)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex rounded-xl bg-[var(--admin-accent-soft)] p-2 text-[var(--admin-accent)]">
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--admin-faint)] transition group-hover:text-[var(--admin-ink)]" />
              </div>
              <h3 className="mt-4 font-sans text-base font-semibold text-[var(--admin-ink)]">{title}</h3>
              <p className="mt-2 flex-1 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-faint)]">
          Catalog & assets
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {secondary.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="admin-surface group flex flex-col rounded-2xl p-5 transition hover:border-[var(--admin-border-strong)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex rounded-xl bg-stone-100 p-2 text-stone-600">
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--admin-faint)] transition group-hover:text-[var(--admin-ink)]" />
              </div>
              <h3 className="mt-4 font-sans text-base font-semibold text-[var(--admin-ink)]">{title}</h3>
              <p className="mt-2 flex-1 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
