"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, Eye, GripVertical, Pencil } from "lucide-react";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  description?: string;
  enabled: boolean;
  thumbnailUrl?: string | null;
  canToggle?: boolean;
  canReorder?: boolean;
  draggable?: boolean;
  isDragOver?: boolean;
  onToggle?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onEdit?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  editHref?: string;
  previewHref?: string;
  orderLabel?: string;
  children?: React.ReactNode;
};

export function CmsBlockCard({
  title,
  description,
  enabled,
  thumbnailUrl,
  canToggle = true,
  canReorder = false,
  draggable = false,
  isDragOver = false,
  onToggle,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  editHref,
  previewHref,
  orderLabel,
  children,
}: Props) {
  return (
    <li
      className={cn(
        "admin-block-card overflow-hidden",
        !enabled && "opacity-55",
        isDragOver && "ring-2 ring-[var(--admin-accent)]/35",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
          {canReorder ? (
            <GripVertical
              className="mt-1 h-4 w-4 shrink-0 text-[var(--admin-faint)]"
              strokeWidth={1.5}
              aria-hidden
            />
          ) : (
            <span className="mt-1 w-4 shrink-0" aria-hidden />
          )}

          {thumbnailUrl ? (
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-raised)]">
              <Image src={thumbnailUrl} alt="" fill className="object-cover" sizes="96px" unoptimized />
            </div>
          ) : (
            <div
              className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-raised)] font-sans text-[9px] uppercase tracking-wider text-[var(--admin-faint)]"
              aria-hidden
            >
              Preview
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--admin-ink)]">{title}</h3>
              <AdminBadge tone={enabled ? "success" : "neutral"}>
                {enabled ? "Visible" : "Hidden"}
              </AdminBadge>
              {orderLabel ? (
                <span className="font-mono text-[10px] text-[var(--admin-faint)]">{orderLabel}</span>
              ) : null}
            </div>
            {description ? (
              <p className="mt-1 font-sans text-xs leading-relaxed text-[var(--admin-muted)]">{description}</p>
            ) : null}
            {children}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          {canReorder ? (
            <div className="flex gap-0.5">
              <button
                type="button"
                className="admin-icon-btn admin-icon-btn--secondary !p-1.5 disabled:opacity-30"
                disabled={!onMoveUp}
                onClick={onMoveUp}
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                className="admin-icon-btn admin-icon-btn--secondary !p-1.5 disabled:opacity-30"
                disabled={!onMoveDown}
                onClick={onMoveDown}
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            {onEdit ? (
              <button type="button" onClick={onEdit} className="admin-icon-btn admin-icon-btn--primary">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            ) : editHref ? (
              <Link href={editHref} className="admin-icon-btn admin-icon-btn--primary">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            ) : null}
            {previewHref ? (
              <Link href={previewHref} className="admin-icon-btn admin-icon-btn--secondary">
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Link>
            ) : null}
            {canToggle && onToggle ? (
              <button type="button" onClick={onToggle} className="admin-icon-btn admin-icon-btn--secondary">
                {enabled ? "Hide" : "Show"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
