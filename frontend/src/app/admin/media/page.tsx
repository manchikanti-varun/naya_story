"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Copy, ExternalLink, Grid, List, Plus, Search, Trash2, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";
import type { MediaAsset } from "@/types";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminConfirmModal } from "@/components/admin/ui/AdminModal";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/ui/AdminField";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminToolbar } from "@/components/admin/ui/AdminToolbar";
import { useToast } from "@/components/admin/ui/AdminToast";
import { BulkImageUpload } from "@/components/admin/BulkImageUpload";
import { cn } from "@/lib/cn";

const CATEGORIES = ["general", "product", "banner", "homepage", "collection", "campaign", "lookbook"];

function formatDate(iso?: string) { if (!iso) return "—"; return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }

export default function AdminMediaPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  if (!token) return <p className="p-8 text-sm text-[var(--admin-muted)]">Loading…</p>;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (q.trim()) params.set("q", q.trim());
      if (category) params.set("category", category);
      const data = await apiFetch<{ items: MediaAsset[] }>(`/media?${params}`, { token });
      setItems(data.items);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [token, q, category]);

  useEffect(() => { const t = setTimeout(() => void load(), 280); return () => clearTimeout(t); }, [load]);

  async function remove(id: string) {
    await apiFetch(`/media/${id}`, { method: "DELETE", token });
    publishStorefrontSettingsChanged();
    toast.success("Asset deleted");
    setDeleteTarget(null);
    if (selected?._id === id) setSelected(null);
    await load();
  }

  return (
    <AdminPageLayout
      title="Media Library"
      description={`${items.length} assets`}
      actions={
        <AdminButton variant="primary" size="sm" onClick={() => setShowUpload(!showUpload)}>
          <Upload className="h-3.5 w-3.5" strokeWidth={1.75} /> Upload
        </AdminButton>
      }
      toolbar={
        <AdminToolbar className="w-full border-0 bg-transparent p-0 shadow-none">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]" strokeWidth={1.75} />
            <AdminInput className="!mt-0 pl-9" placeholder="Search files…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <AdminSelect className="sm:w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </AdminSelect>
          <div className="flex gap-0.5 rounded-md border border-[var(--admin-border)] p-0.5">
            <button type="button" onClick={() => setViewMode("grid")} className={cn("rounded p-1.5 transition", viewMode === "grid" ? "bg-[var(--admin-ink)] text-white" : "text-[var(--admin-muted)]")}><Grid className="h-3.5 w-3.5" strokeWidth={1.75} /></button>
            <button type="button" onClick={() => setViewMode("list")} className={cn("rounded p-1.5 transition", viewMode === "list" ? "bg-[var(--admin-ink)] text-white" : "text-[var(--admin-muted)]")}><List className="h-3.5 w-3.5" strokeWidth={1.75} /></button>
          </div>
        </AdminToolbar>
      }
    >
      {/* Upload area */}
      {showUpload && (
        <AdminCard padding="md">
          <BulkImageUpload
            token={token}
            category={category || "general"}
            maxFiles={10}
            onUploaded={(_urls) => { void load(); setShowUpload(false); }}
          />
        </AdminCard>
      )}

      <AdminConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) void remove(deleteTarget); }} title="Delete asset?" description="This file will be permanently removed." confirmLabel="Delete" />

      {/* Content */}
      {!loading && items.length === 0 ? (
        <AdminEmptyState title="No assets" description="Upload your first image to get started." />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item._id} onClick={() => setSelected(item)} className="group cursor-pointer overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)] transition hover:border-[var(--admin-border-strong)] hover:shadow-[var(--admin-shadow-sm)]">
              <div className="relative aspect-[4/3] bg-[var(--admin-surface-raised)]">
                <Image src={item.url} alt={item.name} fill className="object-cover" sizes="280px" unoptimized />
              </div>
              <div className="bg-[var(--admin-surface)] px-3 py-2.5">
                <p className="truncate text-xs font-medium text-[var(--admin-ink)]">{item.name}</p>
                <p className="mt-0.5 text-[10px] capitalize text-[var(--admin-faint)]">{item.category ?? "general"}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item._id} onClick={() => setSelected(item)} className="flex cursor-pointer items-center gap-3 rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] px-3 py-2.5 transition hover:border-[var(--admin-border-strong)]">
              <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--admin-surface-raised)]">
                <Image src={item.url} alt="" fill className="object-cover" sizes="56px" unoptimized />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[var(--admin-ink)]">{item.name}</p>
                <p className="text-[10px] capitalize text-[var(--admin-faint)]">{item.category ?? "general"}{item.tags?.length ? ` · ${item.tags.slice(0, 3).join(", ")}` : ""}</p>
              </div>
              <span className="shrink-0 text-[10px] text-[var(--admin-faint)]">{formatDate(item.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Asset Detail Drawer */}
      <AdminDrawer open={!!selected} onClose={() => setSelected(null)} title="Asset details">
        {selected && (
          <div className="space-y-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface-raised)]">
              <Image src={selected.url} alt={selected.name} fill className="object-contain" sizes="400px" unoptimized />
            </div>
            <div className="space-y-3">
              <div><p className="text-[10px] font-medium uppercase tracking-wide text-[var(--admin-faint)]">Name</p><p className="mt-0.5 text-sm font-medium text-[var(--admin-ink)]">{selected.name}</p></div>
              <div><p className="text-[10px] font-medium uppercase tracking-wide text-[var(--admin-faint)]">Category</p><AdminBadge tone="neutral" className="mt-1 capitalize">{selected.category ?? "general"}</AdminBadge></div>
              {selected.tags?.length ? <div><p className="text-[10px] font-medium uppercase tracking-wide text-[var(--admin-faint)]">Tags</p><div className="mt-1 flex flex-wrap gap-1">{selected.tags.map((t) => <span key={t} className="rounded-full border border-[var(--admin-border)] px-2 py-0.5 text-[10px] text-[var(--admin-muted)]">{t}</span>)}</div></div> : null}
              <div><p className="text-[10px] font-medium uppercase tracking-wide text-[var(--admin-faint)]">Uploaded</p><p className="mt-0.5 text-xs text-[var(--admin-muted)]">{formatDate(selected.createdAt)}</p></div>
              <div><p className="text-[10px] font-medium uppercase tracking-wide text-[var(--admin-faint)]">URL</p><p className="mt-1 break-all rounded-md bg-[var(--admin-surface-raised)] px-2.5 py-2 font-mono text-[10px] text-[var(--admin-muted)]">{selected.url}</p></div>
            </div>
            <div className="flex gap-2">
              <AdminButton variant="secondary" size="sm" onClick={() => { void navigator.clipboard.writeText(selected.url); toast.success("URL copied"); }}><Copy className="h-3 w-3" strokeWidth={1.75} /> Copy URL</AdminButton>
              <a href={selected.url} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--ghost admin-btn--sm"><ExternalLink className="h-3 w-3" strokeWidth={1.75} /> Open</a>
            </div>
            <AdminButton variant="danger" size="sm" onClick={() => setDeleteTarget(selected._id)}><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Delete</AdminButton>
          </div>
        )}
      </AdminDrawer>
    </AdminPageLayout>
  );
}
