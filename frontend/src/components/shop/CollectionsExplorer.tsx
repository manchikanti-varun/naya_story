"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";
import type { HomepageConfig } from "@/types/homepage";
import {
  DEFAULT_COLLECTIONS_PAGE,
  normalizeCollectionsPage,
} from "@/lib/cms/collections-page-config";
import { cn } from "@/lib/cn";
import { ProductCard } from "@/components/shop/ProductCard";
import {
  StoreBrowseEmpty,
  StoreBrowseHeader,
  StoreBrowseMetaPill,
  StoreBrowseShell,
} from "@/components/shop/StoreBrowseUI";
import { StoreInlineLoading } from "@/components/ui/StoreLoadingUI";
import { SlidersHorizontal, X, Check } from "lucide-react";

type CollectionsConfig = HomepageConfig["collectionsPage"];

/** Map color name to a CSS-friendly value for the swatch */
const COLOR_SWATCH_MAP: Record<string, string> = {
  black: "#1a1a1a",
  white: "#ffffff",
  red: "#c0392b",
  blue: "#2c5282",
  green: "#276749",
  yellow: "#d69e2e",
  pink: "#ed64a6",
  purple: "#6b46c1",
  orange: "#dd6b20",
  brown: "#7b4b2a",
  grey: "#a0aec0",
  gray: "#a0aec0",
  navy: "#1a365d",
  beige: "#e8dcc8",
  cream: "#fdf6e3",
  ivory: "#fffff0",
  gold: "#b7935c",
  silver: "#c0c0c0",
  maroon: "#742a2a",
  olive: "#5c6b29",
  teal: "#285e61",
  coral: "#f56565",
  burgundy: "#6b1d1d",
  mustard: "#c8a415",
  lavender: "#b794f4",
  mint: "#9ae6b4",
  peach: "#fbd5b5",
  rust: "#9c4221",
  wine: "#722f37",
  charcoal: "#4a5568",
  sage: "#9cac8b",
  blush: "#f5c6cb",
  nude: "#e0c8b0",
  tan: "#d2b48c",
  khaki: "#c3b091",
  multicolor: "conic-gradient(from 0deg, #f56565, #ecc94b, #48bb78, #4299e1, #9f7aea, #ed64a6, #f56565)",
  multi: "conic-gradient(from 0deg, #f56565, #ecc94b, #48bb78, #4299e1, #9f7aea, #ed64a6, #f56565)",
};

function getSwatchColor(color: string): string {
  const key = color.toLowerCase().trim();
  return COLOR_SWATCH_MAP[key] ?? "#cbd5e0";
}

