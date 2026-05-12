"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ImageIcon,
  LayoutDashboard,
  Menu,
  Package,
  PanelsTopLeft,
  Server,
  ShoppingBag,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon?: LucideIcon };

type NavGroup = { label: string; items: NavItem[] };

/** Production labels: catalog vs storefront vs ops. Icons only on primary nav rows (not shortcuts). */
const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Home", icon: LayoutDashboard }],
  },
  {
    label: "Catalog & assets",
    items: [
      { href: "/admin/products", label: "Product catalog", icon: Package },
      { href: "/admin/media", label: "Media", icon: ImageIcon },
    ],
  },
  {
    label: "Storefront",
    items: [{ href: "/admin/content", label: "Content editor", icon: PanelsTopLeft }],
  },
  {
    label: "Customers & orders",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/coupons", label: "Discount codes", icon: TicketPercent },
      { href: "/admin/inventory", label: "Stock", icon: Boxes },
    ],
  },
  {
    label: "Reports",
    items: [{ href: "/admin/analytics", label: "Analytics", icon: BarChart3 }],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Environment", icon: Server }],
  },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-7">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {group.label}
          </p>
          <nav className="mt-2 space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-slate-900 font-medium text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {Icon ? (
                    <Icon
                      className={cn(
                        "h-[15px] w-[15px] shrink-0",
                        active ? "text-white/90" : "text-slate-500",
                      )}
                      strokeWidth={1.65}
                      aria-hidden
                    />
                  ) : (
                    <span className="w-[15px] shrink-0" aria-hidden />
                  )}
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-3">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Quick links
        </p>
        <Link
          href="/admin/content/collections"
          onClick={onNavigate}
          className="mt-2 block text-xs leading-snug text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          Collections page settings
        </Link>
        <Link
          href="/admin/pages"
          onClick={onNavigate}
          className="mt-2 block text-xs leading-snug text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          Admin directory
        </Link>
      </div>
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
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 font-sans text-sm text-slate-500">
        Verifying administrator access…
      </div>
    );
  }

  const isPreviewRoute = pathname?.startsWith("/admin/preview");

  if (isPreviewRoute) {
    return (
      <div className="min-h-screen bg-[#faf8f5]">
        <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:px-6">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-sans text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            Back to catalog
          </Link>
          <p className="hidden font-sans text-xs text-slate-500 sm:block">Live storefront preview</p>
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Open shop
          </Link>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] text-slate-900">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200/90 bg-white px-4 py-6 shadow-[4px_0_24px_-12px_rgba(15,23,42,0.08)] transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="min-w-0 pl-0.5">
            <p className="truncate font-display text-lg tracking-tight text-slate-900">Naya Studio</p>
            <p className="mt-0.5 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Commerce admin
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto pr-0.5">
          <NavLinks pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
        </div>

        <div className="mt-auto space-y-1 border-t border-slate-100 pt-4">
          <Link
            href="/"
            className="block rounded-xl px-3 py-2.5 font-sans text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            View live store
          </Link>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2.5 text-left font-sans text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
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
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/80 bg-[#f4f6f9]/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <span className="font-display text-lg text-slate-900">Naya admin</span>
        </header>
        <main className="flex-1 overflow-x-auto px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
