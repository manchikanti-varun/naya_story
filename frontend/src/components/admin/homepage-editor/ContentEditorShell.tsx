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
  const { hp, msg, isDirty, cmsMeta } = useHomepageEditor();

  const bypassHomepageWait =
    pathname === "/admin/website" || pathname === "/admin/website/navigation";

  if (!hp && !bypassHomepageWait) {
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
