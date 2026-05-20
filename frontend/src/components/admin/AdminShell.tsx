"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, Menu, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { clearAdminGateCookie } from "@/lib/admin-gate";
import { adminNavGroups, isNavActive, type AdminNavItem } from "@/lib/admin/nav-config";
import { AdminBrand } from "@/components/admin/AdminBrand";
import { AdminBreadcrumbs } from "@/components/admin/ui/AdminBreadcrumbs";
import { AdminCommandPalette } from "@/components/admin/ui/AdminCommandPalette";
import { cn } from "@/lib/cn";

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-0.5">
      {adminNavGroups.map((group) => (
        <details key={group.id} className="admin-nav-group group" open={group.defaultOpen ?? false}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-2 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--admin-faint)] outline-none marker:hidden hover:text-[var(--admin-muted)] [&::-webkit-details-marker]:hidden">
            {group.label}
            <ChevronDown
              className="h-3.5 w-3.5 shrink-0 transition duration-200 group-open:rotate-180"
              strokeWidth={1.75}
              aria-hidden
            />
          </summary>
          <nav className="mt-0.5 space-y-0.5 pb-2 pl-0.5" aria-label={group.label}>
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </nav>
        </details>
      ))}
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: AdminNavItem;
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const active = isNavActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 font-sans text-[13px] transition-colors duration-150",
        active
          ? "border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] font-medium text-[var(--admin-nav-active)] shadow-sm"
          : "text-[var(--admin-sidebar-text)] hover:bg-black/[0.04]",
      )}
    >
      {Icon ? (
        <Icon
          className={cn("h-[15px] w-[15px] shrink-0", active ? "text-[var(--admin-accent)]" : "text-[var(--admin-faint)]")}
          strokeWidth={1.65}
          aria-hidden
        />
      ) : (
        <span className="w-[15px] shrink-0" aria-hidden />
      )}
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginRoute) return;
    if (!loading && (!user || user.role !== "admin")) {
      clearAdminGateCookie();
      router.replace("/");
    }
  }, [loading, user, router, isLoginRoute]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

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
        <header className="sticky top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/95 px-4 py-3 backdrop-blur md:px-6">
          <Link
            href="/admin/products"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 font-sans text-xs font-medium text-[var(--admin-ink)] shadow-sm hover:bg-[var(--admin-surface-raised)]"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <AdminBrand href="/admin" showSubtitle={false} align="center" logoClassName="h-8 w-[108px] sm:h-9 sm:w-[124px]" />
          <Link
            href="/"
            className="justify-self-end text-xs font-medium text-[var(--admin-muted)] underline-offset-4 hover:text-[var(--admin-ink)] hover:underline"
          >
            Open shop
          </Link>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden">
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
          "admin-sidebar-inner fixed inset-y-0 left-0 z-50 flex h-[100dvh] max-h-[100dvh] w-[272px] shrink-0 flex-col overflow-hidden border-r px-3 py-5 shadow-[4px_0_28px_-18px_rgba(28,25,23,0.18)] transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="relative shrink-0 border-b border-[var(--admin-border)] px-2 pb-4 pt-0.5">
          <button
            type="button"
            className="absolute right-0 top-0 z-10 rounded-lg p-2 text-[var(--admin-muted)] hover:bg-black/[0.05] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <AdminBrand align="center" className="px-6 lg:px-2" />
        </div>

        <nav
          className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]"
          aria-label="Admin navigation"
        >
          <NavLinks pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
        </nav>

        <div className="shrink-0 space-y-0.5 border-t border-[var(--admin-border)] pt-4">
          <Link
            href="/"
            target="_blank"
            className="block rounded-xl px-3 py-2.5 font-sans text-sm text-[var(--admin-sidebar-text)] transition hover:bg-black/[0.04] hover:text-[var(--admin-ink)]"
          >
            View live store
          </Link>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2.5 text-left font-sans text-sm text-[var(--admin-sidebar-text)] transition hover:bg-black/[0.04] hover:text-[var(--admin-ink)]"
            onClick={() => {
              logout();
              router.push("/admin/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-hidden">
        <header className="sticky top-0 z-30 shrink-0 border-b border-[var(--admin-border)] bg-[var(--admin-canvas)]/92 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
            <button
              type="button"
              className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 text-[var(--admin-ink)] shadow-sm lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <div className="flex min-w-0 flex-1 justify-center lg:hidden">
              <AdminBrand showSubtitle={false} align="center" logoClassName="h-8 w-[108px]" />
            </div>
            <div className="hidden min-w-0 flex-1 lg:block">
              <AdminBreadcrumbs />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <AdminCommandPalette />
            </div>
          </div>
          <div className="border-t border-[var(--admin-border)] px-4 py-2 lg:hidden">
            <AdminBreadcrumbs />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-x-auto overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
