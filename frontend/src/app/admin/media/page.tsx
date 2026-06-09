"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Filter,
  FolderOpen,
  Grid,
  ImageIcon,
  Info,
  Link2,
  List,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";
import type { MediaAsset } from "@/types";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminConfirmModal } from "@/components/admin/ui/AdminModal";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { useToast } from "@/components/admin/ui/AdminToast";
import { CloudinaryImageUpload } from "@/components/admin/CloudinaryImageUpload";
import { cn } from "@/lib/cn";

const CATEGORIES = ["general", "product", "banner", "homepage", "collection", "campaign", "lookbook", "editorial"];

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminMediaLibrary() {
  const { token } = useAuth();
  const toast = useToast();

  // Data
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // View
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set());

  // Modals
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  if (!token) return <p className="p-8 text-sm text-[var(--admin-muted)]">Loading…</p>;

  // Load
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (q.trim()) params.set("q", q.trim());
      if (categoryFilter) params.set("category", categoryFilter);
      const data = await apiFetch<{ items: MediaAsset[] }>(`/media?${params}`, { token });
      setItems(data.items);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [token, q, categoryFilter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 280);
    return () => clearTimeout(t);
  }, [load]);

  // Selection
  const selectedAsset = useMemo(() => items.find((i) => i._id === selectedId) ?? null, [items, selectedId]);

  function toggleMultiSelect(id: string) {
    setMultiSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function selectAll() { setMultiSelected(new Set(items.map((i) => i._id))); }
  function clearSelection() { setMultiSelected(new Set()); }

  // Actions
  async function deleteAsset(id: string) {
    await apiFetch(`/media/${id}`, { method: "DELETE", token });
    publishStorefrontSettingsChanged();
    toast.success("Asset deleted");
    setDeleteTarget(null);
    if (selectedId === id) setSelectedId(null);
    multiSelected.delete(id);
    await load();
  }

  async function bulkDelete() {
    if (multiSelected.size === 0) return;
    await Promise.all([...multiSelected].map((id) => apiFetch(`/media/${id}`, { method: "DELETE", token })));
    publishStorefrontSettingsChanged();
    toast.success(`${multiSelected.size} assets deleted`);
    setBulkDeleteOpen(false);
    clearSelection();
    setSelectedId(null);
    await load();
  }

  function copyUrl(url: string) {
    void navigator.clipboard.writeText(url);
    toast.success("URL copied");
  }

  // Category counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { const c = i.category ?? "general"; map[c] = (map[c] ?? 0) + 1; });
    return map;
  }, [items]);

  // ═══════════════════════════════════════
  // LEFT PANEL — Filters
  // ═══════════════════════════════════════
  const leftPanel = (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-[var(--admin-border)] px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[var(--admin-accent)]" strokeWidth={1.75} />
            <h2 className="font-sans text-sm font-bold text-[var(--admin-ink)]">Media</h2>
          </div>
          <span className="font-sans text-[10px] font-semibold tabular-nums text-[var(--admin-faint)]">{items.length} files</span>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--admin-faint)]" strokeWidth={1.75} />
          <input className="admin-input w-full py-1.5 pl-8 text-xs" placeholder="Search files…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Categories */}
        <div>
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Categories</p>
          <div className="space-y-0.5">
            <button type="button" onClick={() => setCategoryFilter("")}
              className={cn("flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left font-sans text-xs transition", !categoryFilter ? "bg-[var(--admin-accent-soft)] font-medium text-[var(--admin-accent)]" : "text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)]")}>
              <span>All files</span>
              <span className="tabular-nums">{items.length}</span>
            </button>
            {CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => setCategoryFilter(categoryFilter === cat ? "" : cat)}
                className={cn("flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left font-sans text-xs capitalize transition", categoryFilter === cat ? "bg-[var(--admin-accent-soft)] font-medium text-[var(--admin-accent)]" : "text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)]")}>
                <span>{cat}</span>
                <span className="tabular-nums text-[var(--admin-faint)]">{categoryCounts[cat] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick filters */}
        <div>
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Quick Filters</p>
          <div className="space-y-0.5">
            <button type="button" onClick={() => { setCategoryFilter(""); setQ(""); }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left font-sans text-xs text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)]">
              <X className="h-3 w-3" strokeWidth={1.75} /> Clear all filters
            </button>
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="shrink-0 border-t border-[var(--admin-border)] p-3">
        <button type="button" onClick={() => setShowUpload(!showUpload)}
          className="admin-btn admin-btn--primary admin-btn--sm w-full justify-center">
          <Upload className="h-3.5 w-3.5" strokeWidth={1.75} /> Upload
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════
  // CENTER PANEL — Asset Grid/List
  // ═══════════════════════════════════════
  const centerPanel = (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {multiSelected.size > 0 ? (
              <>
                <span className="font-sans text-xs font-medium text-[var(--admin-ink)]">{multiSelected.size} selected</span>
                <button type="button" onClick={() => setBulkDeleteOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 font-sans text-[10px] font-semibold text-white hover:bg-red-700">
                  <Trash2 className="h-3 w-3" strokeWidth={1.75} /> Delete
                </button>
                <button type="button" onClick={clearSelection} className="font-sans text-[10px] text-[var(--admin-muted)] hover:underline">Clear</button>
              </>
            ) : (
              <>
                <label className="flex items-center gap-1.5 font-sans text-xs text-[var(--admin-muted)] cursor-pointer">
                  <input type="checkbox" className="h-3.5 w-3.5" checked={items.length > 0 && multiSelected.size === items.length} onChange={() => multiSelected.size === items.length ? clearSelection() : selectAll()} />
                  All
                </label>
                <span className="font-sans text-[10px] text-[var(--admin-faint)]">{items.length} assets</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void load()} disabled={loading}
              className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] disabled:opacity-50">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-0.5 rounded-md border border-[var(--admin-border)] p-0.5">
              <button type="button" onClick={() => setViewMode("grid")}
                className={cn("rounded p-1 transition", viewMode === "grid" ? "bg-[var(--admin-ink)] text-white" : "text-[var(--admin-muted)]")}>
                <Grid className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <button type="button" onClick={() => setViewMode("list")}
                className={cn("rounded p-1 transition", viewMode === "list" ? "bg-[var(--admin-ink)] text-white" : "text-[var(--admin-muted)]")}>
                <List className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone (toggled) */}
      {showUpload && (
        <div className="shrink-0 border-b border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-4">
          <CloudinaryImageUpload token={token} category={categoryFilter || "general"} label="Drop image here or click to upload"
            onUploaded={() => { void load(); setShowUpload(false); }} onLibraryItem={() => void load()} />
        </div>
      )}

      {/* Asset Grid/List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {loading && items.length === 0 ? (
          <div className="flex h-full items-center justify-center"><p className="text-sm text-[var(--admin-muted)]">Loading assets…</p></div>
        ) : items.length === 0 ? (
          <AdminEmptyState title="No assets" description="Upload your first image to get started." />
        ) : viewMode === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const isSelected = selectedId === item._id;
              const isMulti = multiSelected.has(item._id);
              return (
                <div key={item._id} onClick={() => setSelectedId(item._id)}
                  className={cn(
                    "group cursor-pointer overflow-hidden rounded-[var(--admin-radius)] border transition",
                    isSelected ? "border-[var(--admin-accent)] ring-2 ring-[var(--admin-accent-ring)]" : "border-[var(--admin-border)] hover:border-[var(--admin-border-strong)]",
                    isMulti && "ring-2 ring-[var(--admin-accent)]",
                  )}>
                  <div className="relative aspect-[4/3] bg-[var(--admin-surface-raised)]">
                    <Image src={item.url} alt={item.name} fill className="object-cover" sizes="240px" unoptimized />
                    <div className="absolute left-2 top-2" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="h-4 w-4 rounded border-white bg-white/80 shadow" checked={isMulti} onChange={() => toggleMultiSelect(item._id)} />
                    </div>
                  </div>
                  <div className="bg-[var(--admin-surface)] px-3 py-2.5">
                    <p className="truncate font-sans text-xs font-medium text-[var(--admin-ink)]">{item.name}</p>
                    <p className="mt-0.5 font-sans text-[10px] text-[var(--admin-faint)] capitalize">{item.category ?? "general"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => {
              const isSelected = selectedId === item._id;
              const isMulti = multiSelected.has(item._id);
              return (
                <div key={item._id} onClick={() => setSelectedId(item._id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-[var(--admin-radius-xs)] border px-3 py-2.5 transition",
                    isSelected ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]" : "border-[var(--admin-border)] hover:border-[var(--admin-border-strong)]",
                    isMulti && "ring-1 ring-[var(--admin-accent)]",
                  )}>
                  <input type="checkbox" className="h-4 w-4 shrink-0" checked={isMulti} onChange={(e) => { e.stopPropagation(); toggleMultiSelect(item._id); }} onClick={(e) => e.stopPropagation()} />
                  <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--admin-surface-raised)]">
                    <Image src={item.url} alt="" fill className="object-cover" sizes="56px" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-xs font-medium text-[var(--admin-ink)]">{item.name}</p>
                    <p className="mt-0.5 font-sans text-[10px] text-[var(--admin-faint)] capitalize">{item.category ?? "general"}{item.tags?.length ? ` · ${item.tags.slice(0, 3).join(", ")}` : ""}</p>
                  </div>
                  <span className="shrink-0 font-sans text-[10px] text-[var(--admin-faint)]">{formatDate(item.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════
  // RIGHT PANEL — Metadata
  // ═══════════════════════════════════════
  const rightPanel = selectedAsset ? (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-[var(--admin-border)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-accent)]">Asset Details</p>
          <button type="button" onClick={() => setSelectedId(null)} className="rounded-md p-1 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)]">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Preview */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface-raised)]">
          <Image src={selectedAsset.url} alt={selectedAsset.name} fill className="object-contain" sizes="320px" unoptimized />
        </div>

        {/* File Info */}
        <div className="space-y-3">
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Filename</p>
            <p className="mt-1 font-sans text-sm font-medium text-[var(--admin-ink)]">{selectedAsset.name}</p>
          </div>

          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Category</p>
            <AdminBadge tone="neutral" className="mt-1 capitalize">{selectedAsset.category ?? "general"}</AdminBadge>
          </div>

          {selectedAsset.tags?.length ? (
            <div>
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Tags</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {selectedAsset.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-2 py-0.5 font-sans text-[10px] text-[var(--admin-muted)]">{tag}</span>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Uploaded</p>
            <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">{formatDate(selectedAsset.createdAt)}</p>
          </div>

          {/* CDN URL */}
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">CDN URL</p>
            <div className="mt-1.5 flex items-start gap-2">
              <p className="min-w-0 flex-1 break-all rounded-md bg-[var(--admin-surface-raised)] px-2.5 py-2 font-mono text-[10px] text-[var(--admin-muted)]">
                {selectedAsset.url}
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              <AdminButton variant="secondary" size="sm" onClick={() => copyUrl(selectedAsset.url)}>
                <Copy className="h-3 w-3" strokeWidth={1.75} /> Copy URL
              </AdminButton>
              <a href={selectedAsset.url} target="_blank" rel="noopener noreferrer"
                className="admin-btn admin-btn--ghost admin-btn--sm inline-flex items-center gap-1">
                <ExternalLink className="h-3 w-3" strokeWidth={1.75} /> Open
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[var(--admin-border)] pt-4">
          <AdminButton variant="danger" size="sm" onClick={() => setDeleteTarget(selectedAsset._id)}>
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Delete asset
          </AdminButton>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex h-full items-center justify-center px-6">
      <div className="text-center">
        <Info className="mx-auto h-8 w-8 text-[var(--admin-faint)]" strokeWidth={1} />
        <p className="mt-3 font-sans text-sm font-medium text-[var(--admin-ink)]">Asset details</p>
        <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">Select a file to view metadata</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════
  // MODALS
  // ═══════════════════════════════════════
  const modals = (
    <>
      <AdminConfirmModal open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} onConfirm={() => void bulkDelete()}
        title={`Delete ${multiSelected.size} assets?`} description="These files will be permanently removed." confirmLabel={`Delete ${multiSelected.size}`} />
      <AdminConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) void deleteAsset(deleteTarget); }}
        title="Delete asset?" description="This file will be permanently removed from your media library." confirmLabel="Delete" />
    </>
  );

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-10 lg:-my-8" style={{ height: "calc(100vh - 60px)" }}>
      <div className="flex h-full overflow-hidden">
        {/* Left Panel */}
        <div className="hidden w-[240px] shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] lg:flex">
          {leftPanel}
        </div>

        {/* Center Panel */}
        <div className="min-w-0 flex-1 bg-[var(--admin-surface-raised)]">
          {centerPanel}
        </div>

        {/* Right Panel */}
        <div className="hidden w-[300px] shrink-0 flex-col border-l border-[var(--admin-border)] bg-[var(--admin-surface)] xl:flex">
          {rightPanel}
        </div>
      </div>
      {modals}
    </div>
  );
}
