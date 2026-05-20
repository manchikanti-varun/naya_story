"use client";

import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">{SITE_NAME}</p>
      <h1 className="mt-4 font-serif text-3xl tracking-tight text-ink md:text-4xl">
        We hit a snag
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
        This page could not be displayed. Your bag and account are safe. Please try again, or
        return home.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-ink-muted">Ref: {error.digest}</p>
      ) : null}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-11 min-w-[140px] rounded-md border border-ink bg-ink px-8 font-sans text-xs uppercase tracking-[0.2em] text-ivory transition hover:bg-ink/90"
        >
          Retry
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 min-w-[140px] items-center justify-center rounded-md border border-ink/20 bg-transparent px-8 font-sans text-xs uppercase tracking-[0.2em] text-ink transition hover:border-gold hover:text-gold"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
