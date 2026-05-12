"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Heart, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Product } from "@/types";
import type { HomepageConfig } from "@/types/homepage";
import { cn } from "@/lib/cn";
import { QuickViewModal } from "@/components/shop/QuickViewModal";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

type CollectionCategory = HomepageConfig["collectionsPage"]["categories"][number];

const fallbackCollectionsConfig: HomepageConfig["collectionsPage"] = {
  title: "Collections",
  subtitle: "Explore curated silhouettes from Naya Studio.",
  paginationLimit: 16,
  usePinnedProducts: false,
  pinnedProductIds: [],
  categories: [
    { id: "all", label: "All", type: "all", enabled: true, order: 0 },
    {
      id: "bestselling",
      label: "Bestselling",
      type: "bestselling",
      enabled: true,
      order: 1,
    },
  ],
};

export function CollectionsExplorer() {
  const params = useSearchParams();
  const router = useRouter();
  const { token, wishlistIds, updateWishlistLocal } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [collectionsConfig, setCollectionsConfig] = useState(fallbackCollectionsConfig);

  const queryString = useMemo(() => params.toString(), [params]);
  const activeCategoryId = params.get("tab") ?? "all";
  const page = Math.max(Number(params.get("page")) || 1, 1);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const settings = await apiFetch<{ settings: { homepage: HomepageConfig } }>("/content/site");
        const config = settings.settings.homepage.collectionsPage ?? fallbackCollectionsConfig;
        if (!cancelled) setCollectionsConfig(config);

        const qs = new URLSearchParams(queryString);
        const tabs = (config.categories ?? []).filter((c) => c.enabled).sort((a, b) => a.order - b.order);
        const activeTab = tabs.find((tab) => tab.id === (qs.get("tab") ?? "all")) ?? tabs[0];
        if (activeTab) {
          if (activeTab.type === "all") {
            qs.delete("category");
            qs.delete("bestseller");
          }
          if (activeTab.type === "bestselling") {
            qs.set("bestseller", "true");
            qs.delete("category");
          }
          if (activeTab.type === "category") {
            qs.set("category", activeTab.value ?? "");
            qs.delete("bestseller");
          }
        }
        if (!qs.has("sort")) qs.set("sort", "newest");
        if (!qs.has("page")) qs.set("page", "1");
        if (!qs.has("limit")) qs.set("limit", String(config.paginationLimit ?? 16));
        const data = await apiFetch<{ products: Product[]; total: number; page: number; pages: number }>(
          `/products?${qs.toString()}`,
        );
        let list = data.products ?? [];
        const pageNum = Math.max(Number(qs.get("page") ?? "1") || 1, 1);
        const lim = config.paginationLimit ?? 16;
        const tabAll =
          activeTab?.type === "all" &&
          pageNum === 1 &&
          !qs.get("size") &&
          !qs.get("color") &&
          !qs.get("minPrice") &&
          !qs.get("maxPrice") &&
          (qs.get("sort") ?? "newest") === "newest" &&
          qs.get("inStock") !== "true";

        const pins = (config.pinnedProductIds ?? []).filter(Boolean);
        if (tabAll && config.usePinnedProducts && pins.length > 0) {
          const pinRes = await apiFetch<{ products: Product[] }>(
            `/products?ids=${pins.map((id) => encodeURIComponent(id)).join(",")}`,
          );
          const pinList = pinRes.products ?? [];
          const pinSet = new Set(pinList.map((p) => p._id));
          const merged: Product[] = [...pinList];
          for (const p of list) {
            if (!pinSet.has(p._id)) merged.push(p);
          }
          list = merged.slice(0, lim);
        }

        if (!cancelled) {
          setProducts(list);
          setTotal(data.total ?? list.length);
          setPages(data.pages ?? 1);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setTotal(0);
          setPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const categories = useMemo(
    () => collectionsConfig.categories.filter((c) => c.enabled).sort((a, b) => a.order - b.order),
    [collectionsConfig.categories],
  );

  const patchParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    if (!patch.page) next.set("page", "1");
    router.push(`/collections?${next.toString()}`);
  };

  return (
    <div className="lux-shell pb-16 pt-6 md:pb-24 md:pt-8">
      <header className="border-b border-ivory-deep pb-10">
        <p className="lux-kicker">Naya Studio</p>
        <h1 className="lux-title mt-4">{collectionsConfig.title}</h1>
        <p className="lux-copy mt-5 max-w-xl">
          {collectionsConfig.subtitle}
        </p>
      </header>

      <section className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar flex snap-x items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => patchParams({ tab: cat.id, page: "1" })}
              className={cn(
                "snap-start rounded-xl border px-5 py-2.5 font-sans text-[11px] uppercase tracking-[0.18em] transition-all duration-500",
                activeCategoryId === cat.id
                  ? "border-gold/60 bg-gold/15 text-gold"
                  : "border-ivory-deep bg-ivory/70 text-ink-soft hover:bg-ivory hover:text-ink",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <CollectionSelect
            label="Size"
            value={params.get("size") ?? ""}
            options={["", "XS", "S", "M", "L", "XL"]}
            onChange={(v) => patchParams({ size: v || null })}
          />
          <CollectionSelect
            label="Color"
            value={params.get("color") ?? ""}
            options={["", "Ivory", "Sand", "Noir", "Rose"]}
            onChange={(v) => patchParams({ color: v || null })}
          />
          <CollectionSelect
            label="Price"
            value={params.get("priceBand") ?? ""}
            options={["", "0-5000", "5000-10000", "10000-25000", "25000-50000"]}
            onChange={(v) => {
              const [minPrice, maxPrice] = v ? v.split("-") : [];
              patchParams({ priceBand: v || null, minPrice: minPrice ?? null, maxPrice: maxPrice ?? null });
            }}
          />
          <CollectionSelect
            label="Availability"
            value={params.get("inStock") === "true" ? "in" : ""}
            options={["", "in"]}
            onChange={(v) => patchParams({ inStock: v ? "true" : null })}
            renderOption={(opt) => (opt === "in" ? "In stock" : "All")}
          />
          <CollectionSelect
            label="Sort"
            value={params.get("sort") ?? "newest"}
            options={["newest", "popular", "price_asc", "price_desc"]}
            onChange={(v) => patchParams({ sort: v })}
            renderOption={(opt) =>
              opt === "newest"
                ? "Newest"
                : opt === "popular"
                  ? "Bestselling"
                  : opt === "price_asc"
                    ? "Price low-high"
                    : "Price high-low"
            }
          />
        </div>
      </section>

      <button
        type="button"
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-ivory-deep px-4 py-2 font-sans text-[11px] uppercase tracking-[0.16em] text-ink md:hidden"
        onClick={() => setShowMobileFilters(true)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters & Sort
      </button>

      {loading ? (
        <p className="mt-16 font-sans text-sm text-ink-muted">Curating pieces...</p>
      ) : products.length === 0 ? (
        <p className="mt-16 font-sans text-sm text-ink-muted">
          No garments matched - soften your filters.
        </p>
      ) : (
          <motion.div
            key={queryString}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4 lg:gap-x-6"
          >
            {products.map((p) => (
              <CollectionProductCard
                key={p._id}
                product={p}
                liked={Boolean(wishlistIds.includes(p._id))}
                onToggleWishlist={async () => {
                  if (token) {
                    await apiFetch<{ wishlist: string[] }>("/users/wishlist", {
                      method: "PATCH",
                      token,
                      body: JSON.stringify({ productId: p._id }),
                    });
                  }
                  updateWishlistLocal(p._id, !wishlistIds.includes(p._id));
                }}
              />
            ))}
          </motion.div>
        )}

      {pages > 1 ? (
        <nav className="mt-14">
          <p className="mb-4 text-center font-sans text-xs uppercase tracking-[0.16em] text-ink-soft">
            Showing {(page - 1) * (collectionsConfig.paginationLimit || 16) + 1}-
            {Math.min(page * (collectionsConfig.paginationLimit || 16), total)} of {total}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
          <PaginationButton
            disabled={page <= 1}
            onClick={() => patchParams({ page: String(page - 1) })}
            label="Previous"
          />
          {buildPageItems(page, pages).map((entry, idx) =>
            entry === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-10 min-w-8 items-center justify-center font-sans text-sm text-ink-soft"
              >
                ...
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => patchParams({ page: String(entry) })}
                className={cn(
                  "h-10 min-w-10 rounded-full px-3 font-sans text-sm transition",
                  entry === page ? "bg-gold/20 text-gold" : "text-ink-soft hover:bg-ivory-deep",
                )}
              >
                {entry}
              </button>
            ),
          )}
          <PaginationButton
            disabled={page >= pages}
            onClick={() => patchParams({ page: String(page + 1) })}
            label="Next"
          />
          </div>
        </nav>
      ) : null}

      <AnimatePresence>
        {showMobileFilters ? (
          <motion.div
            className="fixed inset-0 z-40 bg-black/35 p-4 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              className="absolute inset-x-0 bottom-0 rounded-t-[24px] bg-ivory p-5"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-2xl text-ink">Refine</h3>
              <div className="mt-4 space-y-3">
                <CollectionSelect
                  label="Size"
                  value={params.get("size") ?? ""}
                  options={["", "XS", "S", "M", "L", "XL"]}
                  onChange={(v) => patchParams({ size: v || null })}
                />
                <CollectionSelect
                  label="Color"
                  value={params.get("color") ?? ""}
                  options={["", "Ivory", "Sand", "Noir", "Rose"]}
                  onChange={(v) => patchParams({ color: v || null })}
                />
                <CollectionSelect
                  label="Sort"
                  value={params.get("sort") ?? "newest"}
                  options={["newest", "popular", "price_asc", "price_desc"]}
                  onChange={(v) => patchParams({ sort: v })}
                />
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  className="w-full rounded-full border border-ivory-deep px-4 py-2 font-sans text-xs uppercase tracking-[0.18em]"
                  onClick={() =>
                    patchParams({
                      size: null,
                      color: null,
                      minPrice: null,
                      maxPrice: null,
                      priceBand: null,
                      inStock: null,
                      sort: "newest",
                    })
                  }
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="w-full rounded-full bg-ink px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-ivory"
                  onClick={() => setShowMobileFilters(false)}
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CollectionProductCard({
  product,
  liked,
  onToggleWishlist,
}: {
  product: Product;
  liked: boolean;
  onToggleWishlist: () => Promise<void>;
}) {
  const [hovered, setHovered] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const alt = product.images[1];
  return (
    <article
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div
          className={cn(
            "relative aspect-[3/4] overflow-hidden rounded-[18px] bg-ivory-soft",
            storefrontImageShellClass,
          )}
        >
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
            className={cn(
              "object-cover transition duration-[1.4s] ease-out",
              alt && hovered ? "scale-[1.04] opacity-0" : "scale-100 opacity-100",
            )}
            {...storefrontImageProps}
          />
          {alt ? (
            <Image
              src={alt}
              alt=""
              fill
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
              className={cn(
                "object-cover transition duration-[1.4s] ease-out",
                hovered ? "scale-[1.04] opacity-100" : "opacity-0",
              )}
              {...storefrontImageProps}
            />
          ) : null}
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
        </div>
        <div className="mt-4 space-y-1.5">
          <h3 className="font-display text-xl text-ink">{product.name}</h3>
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink-soft">{product.category}</p>
          <p className="font-sans text-sm text-ink">₹{product.price.toLocaleString("en-IN")}</p>
        </div>
      </Link>
      <QuickViewModal product={product} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </article>
  );
}

function CollectionSelect({
  label,
  value,
  options,
  onChange,
  renderOption,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  renderOption?: (value: string) => string;
}) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-ivory-deep bg-ivory/70 px-3 py-2 font-sans text-[10px] uppercase tracking-[0.16em] text-ink-soft">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[11px] uppercase tracking-[0.16em] text-ink outline-none"
      >
        {options.map((opt) => (
          <option key={opt || "all"} value={opt}>
            {renderOption ? renderOption(opt) : opt || "All"}
          </option>
        ))}
      </select>
    </label>
  );
}

function PaginationButton({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-ink transition hover:bg-ivory-deep disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function buildPageItems(current: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  if (current >= totalPages - 3)
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", totalPages];
}
