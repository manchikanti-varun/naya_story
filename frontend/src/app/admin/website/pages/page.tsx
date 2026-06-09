"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  GripVertical,
  History,
  Layers,
  Monitor,
  Pencil,
  Plus,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import {
  buildLayoutBlocksFromHomepage,
  getOrderedStorefrontBlocks,
  mergeLayoutBlocksIntoHomepageClient,
  reorderHomepageStorefrontBlocks,
} from "@/lib/homepage-layout-blocks";
import { getSectionMeta, STOREFRONT_SECTION_META } from "@/lib/cms/section-meta";
import { renderHomepageSectionEditor, isEditableHomepageBlock } from "@/lib/admin/section-editor-registry";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInlineLoading } from "@/components/admin/ui/AdminLoader";
import { useToast } from "@/components/admin/ui/AdminToast";
import { cn } from "@/lib/cn";
import type { HomepageLayoutBlockType, HomepageStorefrontBlockType } from "@/types/homepage";

// ============================================
// MAIN BUILDER COMPONENT
// ============================================

function CMSBuilder() {
  const editor = useHomepageEditor();
  const { hp, setHp, isDirty, save, publish, discardDraft, saving, cmsMeta, moveStorefrontBlock } = editor;
  const toast = useToast();
  const [selectedSection, setSelectedSection] = useState<HomepageLayoutBlockType | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showRevisions, setShowRevisions] = useState(false);

  if (!hp) return <AdminInlineLoading label="Loading homepage…" />;

  const storefrontBlocks = getOrderedStorefrontBlocks(hp);
  const selectedMeta = selectedSection ? getSectionMeta(selectedSection) : null;

  const toggleBlock = (id: string) => {
    setHp((prev) => {
      if (!prev) return prev;
      const base = prev.layoutBlocks?.length ? prev.layoutBlocks : buildLayoutBlocksFromHomepage(prev);
      const next = base.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b));
      return mergeLayoutBlocksIntoHomepageClient(prev, next);
    });
  };

  const handleReorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setHp((prev) => (prev ? reorderHomepageStorefrontBlocks(prev, fromIdx, toIdx) : prev));
  };

  // ═══════════════════════════════════════════
  // LEFT PANEL — Section Library
  // ═══════════════════════════════════════════
  const leftPanel = (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-[var(--admin-border)] px-4 py-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[var(--admin-accent)]" strokeWidth={1.75} />
          <h2 className="font-sans text-sm font-bold text-[var(--admin-ink)]">Sections</h2>
        </div>
        <p className="mt-1 font-sans text-[11px] text-[var(--admin-faint)]">
          {storefrontBlocks.filter((b) => b.enabled).length} active · {storefrontBlocks.length} total
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-3 space-y-1.5">
          {storefrontBlocks.map((block, idx) => {
            const meta = getSectionMeta(block.type);
            const isSelected = selectedSection === block.type;
            const editable = isEditableHomepageBlock(block.type);
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => editable ? setSelectedSection(block.type) : undefined}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-[var(--admin-radius-xs)] border px-3 py-2.5 text-left transition",
                  isSelected
                    ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]"
                    : "border-[var(--admin-border)] hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-raised)]",
                  !block.enabled && "opacity-50",
                )}
              >
                {/* Drag handle */}
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-[var(--admin-faint)] opacity-0 group-hover:opacity-100" strokeWidth={1.5} />

                {/* Section info */}
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "truncate font-sans text-xs font-medium",
                    isSelected ? "text-[var(--admin-accent)]" : "text-[var(--admin-ink)]",
                  )}>
                    {meta.label}
                  </p>
                </div>

                {/* Status indicator */}
                {block.enabled ? (
                  <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" title="Visible" />
                ) : (
                  <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--admin-faint)]" title="Hidden" />
                )}

                {/* Reorder controls */}
                <div className="flex shrink-0 flex-col opacity-0 group-hover:opacity-100">
                  <button type="button" disabled={idx === 0}
                    onClick={(e) => { e.stopPropagation(); moveStorefrontBlock(block.type as HomepageStorefrontBlockType, -1); }}
                    className="rounded p-0.5 text-[var(--admin-faint)] hover:text-[var(--admin-ink)] disabled:opacity-30">
                    <ChevronUp className="h-3 w-3" strokeWidth={2} />
                  </button>
                  <button type="button" disabled={idx === storefrontBlocks.length - 1}
                    onClick={(e) => { e.stopPropagation(); moveStorefrontBlock(block.type as HomepageStorefrontBlockType, 1); }}
                    className="rounded p-0.5 text-[var(--admin-faint)] hover:text-[var(--admin-ink)] disabled:opacity-30">
                    <ChevronDown className="h-3 w-3" strokeWidth={2} />
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CMS Status Footer */}
      <div className="shrink-0 border-t border-[var(--admin-border)] px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Status</span>
          {isDirty ? (
            <AdminBadge tone="warning">Unsaved</AdminBadge>
          ) : cmsMeta?.hasUnpublishedChanges ? (
            <AdminBadge tone="neutral">Draft</AdminBadge>
          ) : (
            <AdminBadge tone="success">Published</AdminBadge>
          )}
        </div>
        {cmsMeta?.publishedAt ? (
          <p className="font-sans text-[10px] text-[var(--admin-faint)]">
            Last published: {new Date(cmsMeta.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        ) : null}
        <p className="font-sans text-[10px] text-[var(--admin-faint)]">
          Version: {cmsMeta?.version ?? 0}
        </p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // CENTER PANEL — Canvas
  // ═══════════════════════════════════════════
  const centerPanel = (
    <div className="flex h-full flex-col">
      {/* Canvas header */}
      <div className="shrink-0 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-sans text-base font-bold text-[var(--admin-ink)]">Homepage Builder</h1>
            <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">
              Select a section to edit · Drag to reorder
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]" title="View live store">
              <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <button type="button" onClick={() => setShowRevisions(!showRevisions)}
              className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]" title="Revision history">
              <History className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas body — Section cards */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {storefrontBlocks.map((block, idx) => {
            const meta = getSectionMeta(block.type);
            const isSelected = selectedSection === block.type;
            const editable = isEditableHomepageBlock(block.type);
            return (
              <div
                key={block.id}
                className={cn(
                  "group rounded-[var(--admin-radius)] border transition cursor-pointer",
                  isSelected
                    ? "border-[var(--admin-accent)] ring-2 ring-[var(--admin-accent-ring)] bg-[var(--admin-surface)]"
                    : "border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[var(--admin-border-strong)] hover:shadow-[var(--admin-shadow-sm)]",
                  !block.enabled && "opacity-50",
                )}
                onClick={() => editable ? setSelectedSection(block.type) : undefined}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Section info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-sans text-sm font-semibold text-[var(--admin-ink)]">{meta.label}</p>
                      {!block.enabled && <AdminBadge tone="neutral">Hidden</AdminBadge>}
                    </div>
                    <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">{meta.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleBlock(block.id); }}
                      className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)]" title={block.enabled ? "Hide" : "Show"}>
                      {block.enabled ? <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> : <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />}
                    </button>
                    {idx > 0 && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); moveStorefrontBlock(block.type as HomepageStorefrontBlockType, -1); }}
                        className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)]" title="Move up">
                        <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                    {idx < storefrontBlocks.length - 1 && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); moveStorefrontBlock(block.type as HomepageStorefrontBlockType, 1); }}
                        className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)]" title="Move down">
                        <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                    {editable && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedSection(block.type); }}
                        className="rounded-md p-1.5 text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)]" title="Edit">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Publish Bar */}
      <div className="shrink-0 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isDirty ? (
              <span className="flex items-center gap-1.5 font-sans text-xs font-medium text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Unsaved changes
              </span>
            ) : cmsMeta?.hasUnpublishedChanges ? (
              <span className="flex items-center gap-1.5 font-sans text-xs text-[var(--admin-muted)]">
                <span className="h-2 w-2 rounded-full bg-blue-400" /> Draft saved — not live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-sans text-xs text-[var(--admin-muted)]">
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} /> In sync
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AdminButton variant="ghost" size="sm" disabled={!isDirty || saving} onClick={() => discardDraft()}>
              Discard
            </AdminButton>
            <AdminButton variant="secondary" size="sm" disabled={!isDirty || saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save draft"}
            </AdminButton>
            <AdminButton variant="primary" size="sm" disabled={isDirty || !(cmsMeta?.hasUnpublishedChanges) || saving} onClick={() => void publish()}>
              {saving ? "Publishing…" : "Publish"}
            </AdminButton>
          </div>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // RIGHT PANEL — Properties
  // ═══════════════════════════════════════════
  const rightPanel = selectedSection ? (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-[var(--admin-border)] px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-accent)]">Editing</p>
            <h3 className="mt-0.5 font-sans text-sm font-bold text-[var(--admin-ink)]">{selectedMeta?.label}</h3>
          </div>
          <button type="button" onClick={() => setSelectedSection(null)}
            className="rounded-lg border border-[var(--admin-border)] p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]" aria-label="Close">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {renderHomepageSectionEditor(selectedSection)}
      </div>
    </div>
  ) : (
    <div className="flex h-full items-center justify-center px-6">
      <div className="text-center">
        <Pencil className="mx-auto h-8 w-8 text-[var(--admin-faint)]" strokeWidth={1} />
        <p className="mt-3 font-sans text-sm font-medium text-[var(--admin-ink)]">Select a section</p>
        <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">Click a section in the canvas to edit its properties</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-10 lg:-my-8" style={{ height: "calc(100vh - 60px)" }}>
      <div className="flex h-full overflow-hidden">
        {/* Left Panel — Section Library */}
        <div className="hidden w-[260px] shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] lg:flex">
          {leftPanel}
        </div>

        {/* Center Panel — Canvas */}
        <div className="min-w-0 flex-1 bg-[var(--admin-surface-raised)]">
          {centerPanel}
        </div>

        {/* Right Panel — Properties */}
        <div className="hidden w-[340px] shrink-0 flex-col border-l border-[var(--admin-border)] bg-[var(--admin-surface)] xl:flex">
          {rightPanel}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE EXPORT (wraps in context)
// ============================================

export default function WebsitePagesPage() {
  return (
    <Suspense fallback={<AdminInlineLoading label="Loading CMS…" />}>
      <CMSBuilder />
    </Suspense>
  );
}