export function CollectionsExplorer() {
  const params = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [collectionsConfig, setCollectionsConfig] = useState<CollectionsConfig>(
    DEFAULT_COLLECTIONS_PAGE,
  );

  const queryString = useMemo(() => params.toString(), [params]);
  const activeCategoryId = params.get("tab") ?? "all";
  const page = Math.max(Number(params.get("page")) || 1, 1);

  const filters = collectionsConfig.filters ?? DEFAULT_COLLECTIONS_PAGE.filters!;
  const messages = collectionsConfig.messages ?? DEFAULT_COLLECTIONS_PAGE.messages!;
  const enabledSortOptions = filters.sortOptions.filter((o) => o.enabled);
  const enabledPriceBands = filters.priceBands.filter((b) => b.enabled);
  const hasDesktopFilters =
    (filters.showSize && filters.sizeOptions.length > 0) ||
    (filters.showColor && filters.colorOptions.length > 0) ||
    (filters.showPrice && enabledPriceBands.length > 0) ||
    filters.showAvailability ||
    (filters.showSort && enabledSortOptions.length > 0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const settings = await apiFetch<{ settings: { homepage: HomepageConfig } }>("/content/site");
        const config = normalizeCollectionsPage(settings.settings.homepage.collectionsPage);
        if (!cancelled) setCollectionsConfig(config);

        const globalCategories = settings.settings.homepage.globalCategories ?? [];

        const qs = new URLSearchParams(queryString);
        const tabs = (config.categories ?? []).filter((c) => c.enabled).sort((a, b) => a.order - b.order);
        const activeTab = tabs.find((tab) => tab.id === (qs.get("tab") ?? "all")) ?? tabs[0];
        if (activeTab) {
          if (activeTab.type === "all") {
            qs.delete("category");
            qs.delete("bestseller");
            qs.delete("newIn");
          }
          if (activeTab.type === "bestselling") {
            qs.set("bestseller", "true");
            qs.delete("category");
            qs.delete("newIn");
          }
          if (activeTab.type === "newIn") {
            qs.set("newIn", "true");
            qs.delete("category");
            qs.delete("bestseller");
          }
          if (activeTab.type === "category") {
            qs.set("category", activeTab.value ?? "");
            qs.delete("bestseller");
            qs.delete("newIn");
          }
        }
        const defaultSort = config.filters?.defaultSort ?? "newest";
        if (!qs.has("sort")) qs.set("sort", defaultSort);
        if (!qs.has("page")) qs.set("page", "1");
        if (!qs.has("limit")) qs.set("limit", String(config.paginationLimit ?? 16));
        const data = await apiFetch<{ products: Product[]; total: number; page: number; pages: number }>(
          `/products?${qs.toString()}`,
        );
        let list = data.products ?? [];
        const pageNum = Math.max(Number(qs.get("page") ?? "1") || 1, 1);
        const lim = config.paginationLimit ?? 16;

        let pins: string[] = [];
        const isFirstPageNoFilters =
          pageNum === 1 &&
          !qs.get("size") &&
          !qs.get("color") &&
          !qs.get("minPrice") &&
          !qs.get("maxPrice") &&
          (qs.get("sort") ?? defaultSort) === defaultSort &&
          qs.get("inStock") !== "true";

        if (isFirstPageNoFilters) {
          if (activeTab?.type === "all" && config.usePinnedProducts) {
            pins = (config.pinnedProductIds ?? []).filter(Boolean);
          } else if (activeTab?.type === "category" && activeTab.value) {
            const matchedCat = globalCategories.find(
              (g) => g.slug?.toLowerCase() === activeTab.value?.toLowerCase(),
            );
            pins = (matchedCat?.pinnedProductIds ?? []).filter(Boolean);
          } else if (activeTab?.type === "bestselling") {
            const bestPins = settings.settings.homepage.bestsellers?.productIds ?? [];
            pins = bestPins.filter(Boolean);
          } else if (activeTab?.type === "newIn") {
            const newInPins = settings.settings.homepage.newIn?.productIds ?? [];
            pins = newInPins.filter(Boolean);
          }
        }

        if (pins.length > 0) {
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

  const priceBandValue = (band: { min: number; max?: number }) =>
    band.max != null ? `${band.min}-${band.max}` : `${band.min}-`;

  const activePriceBand =
    enabledPriceBands.find((b) => priceBandValue(b) === (params.get("priceBand") ?? ""))?.id ?? "";

  const defaultSort = filters.defaultSort;
  const hasActiveRefinements =
    Boolean(params.get("size")) ||
    Boolean(params.get("color")) ||
    Boolean(params.get("minPrice")) ||
    Boolean(params.get("maxPrice")) ||
    Boolean(params.get("priceBand")) ||
    params.get("inStock") === "true" ||
    (params.get("sort") && params.get("sort") !== defaultSort);

  const clearRefinements = () =>
    patchParams({
      size: null,
      color: null,
      minPrice: null,
      maxPrice: null,
      priceBand: null,
      inStock: null,
      sort: defaultSort,
    });

  const activeColor = params.get("color") ?? "";
  const activeSize = params.get("size") ?? "";

  /* ─── Sidebar filter panel (desktop) ─── */
  const sidebarFilters = (
    <aside className="hidden lg:block w-[260px] shrink-0">
      <div className="sticky top-6 space-y-6">
        {/* Active filters summary */}
        {hasActiveRefinements ? (
          <div className="rounded-2xl border border-ivory-deep/60 bg-white/60 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
                Active filters
              </p>
              <button
                type="button"
                onClick={clearRefinements}
                className="flex items-center gap-1 font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-gold transition hover:text-ink"
              >
                <X className="h-3 w-3" strokeWidth={1.5} />
                Clear
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeColor ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ivory-deep/80 bg-ivory px-2.5 py-1 text-[10px] font-medium tracking-wide text-ink/80">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                    style={{
                      background: getSwatchColor(activeColor),
                    }}
                  />
                  {activeColor}
                  <button type="button" onClick={() => patchParams({ color: null })} className="ml-0.5 opacity-60 hover:opacity-100">
                    <X className="h-2.5 w-2.5" strokeWidth={2} />
                  </button>
                </span>
              ) : null}
              {activeSize ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-ivory-deep/80 bg-ivory px-2.5 py-1 text-[10px] font-medium tracking-wide text-ink/80">
                  {activeSize}
                  <button type="button" onClick={() => patchParams({ size: null })} className="ml-0.5 opacity-60 hover:opacity-100">
                    <X className="h-2.5 w-2.5" strokeWidth={2} />
                  </button>
                </span>
              ) : null}
              {activePriceBand ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-ivory-deep/80 bg-ivory px-2.5 py-1 text-[10px] font-medium tracking-wide text-ink/80">
                  {enabledPriceBands.find((b) => b.id === activePriceBand)?.label ?? "Price"}
                  <button type="button" onClick={() => patchParams({ priceBand: null, minPrice: null, maxPrice: null })} className="ml-0.5 opacity-60 hover:opacity-100">
                    <X className="h-2.5 w-2.5" strokeWidth={2} />
                  </button>
                </span>
              ) : null}
              {params.get("inStock") === "true" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-ivory-deep/80 bg-ivory px-2.5 py-1 text-[10px] font-medium tracking-wide text-ink/80">
                  In Stock
                  <button type="button" onClick={() => patchParams({ inStock: null })} className="ml-0.5 opacity-60 hover:opacity-100">
                    <X className="h-2.5 w-2.5" strokeWidth={2} />
                  </button>
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Color swatches */}
        {filters.showColor && filters.colorOptions.length > 0 ? (
          <div className="rounded-2xl border border-ivory-deep/60 bg-white/60 px-4 py-4 backdrop-blur-sm">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
              Color
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.colorOptions.map((color) => {
                const isActive = activeColor === color;
                const swatchBg = getSwatchColor(color);
                const isMulti = color.toLowerCase() === "multicolor" || color.toLowerCase() === "multi";
                return (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => patchParams({ color: isActive ? null : color })}
                    className={cn(
                      "group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                      isActive
                        ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory scale-110"
                        : "ring-1 ring-black/10 hover:ring-black/25 hover:scale-105",
                    )}
                    style={{
                      background: isMulti ? swatchBg : swatchBg,
                    }}
                  >
                    {isActive ? (
                      <Check
                        className={cn(
                          "h-3.5 w-3.5",
                          ["white", "cream", "ivory", "beige", "yellow", "gold"].includes(color.toLowerCase())
                            ? "text-ink"
                            : "text-white",
                        )}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {activeColor ? (
              <p className="mt-2 font-sans text-[10px] capitalize tracking-wide text-ink/60">
                {activeColor}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Size */}
        {filters.showSize && filters.sizeOptions.length > 0 ? (
          <div className="rounded-2xl border border-ivory-deep/60 bg-white/60 px-4 py-4 backdrop-blur-sm">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
              Size
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {filters.sizeOptions.map((size) => {
                const isActive = activeSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => patchParams({ size: isActive ? null : size })}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 font-sans text-[11px] font-medium tracking-wide transition-all duration-200",
                      isActive
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-ivory-deep/80 bg-ivory text-ink/70 hover:border-ink/30 hover:text-ink",
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Price */}
        {filters.showPrice && enabledPriceBands.length > 0 ? (
          <div className="rounded-2xl border border-ivory-deep/60 bg-white/60 px-4 py-4 backdrop-blur-sm">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
              Price
            </p>
            <div className="mt-3 space-y-1">
              {enabledPriceBands.map((band) => {
                const isActive = activePriceBand === band.id;
                return (
                  <button
                    key={band.id}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        patchParams({ priceBand: null, minPrice: null, maxPrice: null });
                      } else {
                        patchParams({
                          priceBand: priceBandValue(band),
                          minPrice: String(band.min),
                          maxPrice: band.max != null ? String(band.max) : null,
                        });
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-sans text-[11px] tracking-wide transition-all duration-200",
                      isActive
                        ? "bg-gold/10 font-medium text-gold"
                        : "text-ink/70 hover:bg-ivory-deep/50 hover:text-ink",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 items-center justify-center rounded-full border transition",
                        isActive ? "border-gold bg-gold" : "border-ink/20",
                      )}
                    >
                      {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                    </span>
                    {band.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Availability */}
        {filters.showAvailability ? (
          <div className="rounded-2xl border border-ivory-deep/60 bg-white/60 px-4 py-4 backdrop-blur-sm">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
              Availability
            </p>
            <button
              type="button"
              onClick={() => patchParams({ inStock: params.get("inStock") === "true" ? null : "true" })}
              className="mt-3 flex items-center gap-2.5 font-sans text-[11px] tracking-wide text-ink/70 transition hover:text-ink"
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border transition",
                  params.get("inStock") === "true"
                    ? "border-gold bg-gold"
                    : "border-ink/20 hover:border-ink/40",
                )}
              >
                {params.get("inStock") === "true" ? (
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                ) : null}
              </span>
              {messages.availabilityInStock}
            </button>
          </div>
        ) : null}

        {/* Sort */}
        {filters.showSort && enabledSortOptions.length > 0 ? (
          <div className="rounded-2xl border border-ivory-deep/60 bg-white/60 px-4 py-4 backdrop-blur-sm">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
              Sort by
            </p>
            <div className="mt-3 space-y-1">
              {enabledSortOptions.map((opt) => {
                const isActive = (params.get("sort") ?? defaultSort) === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => patchParams({ sort: opt.value })}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-sans text-[11px] tracking-wide transition-all duration-200",
                      isActive
                        ? "bg-gold/10 font-medium text-gold"
                        : "text-ink/70 hover:bg-ivory-deep/50 hover:text-ink",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 items-center justify-center rounded-full border transition",
                        isActive ? "border-gold bg-gold" : "border-ink/20",
                      )}
                    >
                      {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );

  /* ─── Mobile filter fields (kept as dropdown for small screens) ─── */
  const mobileFilterFields = (
    <>
      {filters.showColor && filters.colorOptions.length > 0 ? (
        <div>
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">Color</p>
          <div className="flex flex-wrap gap-2">
            {filters.colorOptions.map((color) => {
              const isActive = activeColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => patchParams({ color: isActive ? null : color })}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    isActive
                      ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory scale-110"
                      : "ring-1 ring-black/10",
                  )}
                  style={{ background: getSwatchColor(color) }}
                >
                  {isActive ? (
                    <Check
                      className={cn(
                        "h-3 w-3",
                        ["white", "cream", "ivory", "beige", "yellow", "gold"].includes(color.toLowerCase())
                          ? "text-ink"
                          : "text-white",
                      )}
                      strokeWidth={2.5}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {filters.showSize && filters.sizeOptions.length > 0 ? (
        <div>
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">Size</p>
          <div className="flex flex-wrap gap-1.5">
            {filters.sizeOptions.map((size) => {
              const isActive = activeSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => patchParams({ size: isActive ? null : size })}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[11px] font-medium transition",
                    isActive
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-ivory-deep/80 text-ink/70",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {filters.showPrice && enabledPriceBands.length > 0 ? (
        <div>
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">Price</p>
          <div className="flex flex-wrap gap-1.5">
            {enabledPriceBands.map((band) => {
              const isActive = activePriceBand === band.id;
              return (
                <button
                  key={band.id}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      patchParams({ priceBand: null, minPrice: null, maxPrice: null });
                    } else {
                      patchParams({
                        priceBand: priceBandValue(band),
                        minPrice: String(band.min),
                        maxPrice: band.max != null ? String(band.max) : null,
                      });
                    }
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[11px] font-medium transition",
                    isActive
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-ivory-deep/80 text-ink/70",
                  )}
                >
                  {band.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {filters.showAvailability ? (
        <div>
          <button
            type="button"
            onClick={() => patchParams({ inStock: params.get("inStock") === "true" ? null : "true" })}
            className="flex items-center gap-2 font-sans text-[11px] text-ink/70"
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded border transition",
                params.get("inStock") === "true" ? "border-gold bg-gold" : "border-ink/20",
              )}
            >
              {params.get("inStock") === "true" ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /> : null}
            </span>
            In Stock Only
          </button>
        </div>
      ) : null}
      {filters.showSort && enabledSortOptions.length > 0 ? (
        <div>
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">Sort</p>
          <div className="space-y-1">
            {enabledSortOptions.map((opt) => {
              const isActive = (params.get("sort") ?? defaultSort) === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patchParams({ sort: opt.value })}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] transition",
                    isActive ? "bg-gold/10 font-medium text-gold" : "text-ink/70",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-3.5 w-3.5 items-center justify-center rounded-full border",
                      isActive ? "border-gold bg-gold" : "border-ink/20",
                    )}
                  >
                    {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <StoreBrowseShell>
      <StoreBrowseHeader
        kicker={collectionsConfig.kicker}
        title={collectionsConfig.title}
        subtitle={collectionsConfig.subtitle}
        meta={
          !loading && products.length > 0 ? (
            <StoreBrowseMetaPill>
              {total} piece{total === 1 ? "" : "s"}
            </StoreBrowseMetaPill>
          ) : null
        }
      />

      {/* Category tabs */}
      <div className="mt-6">
        <div className="lux-collection-categories">
          <div className="lux-scroll-x gap-2 pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => patchParams({ tab: cat.id, page: "1" })}
                className={cn(
                  "lux-filter-chip",
                  activeCategoryId === cat.id ? "lux-filter-chip-active" : "lux-filter-chip-idle",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile filter button */}
      {hasDesktopFilters ? (
        <button
          type="button"
          className="mt-4 lux-btn-outline inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 lg:hidden"
          onClick={() => setShowMobileFilters(true)}
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
          {messages.mobileFiltersLabel}
          {hasActiveRefinements ? (
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] text-gold">Active</span>
          ) : null}
        </button>
      ) : null}

      {/* Main content: products left + filter sidebar right */}
      <div className="mt-6 flex gap-8">
        {/* Products area */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <StoreInlineLoading
              className="px-0"
              label={messages.loading}
              sublabel="Refining your selection"
              variant="grid"
            />
          ) : products.length === 0 ? (
            <StoreBrowseEmpty
              title="Nothing matched"
              description={messages.empty}
              primaryAction={{ label: "Shop all collections", href: "/collections?tab=all" }}
              secondaryAction={
                hasActiveRefinements
                  ? { label: "Clear all filters", onClick: clearRefinements }
                  : undefined
              }
            />
          ) : (
            <motion.div
              key={queryString}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-5"
            >
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </motion.div>
          )}

          {/* Pagination */}
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
        </div>

        {/* Fixed sidebar filters (desktop only) */}
        {hasDesktopFilters ? sidebarFilters : null}
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {showMobileFilters ? (
          <motion.div
            className="fixed inset-0 z-40 bg-black/35 p-4 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[24px] bg-ivory p-5"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="lux-title-section">{messages.mobileDrawerTitle}</h3>
              <div className="mt-5 space-y-5">{mobileFilterFields}</div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  className="lux-btn-outline w-full py-2 text-xs tracking-[0.18em]"
                  onClick={clearRefinements}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="lux-btn-ink w-full py-2 text-xs tracking-[0.18em]"
                  onClick={() => setShowMobileFilters(false)}
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </StoreBrowseShell>
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
