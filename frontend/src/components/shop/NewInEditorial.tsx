"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";
import type { HomepageConfig } from "@/types/homepage";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/cn";
import { QuickViewModal } from "@/components/shop/QuickViewModal";
import {
  StoreBrowseEmpty,
  StoreBrowseHeader,
  StoreBrowseMetaPill,
  StoreBrowseShell,
} from "@/components/shop/StoreBrowseUI";
import { StoreInlineLoading, StoreLoadingMore } from "@/components/ui/StoreLoadingUI";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { isNextImageSrc } from "@/lib/image-src";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

const tileRhythm = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[5/7]",
  "aspect-[1/1]",
  "aspect-[4/6]",
  "aspect-[3/5]",
];

const PAGE_SIZE = 60;

export function NewInEditorial() {
  const { token, wishlistIds, updateWishlistLocal } = useAuth();
  const [pageCfg, setPageCfg] = useState<HomepageConfig["newInPage"] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [curated, setCurated] = useState(false);
  const curatedIdsRef = useRef<string[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(1);
  const pagesRef = useRef(1);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  const loadCuratedSlice = useCallback(async (slice: string[]) => {
    if (slice.length === 0) return [] as Product[];
    const data = await apiFetch<{ products: Product[] }>(
      `/products?ids=${slice.map(encodeURIComponent).join(",")}`,
    );
    return data.products ?? [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const site = await apiFetch<{ settings: { homepage: HomepageConfig } }>("/content/site");
        const nip = site.settings.homepage.newInPage;
        if (!cancelled) setPageCfg(nip ?? null);

        const useCurated = Boolean(nip?.useCuratedOrder && (nip.productIds?.length ?? 0) > 0);
        setCurated(useCurated);
        curatedIdsRef.current = nip?.productIds ?? [];

        if (useCurated && nip) {
          const ids = nip.productIds;
          const totalPages = Math.max(1, Math.ceil(ids.length / PAGE_SIZE));
          const slice = ids.slice(0, PAGE_SIZE);
          const list = await loadCuratedSlice(slice);
          if (!cancelled) {
            setProducts(list);
            setPage(1);
            setPages(totalPages);
            setFallbackMode(false);
          }
        } else {
          const data = await apiFetch<{ products: Product[] }>(
            "/products?newIn=true&visible=true&sort=new_in&limit=60&page=1",
          );
          let curatedList = data.products ?? [];
          let totalPages = 1;
          if ("pages" in data && typeof (data as { pages?: number }).pages === "number") {
            totalPages = (data as { pages: number }).pages;
          }
          let usingFallback = false;
          if (curatedList.length === 0) {
            const fallback = await apiFetch<{ products: Product[]; pages?: number }>(
              "/products?sort=newest&limit=60&page=1",
            );
            curatedList = fallback.products ?? [];
            totalPages = fallback.pages ?? 1;
            usingFallback = true;
          }
          if (!cancelled) {
            setProducts(curatedList);
            setPage(1);
            setPages(totalPages);
            setFallbackMode(usingFallback);
          }
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCuratedSlice]);

  const loadNextPage = useCallback(async () => {
    if (loadingMoreRef.current) return;
    const currentPage = pageRef.current;
    const totalPages = pagesRef.current;
    if (currentPage >= totalPages) return;
    const nextPage = currentPage + 1;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      if (curated) {
        const ids = curatedIdsRef.current;
        const slice = ids.slice((nextPage - 1) * PAGE_SIZE, nextPage * PAGE_SIZE);
        if (slice.length === 0) return;
        const incoming = await loadCuratedSlice(slice);
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => p._id));
          const merged = [...prev];
          incoming.forEach((p) => {
            if (!seen.has(p._id)) merged.push(p);
          });
          return merged;
        });
        setPage(nextPage);
      } else {
        const endpoint = fallbackMode
          ? `/products?sort=newest&limit=60&page=${nextPage}`
          : `/products?newIn=true&visible=true&sort=new_in&limit=60&page=${nextPage}`;
        const data = await apiFetch<{ products: Product[]; pages?: number }>(endpoint);
        const incoming = data.products ?? [];
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => p._id));
          const merged = [...prev];
          incoming.forEach((p) => {
            if (!seen.has(p._id)) merged.push(p);
          });
          return merged;
        });
        setPage(nextPage);
        if (typeof data.pages === "number") setPages(data.pages);
      }
    } catch {
      /* keep */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [curated, fallbackMode, loadCuratedSlice]);

  useEffect(() => {
    if (loading || loadingMore) return;
    if (page >= pages) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        void loadNextPage();
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, loadingMore, loadNextPage, page, pages]);

  const heading = pageCfg?.heading?.trim() || "New In";
  const sub = pageCfg?.subheading?.trim();

  const metaLabel = loading
    ? null
    : curated
      ? "Curated edit"
      : fallbackMode
        ? "Latest from catalog"
        : "New arrivals";

  return (
    <StoreBrowseShell>
      <StoreBrowseHeader
        kicker="Latest arrivals"
        title={heading}
        subtitle={sub}
        meta={
          !loading && products.length > 0 && metaLabel ? (
            <StoreBrowseMetaPill>
              {products.length}
              {pages > 1 ? "+" : ""} pieces · {metaLabel}
            </StoreBrowseMetaPill>
          ) : null
        }
      />

      {loading ? (
        <StoreInlineLoading
          className="mt-6 px-0"
          label="Building the editorial wall"
          sublabel="Latest arrivals, composed for you"
          variant="masonry"
        />
      ) : products.length === 0 ? (
        <StoreBrowseEmpty
          title="The rail is being composed"
          description="No pieces match this curatorial cut yet. Add products in admin, mark them as New In, or pin items under Website → New In."
          primaryAction={{ label: "Explore collections", href: "/collections" }}
          secondaryAction={undefined}
        />
      ) : (
        <section className="mt-8 pb-14 md:pb-20">
          <div className="lux-newin-masonry">
            {products.map((product, index) => (
              <NewInTile
                key={product._id}
                index={index}
                product={product}
                liked={wishlistIds.includes(product._id)}
                onToggleWishlist={async () => {
                  if (token) {
                    await apiFetch<{ wishlist: string[] }>("/users/wishlist", {
                      method: "PATCH",
                      token,
                      body: JSON.stringify({ productId: product._id }),
                    });
                  }
                  updateWishlistLocal(product._id, !wishlistIds.includes(product._id));
                }}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="h-8 w-full" />
          {loadingMore ? <StoreLoadingMore label="Loading more pieces" /> : null}
        </section>
      )}
    </StoreBrowseShell>
  );
}

function NewInTile({
  product,
  index,
  liked,
  onToggleWishlist,
}: {
  product: Product;
  index: number;
  liked: boolean;
  onToggleWishlist: () => Promise<void>;
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const primary = product.images[0]?.trim();

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5% 0px -10% 0px" }}
      transition={{ duration: 0.9, delay: Math.min(index * 0.03, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="group relative m-0 break-inside-avoid p-0"
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div
          className={cn(
            `relative overflow-hidden bg-[#d7cec1] ${tileRhythm[index % tileRhythm.length]}`,
            storefrontImageShellClass,
          )}
        >
          {isNextImageSrc(primary) ? (
            <Image
              src={primary}
              alt={product.name}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
              className="object-cover transition duration-[1.6s] ease-out group-hover:scale-[1.06]"
              {...storefrontImageProps}
            />
          ) : (
            <MediaPlaceholder />
          )}
          <div className="absolute right-3 top-3 z-10 flex translate-y-1 gap-2 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickOpen(true);
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black/85"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void onToggleWishlist();
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black/85"
              aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("h-4 w-4", liked ? "fill-gold text-gold" : "text-white")} />
            </button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent opacity-100 transition duration-700 md:opacity-0 md:group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 translate-y-0 p-5 text-[#f7f1e8] transition duration-700 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
            <p className="font-sans text-[10px] uppercase tracking-[0.26em] text-[#e9dcc9]">
              {product.category}
            </p>
            <h3 className="mt-2 font-display text-2xl leading-tight">{product.name}</h3>
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="font-sans text-sm text-[#f7f1e8]">₹{product.price.toLocaleString("en-IN")}</p>
              <span className="font-sans text-[10px] uppercase tracking-[0.26em] text-[#e7d8c3]">
                Shop Now
              </span>
            </div>
          </div>
        </div>
      </Link>
      <QuickViewModal product={product} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </motion.article>
  );
}
