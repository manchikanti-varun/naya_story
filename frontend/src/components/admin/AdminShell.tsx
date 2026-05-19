"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  ChevronDown,
  ChevronLeft,
  Eye,
  ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  Layers,
  Menu,
  Megaphone,
  Package,
  PanelsTopLeft,
  Percent,
  Server,
  Settings2,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon?: LucideIcon };

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/catalog/categories", label: "Categories", icon: LayoutGrid },
      { href: "/admin/catalog/collections", label: "Collections", icon: Layers },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    label: "Media",
    items: [
      { href: "/admin/media", label: "Media library", icon: ImageIcon },
      { href: "/admin/media/banners", label: "Banners", icon: Sparkles },
    ],
  },
  {
    label: "Storefront CMS",
    items: [
      { href: "/admin/storefront", label: "CMS home", icon: PanelsTopLeft },
      { href: "/admin/storefront/homepage", label: "Homepage blocks", icon: LayoutGrid },
      { href: "/admin/content/hero", label: "Hero", icon: ImageIcon },
      { href: "/admin/content/home-layout", label: "Home layout", icon: LayoutList },
      { href: "/admin/content/bestsellers", label: "Bestsellers", icon: Package },
      { href: "/admin/content/new-in-home", label: "New In (home)", icon: Sparkles },
      { href: "/admin/content/new-in-page", label: "New In page", icon: Sparkles },
      { href: "/admin/content/categories", label: "Shop categories", icon: Layers },
      { href: "/admin/content/collections", label: "Collections page", icon: Layers },
      { href: "/admin/content/our-story", label: "Our Story", icon: Sparkles },
      { href: "/admin/content/preview/hero", label: "Live preview", icon: Eye },
      { href: "/admin/content/theme", label: "Text colors", icon: Sparkles },
      { href: "/admin/content/promo-bar", label: "Promo bar", icon: Megaphone },
      { href: "/admin/content/newsletter", label: "Newsletter", icon: Megaphone },
      { href: "/admin/content/footer", label: "Footer", icon: LayoutGrid },
      { href: "/admin/storefront/navigation", label: "Navigation", icon: Settings2 },
    ],
  },
  {
    label: "Orders",
    items: [
      { href: "/admin/orders", label: "All orders", icon: ShoppingBag },
      { href: "/admin/orders/shipping", label: "Shipping", icon: Truck },
      { href: "/admin/orders/tracking", label: "Tracking", icon: Truck },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/admin/customers", label: "Customer list", icon: Users },
      { href: "/admin/customers/segments", label: "Segments", icon: Users },
      { href: "/admin/customers/activity", label: "Activity", icon: BarChart3 },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/coupons", label: "Coupons", icon: Percent },
      { href: "/admin/marketing/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/admin/marketing/featured", label: "Featured products", icon: Package },
    ],
  },
  {
    label: "Analytics",
    items: [{ href: "/admin/analytics", label: "Reports", icon: BarChart3 }],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Server },
      { href: "/admin/system/roles", label: "Roles & permissions", icon: Settings2 },
      { href: "/admin/pages", label: "Admin map", icon: LayoutGrid },
    ],
  },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  /** CMS hub is exact only — child routes like /admin/storefront/homepage stay distinct. */
  if (href === "/admin/storefront") return pathname === "/admin/storefront";
  if (href.startsWith("/admin/content/preview")) {
    return pathname.startsWith("/admin/content/preview");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      {navGroups.map((group) => (
        <details key={group.label} className="admin-nav-group group" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-2 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-faint)] outline-none marker:hidden hover:text-[var(--admin-muted)] [&::-webkit-details-marker]:hidden">
            {group.label}
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--admin-faint)] transition group-open:rotate-180" strokeWidth={1.75} aria-hidden />
          </summary>
          <nav className="mt-1 space-y-0.5 pb-2 pl-0.5" aria-label={group.label}>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 font-sans text-[13px] transition-colors",
                    active
                      ? "border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] font-medium text-[var(--admin-nav-active)] shadow-sm ring-1 ring-black/[0.03]"
                      : "text-[var(--admin-sidebar-text)] hover:bg-black/[0.04]",
                  )}
                >
                  {Icon ? (
                    <Icon
                      className={cn(
                        "h-[15px] w-[15px] shrink-0",
                        active ? "text-[var(--admin-accent)]" : "text-[var(--admin-faint)]",
                      )}
                      strokeWidth={1.65}
                      aria-hidden
                    />
                  ) : (
                    <span className="w-[15px] shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
        </details>
      ))}
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-sans text-sm text-[var(--admin-muted)]">
        Verifying administrator access…
      </div>
    );
  }

  const isPreviewRoute = pathname?.startsWith("/admin/preview");

  if (isPreviewRoute) {
    return (
      <div className="min-h-screen bg-[var(--admin-surface-raised)]">
        <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--admin-surface)]/85 md:px-6">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 font-sans text-xs font-medium text-[var(--admin-ink)] shadow-sm hover:bg-[var(--admin-surface-raised)]"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            Back to catalog
          </Link>
          <p className="hidden font-sans text-xs text-[var(--admin-muted)] sm:block">Storefront preview</p>
          <Link
            href="/"
            className="text-xs font-medium text-[var(--admin-muted)] underline-offset-4 hover:text-[var(--admin-ink)] hover:underline"
          >
            Open shop
          </Link>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-stone-900/20 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "admin-sidebar-inner fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r px-3 py-5 shadow-[4px_0_28px_-18px_rgba(28,25,23,0.18)] transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--admin-border)] px-1 pb-4">
          <div className="min-w-0">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-accent)]">
              Naya Studio
            </p>
            <p className="mt-1 font-sans text-base font-semibold tracking-tight text-[var(--admin-ink)]">
              Commerce control
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-[var(--admin-muted)] hover:bg-black/[0.05] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto overscroll-contain pr-0.5">
          <NavLinks pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
        </div>

        <div className="mt-auto space-y-0.5 border-t border-[var(--admin-border)] pt-4">
          <Link
            href="/"
            className="block rounded-xl px-3 py-2.5 font-sans text-sm text-[var(--admin-sidebar-text)] transition hover:bg-black/[0.04] hover:text-[var(--admin-ink)]"
          >
            View live store
          </Link>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2.5 text-left font-sans text-sm text-[var(--admin-sidebar-text)] transition hover:bg-black/[0.04] hover:text-[var(--admin-ink)]"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-canvas)]/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 text-[var(--admin-ink)] shadow-sm"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <span className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Naya admin</span>
        </header>
        <main className="flex-1 overflow-x-auto px-4 py-8 sm:px-6 lg:px-10 lg:py-11">{children}</main>
      </div>
    </div>
  );
}
