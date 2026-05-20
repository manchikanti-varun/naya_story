"use client";

import { SITE_NAME } from "@/lib/constants";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#faf8f5] px-6 py-16 text-neutral-900 antialiased">
        <main className="mx-auto max-w-md text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            {SITE_NAME}
          </p>
          <h1 className="mt-4 font-serif text-2xl tracking-tight">Something went wrong</h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            We could not load this page. Please try again. If the problem continues, contact support
            with reference{" "}
            <span className="font-mono text-xs text-neutral-800">
              {error.digest ?? "none"}
            </span>
            .
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-8 inline-flex min-h-11 min-w-[140px] items-center justify-center border border-neutral-900 px-5 text-sm font-medium uppercase tracking-wide text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
