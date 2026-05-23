"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";
import { readCompareSlugs, writeCompareSlugs } from "@/lib/product-compare";
import { formatInr } from "@/lib/store-shipping";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";
import { StoreInlineLoading } from "@/components/ui/StoreLoadingUI";
import { cn } from "@/lib/cn";

export function ComparePageView() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
      const bySlug = new Map(results.filter((p): p is Product => p != null).map((p) => [p.slug, p]));
      setProducts(slugs.map((slug) => bySlug.get(slug)).filter((p): p is Product => p != null));
      setLoading(false);
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
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Price</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4 text-ink">
                    {formatInr(p.price)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Category</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4 capitalize">
                    {p.category}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-ivory-deep/80">
                <td className="py-4 pr-4 text-ink">Material</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4">
                    {p.material ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 pr-4 text-ink">Fit</td>
                {products.map((p) => (
                  <td key={p._id} className="py-4 pr-4">
                    {p.fitType ?? "—"}
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
