import Link from "next/link";

type Props = {
  title: string;
  description: string;
  docsHref?: string;
  docsLabel?: string;
};

export function AdminPlaceholder({ title, description, docsHref, docsLabel = "Open related area" }: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-faint)]">
          Roadmap
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">{title}</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">{description}</p>
      </header>
      <div className="admin-surface rounded-2xl p-6">
        <p className="font-sans text-sm text-[var(--admin-muted)]">
          This surface is reserved for the next commerce OS release — granular workflows, automation, and live sync will
          land here without breaking your current catalog or CMS flows.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          {docsHref ? (
            <Link
              href={docsHref}
              className="inline-flex rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-ink)] shadow-sm hover:bg-[var(--admin-surface-raised)]"
            >
              {docsLabel}
            </Link>
          ) : null}
          <Link
            href="/admin"
            className="inline-flex font-sans text-sm font-medium text-[var(--admin-muted)] underline-offset-4 hover:text-[var(--admin-ink)] hover:underline"
          >
            ← Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
