"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Plus, Search, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { cn } from "@/lib/cn";

type Props = {
  /** Current pinned product IDs in desired order */
  pinnedIds: string[];
  /** Called with updated ordered list of product IDs */
  onChange: (ids: string[]) => void;
  token: string | null;
  /** Max products allowed */
  max?: number;
  /** Label shown above the list */
  label?: string;
  hint?: string;
};

type ProductInfo = {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  category: string;
};

export function ProductPinEditor({
  pinnedIds,
  onChange,
  token,
  max = 20,
  label = "Pinned products",
  hint = "Drag to reorder. Products appear on the storefront in this exact order.",
}: Props) {
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [allProducts, setAllProducts] = useState<ProductInfo[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Load pinned products info
  useEffect(() => {
    if (!token || pinnedIds.length === 0) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiFetch<{ products: ProductInfo[] }>(
          `/products?ids=${pinnedIds.map(encodeURIComponent).join(",")}`,
          { token },
        );
        if (cancelled) return;
        // Preserve the pinned order
        const byId = new Map((data.products ?? []).map((p) => [p._id, p]));
        setProducts(pinnedIds.map((id) => byId.get(id)).filter(Boolean) as ProductInfo[]);
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => { cancelled = true; };
  }, [token, pinnedIds]);

  // Load all products for picker
  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ products: ProductInfo[] }>(
        "/products?limit=200&sort=newest",
        { token },
      );
      setAllProducts(data.products ?? []);
    } catch {
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (showPicker) void loadAll();
  }, [showPicker, loadAll]);

  const addProduct = (id: string) => {
    if (pinnedIds.includes(id) || pinnedIds.length >= max) return;
    onChange([...pinnedIds, id]);
  };

  const removeProduct = (id: string) => {
    onChange(pinnedIds.filter((pid) => pid !== id));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= pinnedIds.length) return;
    const next = [...pinnedIds];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  const filteredAll = allProducts.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
  });

  const pinnedSet = new Set(pinnedIds);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">{label}</p>
          <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">{hint}</p>
        </div>
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={pinnedIds.length >= max}
          onClick={() => setShowPicker(!showPicker)}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          Add
        </AdminButton>
      </div>

      {/* Pinned list */}
      {products.length > 0 ? (
        <div className="space-y-1.5">
          {products.map((p, i) => (
            <div
              key={p._id}
              className="flex items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-3 py-2"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--admin-ink)] font-sans text-[9px] font-bold text-white">
                {i + 1}
              </span>
              <div className="relative h-9 w-7 shrink-0 overflow-hidden rounded-md bg-[var(--admin-surface-sunken)]">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt="" fill className="object-cover" sizes="28px" unoptimized />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-xs font-medium text-[var(--admin-ink)]">{p.name}</p>
                <p className="truncate font-sans text-[10px] text-[var(--admin-faint)]">{p.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="rounded p-1 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-sunken)] disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  disabled={i === products.length - 1}
                  onClick={() => move(i, 1)}
                  className="rounded p-1 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-sunken)] disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => removeProduct(p._id)}
                  className="rounded p-1 text-red-500 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-[var(--admin-border)] px-4 py-5 text-center font-sans text-xs text-[var(--admin-muted)]">
          No pinned products. Products will appear in default order (newest first).
        </p>
      )}

      <p className="font-sans text-[10px] text-[var(--admin-faint)]">
        {pinnedIds.length}/{max} pinned · Unpinned products follow in default sort order
      </p>

      {/* Product picker */}
      {showPicker ? (
        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--admin-faint)]" strokeWidth={1.75} />
            <AdminInput
              className="!mt-0 pl-8 text-xs"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {loading ? (
              <p className="py-4 text-center font-sans text-xs text-[var(--admin-muted)]">Loading…</p>
            ) : filteredAll.length === 0 ? (
              <p className="py-4 text-center font-sans text-xs text-[var(--admin-muted)]">No products found</p>
            ) : (
              filteredAll.slice(0, 30).map((p) => {
                const isPinned = pinnedSet.has(p._id);
                return (
                  <button
                    key={p._id}
                    type="button"
                    disabled={isPinned}
                    onClick={() => addProduct(p._id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition",
                      isPinned
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-[var(--admin-surface-raised)]",
                    )}
                  >
                    <div className="relative h-8 w-6 shrink-0 overflow-hidden rounded bg-[var(--admin-surface-sunken)]">
                      {p.images?.[0] ? (
                        <Image src={p.images[0]} alt="" fill className="object-cover" sizes="24px" unoptimized />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-xs font-medium text-[var(--admin-ink)]">{p.name}</p>
                      <p className="truncate font-sans text-[10px] text-[var(--admin-faint)]">{p.category} · ₹{p.price}</p>
                    </div>
                    {isPinned ? (
                      <span className="font-sans text-[9px] text-[var(--admin-faint)]">Added</span>
                    ) : (
                      <Plus className="h-3.5 w-3.5 shrink-0 text-[var(--admin-accent)]" strokeWidth={1.5} />
                    )}
                  </button>
                );
              })
            )}
          </div>
          <div className="mt-2 flex justify-end">
            <AdminButton type="button" variant="ghost" size="sm" onClick={() => setShowPicker(false)}>
              Done
            </AdminButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
