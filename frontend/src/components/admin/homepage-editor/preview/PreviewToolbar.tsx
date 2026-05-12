"use client";

import Link from "next/link";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";

export function PreviewToolbar() {
  const { isDirty, discardDraft, save } = useHomepageEditor();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Draft preview</p>
          <h2 className="mt-1 font-display text-2xl text-slate-900">Review before publishing</h2>
          {isDirty ? (
            <p className="mt-2 max-w-xl font-sans text-sm text-amber-900/90">
              Unsaved edits — pick a section below, then save or discard.
            </p>
          ) : (
            <p className="mt-2 max-w-xl font-sans text-sm text-slate-600">
              Draft matches the last published version. Edit any section, then use each preview tab to inspect.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/content/hero"
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-[0.16em] text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Back to editing
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
      </div>
    </div>
  );
}
