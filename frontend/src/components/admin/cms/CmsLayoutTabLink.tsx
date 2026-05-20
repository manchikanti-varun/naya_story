"use client";

type Props = {
  hint?: string;
};

/** Standard “Layout” tab copy — points merchants to homepage block ordering. */
export function CmsLayoutTabLink({
  hint = "Reorder this block on the homepage layout screen.",
}: Props) {
  return (
    <p className="font-sans text-sm text-[var(--admin-muted)]">
      {hint}{" "}
      <a
        href="/admin/storefront/homepage"
        className="font-medium text-[var(--admin-accent)] underline-offset-2 hover:underline"
      >
        Open homepage layout
      </a>
    </p>
  );
}
