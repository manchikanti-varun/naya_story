"use client";

import { cn } from "@/lib/cn";

export type JumpLink = {
  id: string;
  label: string;
};

type Props = {
  links: JumpLink[];
  className?: string;
};

/** In-page anchor nav for long forms (products, CMS). */
export function AdminSectionJumpNav({ links, className }: Props) {
  return (
    <nav
      aria-label="Jump to section"
      className={cn(
        "admin-section-jump -mx-1 flex gap-1 overflow-x-auto pb-1 no-scrollbar",
        className,
      )}
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="shrink-0 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 font-sans text-xs font-medium text-[var(--admin-muted)] transition hover:border-[var(--admin-accent)]/40 hover:text-[var(--admin-ink)]"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
