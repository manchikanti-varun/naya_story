"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { HomepageEditorProvider, useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminStickySaveBar } from "@/components/admin/ui/AdminStickySaveBar";
import { AdminInlineLoading } from "@/components/admin/ui/AdminLoader";
import { cn } from "@/lib/cn";

function ContentEditorChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPreviewRoute = Boolean(pathname?.startsWith("/admin/content/preview"));
  const { hp, msg, save, publish, isDirty, discardDraft, cmsMeta } = useHomepageEditor();

  const bypassHomepageWait =
    pathname === "/admin/website" || pathname === "/admin/website/navigation";

  if (!hp && !bypassHomepageWait) {
    return <AdminInlineLoading label="Loading homepage…" />;
  }

  const saveBar =
    !isPreviewRoute && hp && !bypassHomepageWait ? (
      <AdminStickySaveBar dirty={isDirty || Boolean(cmsMeta?.hasUnpublishedChanges)}>
        <Link href="/admin/content/preview/hero" className="admin-action-link admin-action-link--muted">
          Preview
        </Link>
        <AdminButton type="button" variant="ghost" size="sm" disabled={!isDirty} onClick={() => discardDraft()}>
          Discard
        </AdminButton>
        <AdminButton type="button" variant="secondary" size="sm" disabled={!isDirty} onClick={() => void save()}>
          Save draft
        </AdminButton>
        <AdminButton
          type="button"
          variant="primary"
          size="sm"
          disabled={isDirty || !cmsMeta?.hasUnpublishedChanges}
          onClick={() => void publish()}
          title={
            isDirty
              ? "Save your draft first"
              : !cmsMeta?.hasUnpublishedChanges
                ? "No unpublished homepage changes"
                : "Push saved draft live"
          }
        >
          Publish live
        </AdminButton>
      </AdminStickySaveBar>
    ) : null;

  return (
    <div className={cn("mx-auto max-w-6xl", !isPreviewRoute && "pb-24")}>
      {!isPreviewRoute && msg ? <p className="admin-toast-success mb-6">{msg}</p> : null}
      <div className="min-w-0">{children}</div>
      {saveBar}
    </div>
  );
}

export function ContentEditorShell({ children }: { children: ReactNode }) {
  return (
    <HomepageEditorProvider>
      <ContentEditorChrome>{children}</ContentEditorChrome>
    </HomepageEditorProvider>
  );
}
