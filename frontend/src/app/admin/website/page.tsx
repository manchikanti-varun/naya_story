import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  ImageIcon,
  LayoutGrid,
  Megaphone,
  Navigation2,
  Palette,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { websitePagesUrl } from "@/lib/admin/website-pages";

const links = [
  {
    href: websitePagesUrl("homepage"),
    title: "Pages",
    description: "Homepage builder, /collections browse, New In, and Our Story.",
    icon: FileText,
  },
  {
    href: "/admin/website/navigation",
    title: "Navigation",
    description: "Primary header menu map and links to related merchandising tools.",
    icon: Navigation2,
  },
  {
    href: "/admin/website/footer",
    title: "Footer",
    description: "Legal links, contact, and brand lockup.",
    icon: LayoutGrid,
  },
  {
    href: "/admin/website/announcement-bar",
    title: "Announcement bar",
    description: "Thin promo strip above navigation.",
    icon: Megaphone,
  },
  {
    href: "/admin/website/theme",
    title: "Theme Studio",
    description: "Global brand colors and typography tokens.",
    icon: Palette,
  },
  {
    href: "/admin/media",
    title: "Media library",
    description: "Reusable image URLs for hero, products, and campaigns.",
    icon: ImageIcon,
  },
];

export default function WebsiteHubPage() {
  return (
    <AdminPageLayout
      eyebrow="Website"
      title="What customers see"
      maxWidthClass="max-w-5xl"
      description="Everything that shapes the public storefront experience — separate from catalog and orders."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, title, description, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="group block h-full">
              <AdminCard className="flex h-full flex-col transition hover:border-[var(--admin-border-strong)]" padding="md">
                <span className="inline-flex rounded-xl bg-[var(--admin-accent-soft)] p-2 text-[var(--admin-accent)]">
                  <Icon className="h-4 w-4" strokeWidth={1.65} aria-hidden />
                </span>
                <h2 className="mt-4 font-sans text-sm font-semibold text-[var(--admin-ink)]">{title}</h2>
                <p className="mt-2 flex-1 font-sans text-xs leading-relaxed text-[var(--admin-muted)]">
                  {description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-accent)]">
                  Open
                  <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </AdminCard>
            </Link>
          </li>
        ))}
      </ul>
    </AdminPageLayout>
  );
}
