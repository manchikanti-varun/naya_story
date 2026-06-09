"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CmsEditorSaveActions } from "@/components/admin/cms/CmsEditorSaveActions";
import { HomepageEditorProvider, useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { AdminStickySaveBar } from "@/components/admin/ui/AdminStickySaveBar";
import { AdminInlineLoading } from "@/components/admin/ui/AdminLoader";
import { cn } from "@/lib/cn";

function ContentEditorChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPreviewRoute = Boolean(pathname?.startsWith("/admin/content/preview"));
  const { hp, msg, isDirty, cmsMeta, loadError, load } = useHomepageEditor();

  const bypassHomepageWait =
    pathname === "/admin/website" || pathname === "/admin/website/navigation";

  if (!hp && !bypassHomepageWait) {
    if (loadError) {
      return (
        <div className="mx-auto max-w-4xl py-12 text-center">
          <p className="rounded-[var(--admin-radius)] border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-800">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="admin-btn admin-btn--primary admin-btn--sm mt-4"
          >
            Retry
          </button>
        </div>
      );
    }
    return <AdminInlineLoading label="Loading homepage…" />;
  }

  const saveBar =
    !isPreviewRoute && hp && !bypassHomepageWait ? (
      <AdminStickySaveBar
        dirty={isDirty || Boolean(cmsMeta?.hasUnpublishedChanges)}
        message="Save draft keeps your work · Publish updates the live store"
      >
        <CmsEditorSaveActions actionsOnly showPreviewLink />
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
