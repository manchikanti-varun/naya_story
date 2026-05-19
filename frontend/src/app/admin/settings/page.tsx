import Link from "next/link";
import { ImageIcon, Link2, Server } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export default function AdminEnvironmentPage() {
  return (
    <AdminPageShell
      eyebrow="System"
      title="Environment"
      maxWidthClass="max-w-2xl"
      description={
        <>
          This page is <strong className="font-medium text-[var(--admin-ink)]">not</strong> where you change shipping
          rules, tax, or store policies. It only shows{" "}
          <strong className="font-medium text-[var(--admin-ink)]">technical readouts</strong> so developers and
          operators can confirm which API this browser build is talking to.
        </>
      }
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Server className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg text-slate-900">Backend API base URL</h2>
            <p className="mt-1 font-sans text-sm text-slate-600">
              All admin and storefront data requests use this origin. To point at staging or production, set{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                NEXT_PUBLIC_API_URL
              </code>{" "}
              in your deployment environment (for example Vercel project settings), then redeploy the frontend.
            </p>
            <p className="mt-4 break-all rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900">
              {API_BASE}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Link2 className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg text-slate-900">Why you might open this page</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 font-sans text-sm text-slate-600">
              <li>Verify the admin panel is not accidentally hitting localhost while the shop is in production.</li>
              <li>Share a screenshot with engineering when debugging &quot;data not updating&quot; issues.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <ImageIcon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg text-slate-900">Images & media</h2>
            <p className="mt-1 font-sans text-sm text-slate-600">
              Product and CMS fields expect HTTPS image URLs (for example from your CDN or Unsplash). Use{" "}
              <Link href="/admin/media" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
                Media
              </Link>{" "}
              to keep a reusable list of URLs for faster paste into the content editor.
            </p>
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}
