"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/cn";

const categories = ["dresses", "tops", "outerwear", "sets"];
const sizes = ["XS", "S", "M", "L", "XL"];
const colors = ["Ivory", "Sand", "Noir", "Rose"];

type Props = {
  className?: string;
};

export function CollectionFilters({ className }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [priceDraft, setPriceDraft] = useState({
    min: params.get("minPrice") ?? "",
    max: params.get("maxPrice") ?? "",
  });

  useEffect(() => {
    setPriceDraft({
      min: params.get("minPrice") ?? "",
      max: params.get("maxPrice") ?? "",
    });
  }, [params]);

  const current = useMemo(() => {
    return {
      category: params.get("category") ?? "",
      size: params.get("size") ?? "",
      color: params.get("color") ?? "",
      min: params.get("minPrice") ?? "",
      max: params.get("maxPrice") ?? "",
      stock: params.get("inStock") === "true",
      sort: params.get("sort") ?? "featured",
      collection: params.get("collection") ?? "",
      tag: params.get("tag") ?? "",
    };
  }, [params]);

  const pushParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      });
      startTransition(() => {
        router.push(`/collections?${next.toString()}`);
      });
    },
    [params, router],
  );

  return (
    <aside className={cn("space-y-10", className)}>
      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink-soft">
          Sort
        </p>
        <select
          value={current.sort}
          disabled={pending}
          onChange={(e) => pushParams({ sort: e.target.value })}
          className="mt-3 w-full rounded-2xl border border-ivory-deep bg-white px-4 py-3 font-sans text-sm text-ink outline-none focus:ring-2 focus:ring-gold/40"
        >
          <option value="featured">Curated</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price · ascending</option>
          <option value="price_desc">Price · descending</option>
        </select>
      </div>

      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink-soft">
          Category
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip
            active={!current.category}
            label="All"
            onClick={() => pushParams({ category: null })}
          />
          {categories.map((c) => (
            <FilterChip
              key={c}
              active={current.category === c}
              label={c}
              onClick={() =>
                pushParams({ category: current.category === c ? null : c })
              }
            />
          ))}
        </div>
      </div>

      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink-soft">
          Size
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sizes.map((s) => (
            <FilterChip
              key={s}
              active={current.size === s}
              label={s}
              onClick={() => pushParams({ size: current.size === s ? null : s })}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink-soft">
          Color
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {colors.map((c) => (
            <FilterChip
              key={c}
              active={current.color === c}
              label={c}
              onClick={() =>
                pushParams({ color: current.color === c ? null : c })
              }
            />
          ))}
        </div>
      </div>

      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink-soft">
          Price (₹)
        </p>
        <div className="mt-3 flex gap-3">
          <input
            placeholder="Min"
            value={priceDraft.min}
            onChange={(e) =>
              setPriceDraft((d) => ({ ...d, min: e.target.value }))
            }
            onBlur={() =>
              pushParams({
                minPrice: priceDraft.min.trim() || null,
              })
            }
            className="w-full rounded-2xl border border-ivory-deep bg-white px-3 py-2 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
          />
          <input
            placeholder="Max"
            value={priceDraft.max}
            onChange={(e) =>
              setPriceDraft((d) => ({ ...d, max: e.target.value }))
            }
            onBlur={() =>
              pushParams({
                maxPrice: priceDraft.max.trim() || null,
              })
            }
            className="w-full rounded-2xl border border-ivory-deep bg-white px-3 py-2 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 font-sans text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={current.stock}
          onChange={(e) =>
            pushParams({ inStock: e.target.checked ? "true" : null })
          }
          className="h-4 w-4 rounded border-ivory-deep text-gold focus:ring-gold"
        />
        In stock only
      </label>

      {(current.collection || current.tag) && (
        <div className="rounded-2xl border border-gold/40 bg-white/60 p-4 font-sans text-xs text-ink-muted">
          Refined by editorial tag —{" "}
          <button
            type="button"
            className="text-gold underline-offset-4 hover:underline"
            onClick={() => pushParams({ collection: null, tag: null })}
          >
            Clear context
          </button>
        </div>
      )}
    </aside>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] transition-colors",
        active
          ? "border-gold bg-gold text-white"
          : "border-ivory-deep text-ink-muted hover:border-gold hover:text-gold",
      )}
    >
      {label}
    </button>
  );
}
