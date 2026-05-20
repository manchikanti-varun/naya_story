"use client";

import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-faint)]">
        {SITE_NAME} admin
      </p>
      <h1 className="mt-3 font-sans text-lg font-semibold tracking-tight text-[var(--admin-ink)]">
        This screen could not load
      </h1>
      <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
        Your session and unsaved work elsewhere in the app may still be intact. Retry this page or return to the
        dashboard.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[11px] text-[var(--admin-faint)]">Ref: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-[var(--admin-border-strong)] bg-[var(--admin-ink)] px-5 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:opacity-95"
        >
          Retry
        </button>
        <Link
          href="/admin"
          className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-ink)] transition hover:border-[var(--admin-border-strong)]"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
