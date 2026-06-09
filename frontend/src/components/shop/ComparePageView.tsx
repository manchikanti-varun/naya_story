"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";
import { readCompareSlugs, writeCompareSlugs } from "@/lib/product-compare";
import { formatInr } from "@/lib/store-shipping";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";
import { StoreInlineLoading } from "@/components/ui/StoreLoadingUI";
import { cn } from "@/lib/cn";

type RatingData = { average: number; count: number };

function StarRating({ value, count }: { value: number; count: number }) {
  if (count === 0) return <span className="text-ink-soft/60">No reviews</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn("h-3.5 w-3.5", i < Math.round(value) ? "text-gold" : "text-ivory-deep")}
            strokeWidth={1}
            fill={i < Math.round(value) ? "currentColor" : "transparent"}
          />
        ))}
      </span>
      <span className="text-ink-muted">
        {value.toFixed(1)} ({count})
      </span>
    </span>
  );
}

function getAvailableSizes(product: Product): string {
  const sizes = [...new Set(product.variants.filter((v) => v.stock > 0).map((v) => v.size))];
  return sizes.length > 0 ? sizes.join(", ") : "Out of stock";
}

function getAvailableColors(product: Product): string {
  const colors = [...new Set(product.variants.filter((v) => v.stock > 0).map((v) => v.color))];
  return colors.length > 0 ? colors.join(", ") : "—";
}

function getTotalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

function getStockLabel(product: Product): { label: string; tone: "good" | "low" | "out" } {
  const total = getTotalStock(product);
  if (total === 0) return { label: "Out of stock", tone: "out" };
  if (total <= 5) return { label: `Low stock (${total} left)`, tone: "low" };
  return { label: "In stock", tone: "good" };
}

function getDiscountLabel(product: Product): string {
  if (product.discountPercent && product.discountPercent > 0) {
    return `${product.discountPercent}% off`;
  }
  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    const pct = Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
    return `${pct}% off (was ${formatInr(product.compareAtPrice)})`;
  }
  return "—";
}

const stockToneClasses = {
  good: "text-emerald-700",
  low: "text-amber-700",
  out: "text-red-700",
};

