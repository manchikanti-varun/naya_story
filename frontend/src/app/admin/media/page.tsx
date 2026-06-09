"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Grid, List, Plus, Search, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";
import type { MediaAsset } from "@/types";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminConfirmModal } from "@/components/admin/ui/AdminModal";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/ui/AdminField";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminToolbar } from "@/components/admin/ui/AdminToolbar";
import { useToast } from "@/components/admin/ui/AdminToast";
import { CloudinaryImageUpload } from "@/components/admin/CloudinaryImageUpload";

const categories = ["general", "banner", "homepage", "collection", "campaign", "lookbook", "product"];

export default function AdminMediaPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ url: "", name: "", tags: "", category: "general" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const toast = useToast();

  if (!token) {
    return <p className="font-sans text-sm text-[var(--admin-muted)]">Loading media library…</p>;
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i._id)));
    }
  }

  async function bulkDelete() {
    if (!token || selected.size === 0) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        [...selected].map((id) => apiFetch(`/media/${id}`, { method: "DELETE", token })),
      );
      publishStorefrontSettingsChanged();
      toast.success(`${selected.size} asset${selected.size > 1 ? "s" : ""} deleted`);
    } finally {
      setBulkDeleting(false);
      setBulkDeleteOpen(false);
      setSelected(new Set());
      await load();
    }
  }

  const load = useCallback(async () => {
    if (!token) return;
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    params.set("limit", "200");
    const data = await apiFetch<{ items: MediaAsset[] }>(`/media?${params.toString()}`, { token });
    setItems(data.items);
  }, [token, q, category]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load().catch(() => setItems([]));
    }, 280);
    return () => clearTimeout(t);
  }, [load]);

  async function addAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !form.url.trim() || !form.name.trim()) return;
    setBusy(true);
    try {
      await apiFetch("/media", {
        method: "POST",
        token,
        body: JSON.stringify({
          url: form.url.trim(),
          name: form.name.trim(),
          tags: form.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          category: form.category,
        }),
      });
      publishStorefrontSettingsChanged();
      setForm({ url: "", name: "", tags: "", category: form.category });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!token) return;
    await apiFetch(`/media/${id}`, { method: "DELETE", token });
    publishStorefrontSettingsChanged();
    toast.success("Asset deleted");
    setDeleteTarget(null);
    await load();
  }

  return (
    <AdminPageLayout
      title="Media library"
      description="Upload and manage images for products and CMS."
    >
      <AdminCard padding="md">
        <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Upload to Cloudinary</h2>
        <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">
          Files are sent to your API, stored in Cloudinary under <code className="text-[11px]">naya/</code>
          , then added to this library.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <CloudinaryImageUpload
            token={token}
            category={form.category}
            name={form.name || undefined}
            tags={form.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)}
            label="Choose image file"
            onUploaded={(url) => {
              setForm((f) => ({ ...f, url }));
              void load();
            }}
            onLibraryItem={() => void load()}
          />
        </div>
      </AdminCard>

      <AdminCard padding="md">
        <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Add by URL</h2>
        <form onSubmit={addAsset} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminField label="Image URL" className="sm:col-span-2">
            <AdminInput
              required
              type="url"
              placeholder="https://…"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </AdminField>
          <AdminField label="Name">
            <AdminInput
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </AdminField>
          <AdminField label="Category">
            <AdminSelect value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Tags" hint="Comma-separated" className="sm:col-span-2">
            <AdminInput
              placeholder="hero, spring, homepage"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </AdminField>
          <div className="flex items-end sm:col-span-2 lg:col-span-4 lg:justify-end">
            <AdminButton type="submit" variant="primary" disabled={busy}>
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Save to library
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      <AdminToolbar>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]"
            aria-hidden
          />
          <AdminInput
            className="pl-9"
            placeholder="Search by name or tags…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <AdminSelect className="sm:w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </AdminSelect>
      </AdminToolbar>

      {items.length === 0 ? (
        <AdminEmptyState title="No assets yet" description="Add your first image URL above." />
      ) : (
        <>
          {/* Bulk actions bar */}
          {selected.size > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-3">
              <span className="font-sans text-sm font-medium text-[var(--admin-ink)]">
                {selected.size} selected
              </span>
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 font-sans text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                disabled={bulkDeleting}
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                {bulkDeleting ? "Deleting…" : `Delete ${selected.size}`}
              </button>
              <button
                type="button"
                className="font-sans text-xs text-[var(--admin-muted)] underline-offset-4 hover:underline"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </button>
            </div>
          )}

          {/* Confirmation Modals */}
          <AdminConfirmModal
            open={bulkDeleteOpen}
            onClose={() => setBulkDeleteOpen(false)}
            onConfirm={() => void bulkDelete()}
            title={`Delete ${selected.size} asset${selected.size > 1 ? "s" : ""}?`}
            description="These files will be permanently removed from your media library."
            confirmLabel={`Delete ${selected.size}`}
            loading={bulkDeleting}
          />
          <AdminConfirmModal
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => { if (deleteTarget) void remove(deleteTarget); }}
            title="Delete asset?"
            description="This image will be permanently removed from your media library."
            confirmLabel="Delete"
          />

          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 font-sans text-xs text-[var(--admin-muted)]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--admin-border-strong)]"
                checked={items.length > 0 && selected.size === items.length}
                onChange={toggleSelectAll}
              />
              Select all
            </label>
            <div className="flex items-center gap-1 rounded-lg border border-[var(--admin-border)] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 transition ${viewMode === "grid" ? "bg-[var(--admin-ink)] text-white" : "text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"}`}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition ${viewMode === "list" ? "bg-[var(--admin-ink)] text-white" : "text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"}`}
                aria-label="List view"
              >
                <List className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <AdminCard key={item._id} padding="none" className={`overflow-hidden ${selected.has(item._id) ? "ring-2 ring-[var(--admin-accent)]" : ""}`}>
                  <div className="relative aspect-[4/3] bg-[var(--admin-surface-raised)]">
                    <Image src={item.url} alt={item.name} fill className="object-cover" sizes="280px" unoptimized />
                    <div className="absolute left-2 top-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white bg-white/80 shadow"
                        checked={selected.has(item._id)}
                        onChange={() => toggleSelect(item._id)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="truncate font-medium text-[var(--admin-ink)]">{item.name}</p>
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
                      {item.category ?? "general"}
                    </p>
                    {item.tags?.length ? (
                      <p className="text-xs text-[var(--admin-muted)]">{item.tags.join(" · ")}</p>
                    ) : null}
                    <div className="flex items-center justify-between pt-1">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void navigator.clipboard.writeText(item.url);
                          toast.success("URL copied to clipboard");
                        }}
                      >
                        Copy URL
                      </AdminButton>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                        title="Delete"
                        onClick={() => setDeleteTarget(item._id)}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </AdminCard>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item._id}
                  className={`flex items-center gap-4 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 transition hover:border-[var(--admin-border-strong)] ${selected.has(item._id) ? "ring-2 ring-[var(--admin-accent)]" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-[var(--admin-border-strong)]"
                    checked={selected.has(item._id)}
                    onChange={() => toggleSelect(item._id)}
                  />
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--admin-surface-raised)]">
                    <Image src={item.url} alt={item.name} fill className="object-cover" sizes="64px" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm font-medium text-[var(--admin-ink)]">{item.name}</p>
                    <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">
                      {item.category ?? "general"}
                      {item.tags?.length ? ` · ${item.tags.join(", ")}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <AdminButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard.writeText(item.url);
                        toast.success("URL copied");
                      }}
                    >
                      Copy URL
                    </AdminButton>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                      title="Delete"
                      onClick={() => setDeleteTarget(item._id)}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminPageLayout>
  );
}
