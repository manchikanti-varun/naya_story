"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ContentEditorNav } from "@/components/admin/homepage-editor/ContentEditorNav";
import { HomepageEditorProvider, useHomepageEditor } from "@/components/admin/homepage-editor/context";

function ContentEditorChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPreviewRoute = Boolean(pathname?.startsWith("/admin/content/preview"));
  const { hp, msg, save, isDirty, discardDraft } = useHomepageEditor();

  if (!hp) {
    return <p className="text-sm text-slate-500">Loading homepage…</p>;
  }

  return (
    <div className="space-y-10 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-slate-400">Storefront CMS</p>
          <h1 className="mt-3 font-display text-4xl text-slate-900">Storefront content</h1>
          <p className="mt-2 max-w-xl font-sans text-sm text-slate-500">
            Edit any section, open <strong className="font-medium text-slate-700">Preview draft</strong> to review,
            then <strong className="font-medium text-slate-700">Save changes</strong> to publish or{" "}
            <strong className="font-medium text-slate-700">Discard</strong> to revert to the last saved version.
          </p>
          {isDirty ? (
            <p className="mt-2 font-sans text-xs font-medium text-amber-800">Unsaved changes</p>
          ) : (
            <p className="mt-2 font-sans text-xs text-slate-500">In sync with published site</p>
          )}
        </div>
        {!isPreviewRoute ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/content/preview/hero"
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-[0.16em] text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Preview draft
            </Link>
            <button
              type="button"
              disabled={!isDirty}
              onClick={() => discardDraft()}
              className="rounded-full border border-slate-200 px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Discard changes
            </button>
            <button
              type="button"
              disabled={!isDirty}
              onClick={() => void save()}
              className="rounded-full bg-slate-900 px-6 py-2.5 font-sans text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save changes
            </button>
          </div>
        ) : null}
      </header>
      {!isPreviewRoute && msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="lg:sticky lg:top-6">
            <ContentEditorNav />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {!isPreviewRoute ? (
        <div className="flex flex-col items-stretch justify-end gap-3 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/admin/content/preview/hero"
            className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-center font-sans text-xs font-medium uppercase tracking-[0.16em] text-slate-800 shadow-sm transition hover:bg-slate-50 sm:px-8"
          >
            Preview draft
          </Link>
          <button
            type="button"
            disabled={!isDirty}
            onClick={() => discardDraft()}
            className="rounded-full border border-slate-200 px-6 py-2.5 font-sans text-xs font-medium uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-8"
          >
            Discard changes
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={() => void save()}
            className="rounded-full bg-slate-900 px-8 py-2.5 font-sans text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:px-10"
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