export function ComparePageView() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => setSlugs(readCompareSlugs());
    sync();
    window.addEventListener("naya-compare-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("naya-compare-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!slugs.length) {
      setProducts([]);
      setRatings({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void Promise.all(
      slugs.map(async (slug) => {
        try {
          const data = await apiFetch<{ product: Product }>(
            `/products/slug/${encodeURIComponent(slug)}`,
          );
          return data.product;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const loaded = results.filter((p): p is Product => p != null);
      const bySlug = new Map(loaded.map((p) => [p.slug, p]));
      const ordered = slugs.map((slug) => bySlug.get(slug)).filter((p): p is Product => p != null);
      setProducts(ordered);
      setLoading(false);

      // Fetch ratings for each product
      void Promise.all(
        ordered.map(async (p) => {
          try {
            const r = await apiFetch<RatingData>(`/reviews/${p._id}/rating`);
            return { id: p._id, ...r };
          } catch {
            return { id: p._id, average: 0, count: 0 };
          }
        }),
      ).then((ratingResults) => {
        if (cancelled) return;
        const map: Record<string, RatingData> = {};
        for (const r of ratingResults) map[r.id] = { average: r.average, count: r.count };
        setRatings(map);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [slugs]);

  const remove = (slug: string) => {
    const next = slugs.filter((s) => s !== slug);
    writeCompareSlugs(next);
    setSlugs(next);
  };

  if (!slugs.length && !loading) {
    return (
      <div className="lux-shell py-20">
        <p className="lux-kicker">Compare</p>
        <h1 className="lux-title-section mt-2">No pieces selected yet</h1>
        <p className="mt-4 max-w-md font-sans text-sm font-light text-ink-muted">
          Open a product and tap Compare to build your shortlist (up to four silhouettes).
        </p>
        <Link
          href="/collections"
          className="mt-8 inline-flex rounded-md border border-ivory-deep bg-transparent px-8 py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-ink transition hover:border-gold/50 hover:text-gold"
        >
          Browse collections
        </Link>
      </div>
    );
  }

  return (
    <div className="lux-shell py-10 md:py-14">
      <p className="lux-kicker">Compare</p>
      <h1 className="lux-title-section mt-2">Your edit</h1>
      <p className="mt-2 font-sans text-sm font-light text-ink-muted">
        {slugs.length} of 4 pieces
      </p>

      {!loading && slugs.length > 0 && products.length === 0 ? (
        <p className="mt-6 font-sans text-sm text-ink-muted">
          We could not load these pieces (they may have been removed or hidden). Clear the list and
          add products again from their pages.
        </p>
      ) : null}

      {loading ? (
        <StoreInlineLoading
          className="mt-8 px-0"
          label="Loading your edit"
          sublabel="Gathering pieces to compare"
          variant="minimal"
        />
      ) : products.length > 0 ? (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ivory-deep">
                <th className="pb-4 pr-4 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                  Piece
                </th>
                {products.map((p) => (
                  <th key={p._id} className="pb-4 pr-4 align-bottom">
                    <button
                      type="button"
                      onClick={() => remove(p.slug)}
                      className="mb-2 rounded-full p-1 text-ink-soft hover:text-ink"
                      aria-label={`Remove ${p.name} from compare`}
                    >
                      <X className="h-4 w-4" strokeWidth={1.25} />
                    </button>
                    <Link href={`/products/${p.slug}`} className="block">
                      <div
                        className={cn(
                          "relative mx-auto aspect-[3/4] w-full max-w-[140px] overflow-hidden rounded-lux bg-ivory-soft",
                          storefrontImageShellClass,
                        )}
                      >
                        {p.images[0] ? (
                          <Image
                            src={p.images[0]}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="140px"
                            {...storefrontImageProps}
                          />
                        ) : null}
                      </div>
                      <span className="mt-3 block font-display text-base text-ink hover:text-gold">
                        {p.name}
                      </span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-sans text-sm font-light text-ink-muted">
              {/* Price */}
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Price</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4">
                    <span className="font-medium text-ink">{formatInr(p.price)}</span>
                    {p.compareAtPrice && p.compareAtPrice > p.price ? (
                      <span className="ml-2 text-xs text-ink-soft line-through">
                        {formatInr(p.compareAtPrice)}
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>

              {/* Discount */}
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Discount</td>
                {products.map((p) => {
                  const label = getDiscountLabel(p);
                  return (
                    <td
                      key={p._id}
                      className={cn("py-4 pr-4", label !== "—" && "text-emerald-700 font-medium")}
                    >
                      {label}
                    </td>
                  );
                })}
              </tr>

              {/* Rating */}
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Rating</td>
                {products.map((p) => {
                  const r = ratings[p._id];
                  return (
                    <td key={p._id} className="py-4 pr-4">
                      {r ? (
                        <StarRating value={r.average} count={r.count} />
                      ) : (
                        <span className="text-ink-soft/60">Loading…</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Category */}
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Category</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4 capitalize">
                    {p.category}
                  </td>
                ))}
              </tr>

              {/* Collection */}
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Collection</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4 capitalize">
                    {p.collection || "—"}
                  </td>
                ))}
              </tr>

              {/* Material */}
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Material</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4">
                    {p.material ?? "—"}
                  </td>
                ))}
              </tr>

              {/* Fit */}
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Fit</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4">
                    {p.fitType ?? "—"}
                  </td>
                ))}
              </tr>

              {/* Available sizes */}
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Sizes available</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4">
                    {getAvailableSizes(p)}
                  </td>
                ))}
              </tr>

              {/* Available colors */}
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Colors</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4 capitalize">
                    {getAvailableColors(p)}
                  </td>
                ))}
              </tr>

              {/* Stock status */}
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Availability</td>
                {products.map((p) => {
                  const { label, tone } = getStockLabel(p);
                  return (
                    <td key={p._id} className={cn("py-4 pr-4 font-medium", stockToneClasses[tone])}>
                      {label}
                    </td>
                  );
                })}
              </tr>

              {/* Quick view link */}
              <tr>
                <td className="py-4 pr-4 text-ink">Shop</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4">
                    <Link
                      href={`/products/${p.slug}`}
                      className="inline-flex rounded-md border border-ivory-deep bg-transparent px-5 py-2 font-sans text-[10px] uppercase tracking-[0.2em] text-ink transition hover:border-gold/50 hover:text-gold"
                    >
                      View details
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
