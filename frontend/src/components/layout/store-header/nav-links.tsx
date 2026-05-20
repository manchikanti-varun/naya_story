"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { STORE_PRIMARY_NAV, type StoreNavRow } from "@/lib/store-nav";

export type NavItem = StoreNavRow;

/** @deprecated Use `STORE_PRIMARY_NAV` from `@/lib/store-nav`. */
export const STORE_NAV_ITEMS: NavItem[] = STORE_PRIMARY_NAV;

export function StoreNavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collection = searchParams.get("collection");
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash.replace(/^#/, ""));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  return (
    <nav
      className={cn(
        "hidden items-center justify-center gap-12 lg:gap-16 md:flex",
        className,
      )}
      aria-label="Primary"
    >
      {STORE_PRIMARY_NAV.map((item) => {
        const active = item.match({ pathname, collection, hash });
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
