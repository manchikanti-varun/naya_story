"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { adminBreadcrumbs } from "@/lib/admin/breadcrumbs";

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const crumbs = adminBreadcrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 font-sans text-xs text-[var(--admin-muted)]">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 ? <ChevronRight className="h-3 w-3 text-[var(--admin-faint)]" aria-hidden /> : null}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="transition hover:text-[var(--admin-ink)]">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-[var(--admin-ink)]" : undefined}>{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
