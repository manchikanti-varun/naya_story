"use client";

import Link from "next/link";
import { ArrowUpRight, GripVertical } from "lucide-react";
import { sortSections, useHomepageEditor } from "@/components/admin/homepage-editor/context";
import type { HomepageLayoutBlockType } from "@/types/homepage";
import {
  buildLayoutBlocksFromHomepage,
  deriveHomepageLayoutBlocks,
  mergeLayoutBlocksIntoHomepageClient,
} from "@/lib/homepage-layout-blocks";
import { cn } from "@/lib/cn";

const SECTION_TYPES = new Set<HomepageLayoutBlockType>([
  "bestsellers",
  "newIn",
  "categories",
  "newsletter",
]);

const TOGGLE_TYPES = new Set<HomepageLayoutBlockType>([
  "promoBar",
  "hero",
  "bestsellers",
  "newIn",
  "categories",
  "newsletter",
]);

export default function StorefrontHomepageBlocksPage() {
  const { hp, setHp, moveSection } = useHomepageEditor();
  if (!hp) {
    return <p className="font-sans text-sm text-[var(--admin-muted)]">Loading layout…</p>;
  }

  const blocks = deriveHomepageLayoutBlocks(hp);
  const sortedSections = sortSections(hp.sectionsOrder);

  const toggleBlock = (id: string) => {
    setHp((prev) => {
      if (!prev) return prev;
      const base = prev.layoutBlocks?.length ? prev.layoutBlocks : buildLayoutBlocksFromHomepage(prev);
      const next = base.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b));
      return mergeLayoutBlocksIntoHomepageClient(prev, next);
    });
  };

  const sectionIndex = (type: HomepageLayoutBlockType) =>
    sortedSections.findIndex((s) => s.id === type);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-3">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-faint)]">
          Homepage
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)] md:text-4xl">
          Section blocks
        </h1>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Toggle visibility and reorder homepage rails. Changes update the same fields as{" "}
          <Link
            href="/admin/content/home-layout"
            className="font-medium text-[var(--admin-accent)] underline-offset-4 hover:underline"
          >
            Home layout
          </Link>{" "}
          and the individual editors — save from the bar below when you are ready to publish.
        </p>
      </header>

      <ol className="space-y-3">
        {blocks.map((b) => {
          const isSection = SECTION_TYPES.has(b.type);
          const idx = isSection ? sectionIndex(b.type) : -1;
          const canToggle = TOGGLE_TYPES.has(b.type);
          return (
            <li key={b.id}>
              <div
                className={cn(
                  "admin-surface flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center",
                  !b.enabled && "opacity-60",
                )}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-[var(--admin-faint)]">
                    <GripVertical className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--admin-faint)]">
                        {b.type}
                      </span>
                      {!b.enabled ? (
                        <span className="rounded-full bg-stone-200 px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-stone-600">
                          Off
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-1 font-sans text-base font-semibold text-[var(--admin-ink)]">{b.title}</h2>
                    <p className="mt-1 font-sans text-sm text-[var(--admin-muted)]">{b.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {isSection && idx >= 0 ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, -1)}
                        className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2.5 py-1.5 font-sans text-[11px] font-medium uppercase tracking-wide text-[var(--admin-ink)] disabled:opacity-30"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={idx >= sortedSections.length - 1}
                        onClick={() => moveSection(idx, 1)}
                        className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2.5 py-1.5 font-sans text-[11px] font-medium uppercase tracking-wide text-[var(--admin-ink)] disabled:opacity-30"
                      >
                        Down
                      </button>
                    </div>
                  ) : null}
                  {canToggle ? (
                    <button
                      type="button"
                      onClick={() => toggleBlock(b.id)}
                      className="rounded-full border border-[var(--admin-border)] px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-ink)] hover:bg-[var(--admin-surface-raised)]"
                    >
                      {b.enabled ? "Disable" : "Enable"}
                    </button>
                  ) : null}
                  <Link
                    href={b.editHref}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-ink)] px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-surface)] hover:opacity-90"
                  >
                    Edit
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
