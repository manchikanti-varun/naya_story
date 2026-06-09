import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  ImageIcon,
  LayoutGrid,
  Megaphone,
  Navigation2,
  Palette,
  Ruler,
  Shield,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { websitePagesUrl } from "@/lib/admin/website-pages";

const links = [
  { href: websitePagesUrl("homepage"), title: "Pages", description: "Homepage, Collections, New In, Our Story", icon: FileText },
  { href: "/admin/website/theme", title: "Theme", description: "Brand colours and fonts", icon: Palette },
  { href: "/admin/website/navigation", title: "Navigation", description: "Header menu links", icon: Navigation2 },
  { href: "/admin/website/footer", title: "Footer", description: "Contact and social links", icon: LayoutGrid },
  { href: "/admin/website/legal-pages", title: "Legal pages", description: "Terms, privacy, shipping", icon: Shield },
  { href: "/admin/website/announcement-bar", title: "Announcement bar", description: "Top promo strip", icon: Megaphone },
  { href: "/admin/website/size-chart", title: "Size chart", description: "Global fit guide for product pages", icon: Ruler },
  { href: "/admin/media", title: "Media library", description: "Upload and reuse images", icon: ImageIcon },
];

export default function WebsiteHubPage() {
  return (
    <AdminPageLayout title="Website" description="Everything shoppers see on your store.">
      <ul className="admin-simple-link-grid">
        {links.map(({ href, title, description, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="admin-simple-link-card group">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--admin-radius-sm)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
                <Icon className="h-4 w-4" strokeWidth={1.65} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-sans text-sm font-semibold text-[var(--admin-ink)]">{title}</span>
                <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">{description}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--admin-faint)] group-hover:text-[var(--admin-accent)]" />
            </Link>
          </li>
        ))}
      </ul>
    </AdminPageLayout>
  );
}
