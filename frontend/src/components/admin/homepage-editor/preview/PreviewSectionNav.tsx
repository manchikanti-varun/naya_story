"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export const PREVIEW_SECTION_SLUGS = [
  { slug: "promo-bar", label: "Top promo" },
  { slug: "hero", label: "Hero" },
  { slug: "home-layout", label: "Home layout" },
  { slug: "bestsellers", label: "Bestsellers" },
  { slug: "new-in-home", label: "New In (home)" },
  { slug: "new-in-page", label: "New In page" },
  { slug: "categories", label: "Categories" },
  { slug: "collections", label: "Collections" },
  { slug: "our-story", label: "Our Story" },
  { slug: "newsletter", label: "Newsletter" },
  { slug: "footer", label: "Footer" },
] as const;

export type PreviewSectionSlug = (typeof PREVIEW_SECTION_SLUGS)[number]["slug"];

export function isPreviewSectionSlug(s: string): s is PreviewSectionSlug {
  return PREVIEW_SECTION_SLUGS.some((x) => x.slug === s);
}

export function PreviewSectionNav() {
  const pathname = usePathname();
  const activeSlug = pathname.split("/").pop() ?? "";

  return (
    <nav aria-label="Preview by section" className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        Preview one section at a time
      </p>
      <div className="no-scrollbar mt-3 flex flex-wrap gap-1.5">
        {PREVIEW_SECTION_SLUGS.map(({ slug, label }) => {
          const href = `/admin/content/preview/${slug}`;
          const active = activeSlug === slug;
          return (
            <Link
              key={slug}
              href={href}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 font-sans text-[11px] font-medium transition",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
