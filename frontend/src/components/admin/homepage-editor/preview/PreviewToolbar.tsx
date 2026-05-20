"use client";

import Link from "next/link";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { websitePagesUrl } from "@/lib/admin/website-pages";

export function PreviewToolbar() {
  const { isDirty, discardDraft, save, cmsMeta } = useHomepageEditor();

  return (
    <AdminCard elevated padding="md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-faint)]">
            Draft preview
          </p>
          <h2 className="mt-1 font-sans text-xl font-semibold text-[var(--admin-ink)]">Review before publishing</h2>
          {isDirty ? (
            <p className="mt-2 max-w-xl font-sans text-sm text-amber-950/90">
              Unsaved edits — pick a section below, then save draft or discard.
            </p>
          ) : cmsMeta?.hasUnpublishedChanges ? (
            <p className="mt-2 max-w-xl font-sans text-sm text-amber-950/90">
              Draft saved on the server differs from the live storefront. Go back to Homepage and use Publish live
              from the sticky bar.
            </p>
          ) : (
            <p className="mt-2 max-w-xl font-sans text-sm text-[var(--admin-muted)]">
              Draft matches the live homepage. Edit any section, then use each preview tab to inspect.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={websitePagesUrl("homepage")}>
            <AdminButton variant="secondary" size="sm">
              Back to editing
            </AdminButton>
          </Link>
          <AdminButton variant="ghost" size="sm" disabled={!isDirty} onClick={() => discardDraft()}>
            Discard changes
          </AdminButton>
          <AdminButton variant="primary" size="sm" disabled={!isDirty} onClick={() => void save()}>
            Save draft
          </AdminButton>
        </div>
      </div>
    </AdminCard>
  );
}
