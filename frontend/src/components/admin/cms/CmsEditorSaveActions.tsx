"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { useHomepageEditorOptional } from "@/components/admin/homepage-editor/context";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Tighter layout for drawer footers and section headers. */
  compact?: boolean;
  /** Buttons only (e.g. global sticky bar that already shows status). */
  actionsOnly?: boolean;
  showPreviewLink?: boolean;
};

export function CmsEditorSaveActions({
  className,
  compact = false,
  actionsOnly = false,
  showPreviewLink = false,
}: Props) {
  const editor = useHomepageEditorOptional();
  if (!editor?.hp) return null;

  const { isDirty, discardDraft, save, publish, cmsMeta, saving, msg } = editor;
  const hasUnpublished = Boolean(cmsMeta?.hasUnpublishedChanges);
  const showStatus = !actionsOnly && (isDirty || hasUnpublished || msg);

  const buttons = (
    <div className={cn("flex flex-wrap items-center gap-2", compact ? "shrink-0" : "")}>
      {showPreviewLink ? (
        <Link
          href="/admin/content/preview/hero"
          className="admin-action-link admin-action-link--muted hidden sm:inline-flex"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={1.65} />
          Preview
        </Link>
      ) : null}
      <AdminButton
        type="button"
        variant="ghost"
        size="sm"
        disabled={!isDirty || saving}
        onClick={() => discardDraft()}
      >
        Discard
      </AdminButton>
      <AdminButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={!isDirty || saving}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save draft"}
      </AdminButton>
      <AdminButton
        type="button"
        variant="primary"
        size="sm"
        disabled={isDirty || !hasUnpublished || saving}
        onClick={() => void publish()}
        title={
          isDirty
            ? "Save your draft first"
            : !hasUnpublished
              ? "No unpublished changes"
              : "Push saved draft to the live storefront"
        }
      >
        {saving ? "Publishing…" : "Publish live"}
      </AdminButton>
    </div>
  );

  if (actionsOnly) {
    return <div className={className}>{buttons}</div>;
  }

  return (
    <div
      className={cn(
        compact ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" : "space-y-3",
        className,
      )}
    >
      {showStatus ? (
        <p
          className={cn(
            "font-sans text-xs leading-relaxed",
            isDirty ? "font-medium text-amber-950" : "text-[var(--admin-muted)]",
          )}
        >
          {isDirty ? (
            <>Unsaved changes on this page</>
          ) : hasUnpublished ? (
            <>Draft saved — not yet live on the storefront</>
          ) : msg ? (
            <span className="text-emerald-800">{msg}</span>
          ) : null}
        </p>
      ) : !actionsOnly ? (
        <p className="font-sans text-xs text-[var(--admin-faint)]">In sync with the live storefront</p>
      ) : null}

      {buttons}
    </div>
  );
}
