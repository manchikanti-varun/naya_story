"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ShellProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  embedded?: boolean;
  id?: string;
};

/** Standalone CMS page block (collections, our story, etc.). */
export function CmsPageEditorShell({ title, description, children, embedded, id }: ShellProps) {
  return (
    <section
      id={id}
      className={cn(embedded ? "space-y-8 p-6 sm:p-8" : "admin-surface-elevated space-y-8 p-6 sm:p-8")}
    >
      <header>
        <h2 className="admin-page-title text-xl text-[var(--admin-ink)] sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <div className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
            {description}
          </div>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function CmsSectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="admin-cms-kicker">{children}</h3>;
}

export function CmsVisibilityToggle({
  label = "Visible on homepage",
  checked,
  onChange,
}: {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="admin-cms-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/** Enable/disable a full storefront route (Collections, New In, Our Story). */
export function CmsStorePagePublishToggle({
  route,
  checked,
  onChange,
}: {
  route: string;
  checked: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <CmsVisibilityToggle
      label={`Publish ${route} on storefront`}
      checked={checked}
      onChange={onChange}
    />
  );
}

export function CmsFormGrid({
  children,
  cols = 2,
  className,
}: {
  children: ReactNode;
  cols?: 1 | 2;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", cols === 2 && "md:grid-cols-2", className)}>{children}</div>
  );
}
