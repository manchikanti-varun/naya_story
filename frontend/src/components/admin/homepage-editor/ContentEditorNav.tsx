"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const PAGE_LINKS: { href: string; label: string }[] = [
  { href: "/admin/content/hero", label: "Hero" },
  { href: "/admin/content/home-layout", label: "Home layout" },
  { href: "/admin/content/bestsellers", label: "Bestsellers" },
  { href: "/admin/content/new-in-home", label: "New In (home)" },
  { href: "/admin/content/new-in-page", label: "New In page" },
  { href: "/admin/content/categories", label: "Categories" },
  { href: "/admin/content/collections", label: "Collections" },
  { href: "/admin/content/our-story", label: "Our Story" },
  { href: "/admin/content/preview/hero", label: "Preview draft" },
];

/** Shown once — same block appears on every storefront page. */
const SITE_WIDE_LINKS: { href: string; label: string }[] = [
  { href: "/admin/content/promo-bar", label: "Top promo bar" },
  { href: "/admin/content/newsletter", label: "Newsletter" },
  { href: "/admin/content/footer", label: "Footer" },
];

function NavPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-2 font-sans text-xs font-medium shadow-sm transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
      )}
    >
      {label}
    </Link>
  );
}

export function ContentEditorNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <nav aria-label="Content areas" className="space-y-2">
        <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-slate-400">Pages & homepage</p>
        <div className="no-scrollbar flex flex-wrap gap-1.5">
          {PAGE_LINKS.map(({ href, label }) => {
            const active =
              href.startsWith("/admin/content/preview")
                ? Boolean(pathname?.startsWith("/admin/content/preview"))
                : pathname === href;
            return <NavPill key={href} href={href} label={label} active={active} />;
          })}
        </div>
      </nav>
      <nav aria-label="Site-wide content" className="space-y-2 border-t border-slate-200/80 pt-4">
        <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-slate-400">
          Site-wide (one editor — used on all pages)
        </p>
        <div className="no-scrollbar flex flex-wrap gap-1.5">
          {SITE_WIDE_LINKS.map(({ href, label }) => (
            <NavPill key={href} href={href} label={label} active={pathname === href} />
          ))}
        </div>
      </nav>
    </div>
  );
}
