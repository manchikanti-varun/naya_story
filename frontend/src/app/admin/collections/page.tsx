import Link from "next/link";

export default function AdminCollectionsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Storefront</p>
        <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">Collections page</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-slate-600">
          Tabs, titles, and category filters for the public <strong>/collections</strong> route are edited in the{" "}
          <strong>Content editor</strong> so you never maintain two sources of truth.
        </p>
      </header>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="font-sans text-sm text-slate-600">
          Open the collections section directly, or browse the full site editor.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/content/collections"
            className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-slate-800"
          >
            Collections settings
          </Link>
          <Link
            href="/admin/content"
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 hover:bg-slate-50"
          >
            Content editor (full)
          </Link>
        </div>
      </div>
    </div>
  );
}
