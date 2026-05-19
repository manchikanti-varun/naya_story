"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { HomepageEditorProvider, useHomepageEditor } from "@/components/admin/homepage-editor/context";

function ContentEditorChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPreviewRoute = Boolean(pathname?.startsWith("/admin/content/preview"));
  const { hp, msg, save, isDirty, discardDraft } = useHomepageEditor();

  if (!hp) {
    return (
      <p className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-3 font-sans text-sm text-[var(--admin-muted)]">
        Loading homepage…
      </p>
    );
  }

  const actionRow = !isPreviewRoute ? (
    <div className="flex flex-shrink-0 flex-wrap gap-2">
      <Link
        href="/admin/content/preview/hero"
        className="inline-flex items-center justify-center rounded-full border border-[var(--admin-border-strong)] bg-[var(--admin-surface-raised)] px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-ink)] shadow-sm transition hover:border-[var(--admin-accent)]/40 hover:bg-[var(--admin-accent-soft)]"
      >
        Preview draft
      </Link>
      <button
        type="button"
        disabled={!isDirty}
        onClick={() => discardDraft()}
        className="rounded-full border border-[var(--admin-border)] bg-transparent px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-muted)] transition hover:border-[var(--admin-border-strong)] hover:bg-black/[0.03] hover:text-[var(--admin-ink)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        Discard
      </button>
      <button
        type="button"
        disabled={!isDirty}
        onClick={() => void save()}
        className="rounded-full bg-gradient-to-b from-[#292524] to-[#1c1917] px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-md shadow-stone-900/15 ring-1 ring-white/10 transition hover:from-[#44403c] hover:to-[#292524] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
      >
        Save changes
      </button>
    </div>
  ) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-28">
      <header className="admin-surface-elevated overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--admin-accent)]">
              Storefront CMS
            </p>
            <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)] sm:text-[2.1rem]">
              Storefront content
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
              Open shopper tabs pick up published changes immediately (including theme colors). Use the{" "}
              <Link
                className="font-semibold text-[var(--admin-accent)] underline decoration-[var(--admin-accent)]/30 underline-offset-4 hover:decoration-[var(--admin-accent)]"
                href="/admin/storefront/homepage"
              >
                homepage block map
              </Link>{" "}
              for a modular overview, edit any section here, then{" "}
              <span className="font-semibold text-[var(--admin-ink)]">Preview draft</span> before{" "}
              <span className="font-semibold text-[var(--admin-ink)]">Save changes</span> (or{" "}
              <span className="font-semibold text-[var(--admin-ink)]">Discard</span>) to publish.
            </p>
            {isDirty ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200/90 bg-amber-50/90 px-3 py-1 font-sans text-xs font-medium text-amber-950">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden />
                Unsaved changes
              </p>
            ) : (
              <p className="mt-3 font-sans text-xs text-[var(--admin-faint)]">In sync with published site</p>
            )}
          </div>
          {actionRow}
        </div>
      </header>

      {!isPreviewRoute && msg ? (
        <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 font-sans text-sm font-medium text-emerald-900">
          {msg}
        </p>
      ) : null}

      <div className="min-w-0">{children}</div>

      {!isPreviewRoute ? (
        <div className="admin-surface flex flex-col items-stretch justify-end gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Link
            href="/admin/content/preview/hero"
            className="inline-flex items-center justify-center rounded-full border border-[var(--admin-border-strong)] bg-[var(--admin-surface-raised)] px-6 py-2.5 text-center font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-ink)] shadow-sm transition hover:border-[var(--admin-accent)]/35 hover:bg-[var(--admin-accent-soft)] sm:min-w-[10rem]"
          >
            Preview draft
          </Link>
          <button
            type="button"
            disabled={!isDirty}
            onClick={() => discardDraft()}
            className="rounded-full border border-[var(--admin-border)] px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-muted)] transition hover:bg-black/[0.04] hover:text-[var(--admin-ink)] disabled:cursor-not-allowed disabled:opacity-35 sm:min-w-[9rem]"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={() => void save()}
            className="rounded-full bg-gradient-to-b from-[#292524] to-[#1c1917] px-8 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-md ring-1 ring-white/10 transition hover:from-[#44403c] hover:to-[#292524] disabled:cursor-not-allowed disabled:opacity-35 sm:min-w-[11rem]"
          >
            Save changes
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ContentEditorShell({ children }: { children: ReactNode }) {
  return (
    <HomepageEditorProvider>
      <ContentEditorChrome>{children}</ContentEditorChrome>
    </HomepageEditorProvider>
  );
}
