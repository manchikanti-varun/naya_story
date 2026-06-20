"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type HeaderProps = {
  kicker: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
};

export function StoreBrowseHeader({ kicker, title, subtitle, meta }: HeaderProps) {
  return (
    <header className="lux-store-browse-header pb-4 sm:pb-8">
      <div className="lux-browse-header-enter">
        <p className="lux-kicker">{kicker}</p>
        <div className="mt-2 flex flex-col gap-3 sm:mt-4 sm:gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="lux-title">{title}</h1>
            {subtitle ? <p className="lux-copy mt-1.5 max-w-xl sm:mt-3">{subtitle}</p> : null}
          </div>
          {meta ? <div className="shrink-0">{meta}</div> : null}
        </div>
      </div>
    </header>
  );
}

type EmptyProps = {
  title: string;
  description: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; onClick: () => void };
};

export function StoreBrowseEmpty({
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyProps) {
  return (
    <div className="lux-browse-empty">
      <div className="lux-browse-empty-icon" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <p className="lux-browse-empty-title">{title}</p>
      <p className="lux-browse-empty-copy">{description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {primaryAction ? (
          <Link href={primaryAction.href} className="lux-btn-ink px-8 py-3 text-[10px] tracking-[0.22em]">
            {primaryAction.label}
          </Link>
        ) : null}
        {secondaryAction ? (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="lux-btn-outline px-8 py-3 text-[10px] tracking-[0.22em]"
          >
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function StoreBrowseMetaPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex rounded-full border border-ivory-deep/80 bg-white/50 px-4 py-2 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function StoreBrowseShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("lux-store-browse min-h-screen bg-ivory-muted/60", className)}>
      <div className="lux-shell pb-16 pt-4 sm:pt-6 md:pb-24 md:pt-8">{children}</div>
    </div>
  );
}

type SkeletonProps = {
  kicker?: string;
  showFilterRow?: boolean;
  gridCount?: number;
};

/** Static shell for Suspense / loading — matches Collections browse layout to avoid layout shift. */
export function StoreBrowseSkeleton({
  kicker = "Loading",
  showFilterRow = true,
  gridCount = 8,
}: SkeletonProps) {
  return (
    <StoreBrowseShell>
      <header className="lux-store-browse-header border-b border-ivory-deep pb-10" aria-busy="true">
        <p className="lux-kicker">{kicker}</p>
        <div className="mt-4 h-12 max-w-md animate-pulse rounded-lux bg-ivory-soft" />
        <div className="mt-5 h-4 max-w-sm animate-pulse rounded-lux bg-ivory-soft/80" />
      </header>
      {showFilterRow ? (
        <section className="mt-10 space-y-5">
          <div className="lux-collection-categories">
            <div className="lux-scroll-x flex gap-2 pb-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-ivory-soft"
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
        {Array.from({ length: gridCount }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-lux bg-ivory-soft" aria-hidden />
        ))}
      </div>
    </StoreBrowseShell>
  );
}
