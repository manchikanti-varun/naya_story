"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { cn } from "@/lib/cn";

function dedupeIds(ids: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const t = id.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

type Props = {
  token: string;
  /** Mongo product `_id`s in display order */
  value: string[];
  onChange: (productIds: string[]) => void;
  maxItems?: number;
  label: string;
  hint?: string;
};

export function ProductIdListField({ token, value, onChange, maxItems = 8, label, hint }: Props) {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  /** IDs toggled on in the open picker (batch add). */
  const [pending, setPending] = useState<Set<string>>(new Set());

  const ids = useMemo(() => dedupeIds(value).slice(0, maxItems), [value, maxItems]);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ products: Product[] }>("/products?limit=500&sort=newest", { token });
      setCatalog(data.products);
      setLoadError(null);
    } catch {
      setLoadError("Could not load catalog.");
      setCatalog([]);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pickerOpen) setPending(new Set());
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pickerOpen]);

  const byId = useMemo(() => {
    const m = new Map<string, Product>();
    catalog.forEach((p) => m.set(p._id, p));
    return m;
  }, [catalog]);

  const selectable = useMemo(() => {
    const chosen = new Set(ids);
    let list = catalog.filter((p) => !chosen.has(p._id));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p._id.toLowerCase().includes(q),
      );
    }
    return list.slice(0, 200);
  }, [catalog, ids, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of selectable) {
      const key = p.category || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [selectable]);

  const selectableIds = useMemo(() => new Set(selectable.map((p) => p._id)), [selectable]);

  useEffect(() => {
    if (!pickerOpen) return;
    setPending((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (selectableIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [pickerOpen, selectableIds]);

  const room = maxItems - ids.length;
  const pendingInStock = useMemo(
    () => [...pending].filter((id) => selectableIds.has(id)),
    [pending, selectableIds],
  );
  const addCount = Math.min(room, pendingInStock.length);
  const selectionFull = room > 0 && pendingInStock.length >= room;

  function togglePending(id: string) {
    if (room <= 0 || !selectableIds.has(id)) return;
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      const selectedCount = [...prev].filter((x) => selectableIds.has(x)).length;
      if (selectedCount >= room) return prev;
      next.add(id);
      return next;
    });
  }

  function commitPending() {
    if (room <= 0 || pendingInStock.length === 0) return;
    const toAdd = pendingInStock.slice(0, room);
    onChange([...ids, ...toAdd]);
    setPending(new Set());
    setQuery("");
    if (ids.length + toAdd.length >= maxItems) setPickerOpen(false);
  }

  function remove(id: string) {
    onChange(ids.filter((x) => x !== id));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <>
      {pickerOpen ? (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="product-picker-title">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
            aria-label="Close catalog picker"
            onClick={() => setPickerOpen(false)}
          />
          <div className="relative z-[1] mx-auto flex w-full max-w-lg max-h-[min(92dvh,620px)] flex-col overflow-hidden rounded-t-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl sm:max-h-[min(88dvh,580px)] sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3">
              <div className="min-w-0">
                <p id="product-picker-title" className="font-sans font-semibold text-lg text-[var(--admin-ink)]">
                  Add from catalog
                </p>
                <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">
                  Tick several products, then use &ldquo;Add selected&rdquo;. You can add up to {room} more ({ids.length}/{maxItems} in list).
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)]"
                aria-label="Close"
                onClick={() => setPickerOpen(false)}
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="shrink-0 border-b border-[var(--admin-border)] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]" />
                <AdminInput
                  autoFocus
                  className="pl-9"
                  placeholder="Search name, slug, category…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {grouped.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-[var(--admin-muted)]">No matching products.</p>
              ) : (
                grouped.map(([category, items]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <p className="px-2 pb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-faint)]">
                      {category}
                    </p>
                    <ul className="space-y-1">
                      {items.map((p) => {
                        const checked = pending.has(p._id);
                        return (
                          <li key={p._id}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:bg-[var(--admin-surface-raised)]",
                                checked && "border-[var(--admin-border)] bg-[var(--admin-surface-raised)]/80",
                              )}
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 shrink-0 rounded border-[var(--admin-border-strong)] text-[var(--admin-ink)] focus:ring-[var(--admin-accent-ring)] disabled:opacity-40"
                                checked={checked}
                                disabled={room <= 0 || (!checked && selectionFull)}
                                onChange={() => togglePending(p._id)}
                              />
                              <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--admin-surface-raised)] ring-1 ring-[var(--admin-border)]/80">
                                {p.images[0] ? (
                                  <Image
                                    src={p.images[0]}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                    unoptimized
                                  />
                                ) : null}
                              </div>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium text-[var(--admin-ink)]">{p.name}</span>
                                <span className="mt-0.5 block font-mono text-[10px] text-[var(--admin-faint)]">{p.slug}</span>
                              </span>
                              <span className="shrink-0 font-sans text-xs tabular-nums text-[var(--admin-muted)]">₹{p.price}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>

            <div className="flex shrink-0 gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] p-3">
              <AdminButton variant="secondary" className="flex-1 !rounded-xl" onClick={() => setPickerOpen(false)}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                className="flex-1 !rounded-xl"
                disabled={addCount === 0 || room <= 0}
                onClick={() => commitPending()}
              >
                Add selected{pendingInStock.length > 0 ? ` (${addCount})` : ""}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}

      <div className="md:col-span-2 space-y-3">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[var(--admin-faint)]">{label}</p>
          {hint ? <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">{hint}</p> : null}
        </div>

        {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-raised)]/60 p-4">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            Selected ({ids.length}/{maxItems})
          </p>
          {ids.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-[var(--admin-muted)]">No products yet — open the catalog to add.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {ids.map((id, i) => {
                const p = byId.get(id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 shadow-sm"
                  >
                    <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-lg bg-[var(--admin-surface-raised)]">
                      {p?.images[0] ? (
                        <Image src={p.images[0]} alt="" fill className="object-cover" sizes="36px" unoptimized />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--admin-ink)]">{p?.name ?? "Unknown product"}</p>
                      <p className="truncate font-mono text-[10px] text-[var(--admin-faint)]">{id}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] disabled:opacity-30"
                        disabled={i === 0}
                        title="Move up"
                        onClick={() => move(i, -1)}
                      >
                        <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] disabled:opacity-30"
                        disabled={i === ids.length - 1}
                        title="Move down"
                        onClick={() => move(i, 1)}
                      >
                        <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                        title="Remove"
                        onClick={() => remove(id)}
                      >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            disabled={ids.length >= maxItems || catalog.length === 0}
            onClick={() => setPickerOpen((o) => !o)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-left text-sm font-medium text-[var(--admin-ink)] shadow-sm transition hover:border-[var(--admin-border-strong)]",
              (ids.length >= maxItems || catalog.length === 0) && "cursor-not-allowed opacity-50",
            )}
          >
            <span>{ids.length >= maxItems ? `Maximum ${maxItems} products` : "Add products from catalog"}</span>
            <ChevronDown className={cn("h-4 w-4 text-[var(--admin-muted)] transition", pickerOpen && "rotate-180")} />
          </button>
        </div>
      </div>
    </>
  );
}
