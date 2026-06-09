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
import { CollectionsFilterField } from "@/components/shop/CollectionsFilterField";
import { ProductCard } from "@/components/shop/ProductCard";
import {
  StoreBrowseEmpty,
  StoreBrowseHeader,
  StoreBrowseMetaPill,
  StoreBrowseShell,
} from "@/components/shop/StoreBrowseUI";
import { StoreInlineLoading } from "@/components/ui/StoreLoadingUI";
import { SlidersHorizontal, X } from "lucide-react";

type CollectionsConfig = HomepageConfig["collectionsPage"];

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

        // Extract global categories for per-category pinned product ordering
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

        // Determine pinned product IDs based on active tab
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
            // Find the matching global category and use its pinned IDs
            const matchedCat = globalCategories.find(
              (g) => g.slug?.toLowerCase() === activeTab.value?.toLowerCase(),
            );
            pins = (matchedCat?.pinnedProductIds ?? []).filter(Boolean);
          } else if (activeTab?.type === "bestselling") {
            // Use homepage bestseller pinned IDs
            const bestPins = settings.settings.homepage.bestsellers?.productIds ?? [];
            pins = bestPins.filter(Boolean);
          } else if (activeTab?.type === "newIn") {
            // Use homepage new-in pinned IDs
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

  const filterFields = (
    <>
      {filters.showSize && filters.sizeOptions.length > 0 ? (
        <CollectionsFilterField
          label="Size"
          value={params.get("size") ?? ""}
          options={["", ...filters.sizeOptions]}
          allLabel={messages.filterAll}
          onChange={(v) => patchParams({ size: v || null })}
        />
      ) : null}
      {filters.showColor && filters.colorOptions.length > 0 ? (
        <CollectionsFilterField
          label="Color"
          value={params.get("color") ?? ""}
          options={["", ...filters.colorOptions]}
          allLabel={messages.filterAll}
          onChange={(v) => patchParams({ color: v || null })}
        />
      ) : null}
      {filters.showPrice && enabledPriceBands.length > 0 ? (
        <CollectionsFilterField
          label="Price"
          value={activePriceBand}
          options={["", ...enabledPriceBands.map((b) => b.id)]}
          allLabel={messages.filterAll}
          onChange={(v) => {
            const band = enabledPriceBands.find((b) => b.id === v);
            if (!band) {
              patchParams({ priceBand: null, minPrice: null, maxPrice: null });
              return;
            }
            patchParams({
              priceBand: priceBandValue(band),
              minPrice: String(band.min),
              maxPrice: band.max != null ? String(band.max) : null,
            });
          }}
          renderOption={(opt) =>
            opt === "" ? messages.filterAll : (enabledPriceBands.find((b) => b.id === opt)?.label ?? opt)
          }
        />
      ) : null}
      {filters.showAvailability ? (
        <CollectionsFilterField
          label="Availability"
          value={params.get("inStock") === "true" ? "in" : ""}
          options={["", "in"]}
          allLabel={messages.availabilityAll}
          onChange={(v) => patchParams({ inStock: v ? "true" : null })}
          renderOption={(opt) => (opt === "in" ? messages.availabilityInStock : messages.availabilityAll)}
        />
      ) : null}
      {filters.showSort && enabledSortOptions.length > 0 ? (
        <CollectionsFilterField
          label="Sort"
          className="max-w-[12rem]"
          value={params.get("sort") ?? defaultSort}
          options={enabledSortOptions.map((o) => o.value)}
          onChange={(v) => patchParams({ sort: v })}
          renderOption={(opt) => enabledSortOptions.find((o) => o.value === opt)?.label ?? opt}
        />
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

        <section className="mt-10 space-y-5">
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

          {hasDesktopFilters ? (
            <div className="lux-collection-filter-bar hidden md:block">
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="font-sans text-[10px] font-medium uppercase tracking-[0.24em] text-ink-soft">
                  Refine
                </p>
                {hasActiveRefinements ? (
                  <button
                    type="button"
                    onClick={clearRefinements}
                    className="inline-flex items-center gap-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-gold transition hover:text-ink"
                  >
                    <X className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                    Clear filters
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-4">{filterFields}</div>
            </div>
          ) : null}

          {hasDesktopFilters ? (
            <button
              type="button"
              className="lux-btn-outline inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 md:hidden"
              onClick={() => setShowMobileFilters(true)}
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
              {messages.mobileFiltersLabel}
              {hasActiveRefinements ? (
                <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] text-gold">Active</span>
              ) : null}
            </button>
          ) : null}
        </section>

        {loading ? (
          <StoreInlineLoading
            className="mt-6 px-0"
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
            className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4 lg:gap-x-6"
          >
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
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
                <h3 className="lux-title-section">{messages.mobileDrawerTitle}</h3>
                <div className="mt-5 grid grid-cols-2 gap-4">{filterFields}</div>
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
