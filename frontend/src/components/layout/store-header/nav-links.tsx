"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { buildStorePrimaryNav, type StoreNavRow } from "@/lib/store-nav";
import type { StorePageFlags } from "@/lib/store-page-flags";

export type NavItem = StoreNavRow;

/** @deprecated Use `buildStorePrimaryNav` from `@/lib/store-nav`. */
export const STORE_NAV_ITEMS: NavItem[] = buildStorePrimaryNav();

type NavCategory = { name: string; slug: string; href: string };

export function StoreNavLinks({
  className,
  storePageFlags,
  navCategories,
}: {
  className?: string;
  storePageFlags?: StorePageFlags;
  navCategories?: NavCategory[];
}) {
  const navItems = buildStorePrimaryNav(storePageFlags);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collection = searchParams.get("collection");
  const [hash, setHash] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setHash(window.location.hash.replace(/^#/, ""));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname, searchParams]);

  const openDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const closeDropdown = () => {
    timeoutRef.current = setTimeout(() => setDropdownOpen(false), 150);
  };

  const hasCategories = navCategories && navCategories.length > 0;

  return (
    <nav
      className={cn(
        "hidden items-center justify-center gap-12 lg:gap-16 md:flex",
        className,
      )}
      aria-label="Primary"
    >
      {navItems.map((item) => {
        const active = item.match({ pathname, collection, hash });
        const isCollections = item.href === "/collections" && hasCategories;

        if (isCollections) {
          return (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
              ref={dropdownRef}
            >
              <Link
                href={item.href}
                className={cn(
                  "group relative inline-flex items-center gap-1 font-sans text-[12px] font-normal uppercase tracking-[0.22em] antialiased transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  "text-ink hover:text-gold",
                  active && "text-ink",
                )}
              >
                <span className="relative inline-block pb-1.5">
                  {item.label}
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center scale-x-0 bg-gold/60 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100",
                      active && "scale-x-100 bg-gold",
                    )}
                    aria-hidden
                  />
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-ink-soft transition-transform duration-300",
                    dropdownOpen && "rotate-180",
                  )}
                  strokeWidth={1.5}
                  aria-hidden
                />
              </Link>

              {/* Dropdown */}
              <div
                className={cn(
                  "absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  dropdownOpen
                    ? "pointer-events-auto opacity-100 translate-y-0"
                    : "pointer-events-none opacity-0 -translate-y-1",
                )}
              >
                <div className="min-w-[200px] rounded-lg border border-ivory-deep/60 bg-ivory px-1 py-2 shadow-[0_12px_48px_-8px_rgba(44,40,37,0.18)] backdrop-blur-2xl">
                  <Link
                    href="/collections"
                    className="flex items-center justify-between rounded-md px-4 py-2.5 font-sans text-[11px] uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:bg-ivory-soft hover:text-gold"
                  >
                    <span>All Collections</span>
                    <ChevronRight className="h-3 w-3 text-ink-soft/60" strokeWidth={1.5} />
                  </Link>
                  <Link
                    href="/collections?tab=bestselling"
                    className="flex items-center justify-between rounded-md px-4 py-2.5 font-sans text-[11px] uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:bg-ivory-soft hover:text-gold"
                  >
                    <span>Bestselling</span>
                    <ChevronRight className="h-3 w-3 text-ink-soft/60" strokeWidth={1.5} />
                  </Link>
                  <Link
                    href="/collections?tab=new-in"
                    className="flex items-center justify-between rounded-md px-4 py-2.5 font-sans text-[11px] uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:bg-ivory-soft hover:text-gold"
                  >
                    <span>New In</span>
                    <ChevronRight className="h-3 w-3 text-ink-soft/60" strokeWidth={1.5} />
                  </Link>
                  <div className="mx-3 my-1.5 h-px bg-ivory-deep/40" />
                  {navCategories!.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={cat.href}
                      className="flex items-center justify-between rounded-md px-4 py-2.5 font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted transition-colors duration-300 hover:bg-ivory-soft hover:text-gold"
                    >
                      <span>{cat.name}</span>
                      <ChevronRight className="h-3 w-3 text-ink-soft/40" strokeWidth={1.5} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "group relative font-sans text-[12px] font-normal uppercase tracking-[0.22em] antialiased transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              "text-ink hover:text-gold",
              active && "text-ink",
            )}
          >
            <span className="relative inline-block pb-1.5">
              {item.label}
              <span
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center scale-x-0 bg-gold/60 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100",
                  active && "scale-x-100 bg-gold",
                )}
                aria-hidden
              />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
