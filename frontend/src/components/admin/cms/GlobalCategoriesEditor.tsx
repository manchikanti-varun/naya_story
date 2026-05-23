"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { CmsImageUrlField } from "@/components/admin/cms/CmsImageUrlField";
import { CmsSectionHeading, CmsVisibilityToggle } from "@/components/admin/cms/CmsFormHelpers";
import { AdminField, AdminInput } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import {
  hrefFromCategorySlug,
  slugifyCategoryName,
  type GlobalStoreCategory,
} from "@/lib/cms/global-categories";

type Props = {
  categories: GlobalStoreCategory[];
  token: string | null;
  onChange: (next: GlobalStoreCategory[]) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (index: number, dir: -1 | 1) => void;
};

export function GlobalCategoriesEditor({
  categories,
  token,
  onChange,
  onAdd,
  onRemove,
  onMove,
}: Props) {
  const sorted = [...categories].sort((a, b) => a.order - b.order);

  function patch(id: string, patch: Partial<GlobalStoreCategory>) {
    onChange(
      categories.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...patch };
        if (patch.slug !== undefined || patch.name !== undefined) {
          const slug =
            (patch.slug ?? next.slug).trim() ||
            slugifyCategoryName(patch.name ?? next.name) ||
            next.slug;
          next.slug = slug;
          if (patch.href === undefined && !c.href.includes("category=")) {
            next.href = hrefFromCategorySlug(slug);
          }
        }
        if (patch.slug !== undefined && patch.href === undefined) {
          next.href = hrefFromCategorySlug(patch.slug);
        }
        return next;
      }),
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-sans text-xs leading-relaxed text-[var(--admin-muted)]">
        Categories are shared globally. Homepage cards and Collections catalog tabs stay in sync
        when you save.
      </p>

      {sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--admin-border)] px-4 py-8 text-center font-sans text-sm text-[var(--admin-muted)]">
          No categories yet — add your first card below.
        </p>
      ) : (
        sorted.map((cat, i) => (
          <div key={cat.id} className="admin-cms-group">
            <div className="admin-cms-group-header">
              <CmsSectionHeading>{cat.name || "Category"}</CmsSectionHeading>
              <div className="flex flex-wrap items-center gap-3">
                <CmsVisibilityToggle
                  label="Active"
                  checked={cat.enabled}
                  onChange={(enabled) => patch(cat.id, { enabled })}
                />
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] disabled:opacity-30"
                    disabled={i === 0}
                    aria-label="Move up"
                    onClick={() => onMove(i, -1)}
                  >
                    <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] disabled:opacity-30"
                    disabled={i === sorted.length - 1}
                    aria-label="Move down"
                    onClick={() => onMove(i, 1)}
                  >
                    <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    aria-label="Remove category"
                    onClick={() => onRemove(cat.id)}
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
            <div className="admin-cms-group-body">
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Display name">
                  <AdminInput
                    value={cat.name}
                    onChange={(e) => patch(cat.id, { name: e.target.value })}
                  />
                </AdminField>
                <AdminField label="Catalog slug" hint="Matches product category field in catalog.">
                  <AdminInput
                    value={cat.slug}
                    onChange={(e) => patch(cat.id, { slug: e.target.value })}
                  />
                </AdminField>
                <AdminField label="Link" className="md:col-span-2">
                  <AdminInput
                    value={cat.href}
                    onChange={(e) => patch(cat.id, { href: e.target.value })}
                  />
                </AdminField>
                <CmsImageUrlField
                  label="Card image"
                  className="md:col-span-2"
                  token={token}
                  value={cat.image}
                  onChange={(image) => patch(cat.id, { image })}
                />
                <label className="flex items-center gap-2 font-sans text-sm text-[var(--admin-ink)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--admin-border-strong)]"
                    checked={cat.homepage}
                    onChange={(e) => patch(cat.id, { homepage: e.target.checked })}
                  />
                  Show on homepage
                </label>
                <label className="flex items-center gap-2 font-sans text-sm text-[var(--admin-ink)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--admin-border-strong)]"
                    checked={cat.collections}
                    onChange={(e) => patch(cat.id, { collections: e.target.checked })}
                  />
                  Show on Collections page
                </label>
              </div>
            </div>
          </div>
        ))
      )}

      <AdminButton type="button" variant="secondary" className="!rounded-full" onClick={onAdd}>
        <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
        Add category
      </AdminButton>
    </div>
  );
}
