"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Heart, Minus, Plus, Ruler, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useRecentlyViewed } from "@/lib/use-recently-viewed";
import type { Product } from "@/types";
import { cn } from "@/lib/cn";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCarouselRail } from "@/components/shop/ProductCarouselRail";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { buildProductGalleryItems } from "@/lib/product-gallery";
import type { SizeGuideConfig, StorefrontSettings } from "@/types/storefront-settings";
import { mergeStorefrontSettings } from "@/lib/storefront-settings";
import { ProductStickyCartBar } from "@/components/shop/ProductStickyCartBar";
import { LimitedStockBanner } from "@/components/shop/LimitedStockBanner";
import { ProductDetailDescription } from "@/components/shop/ProductDetailDescription";
import { ProductDetailSidebarServices } from "@/components/shop/ProductDetailSidebarServices";
import { getProductDetailAccordionFlags } from "@/components/shop/ProductDetailExtras";
import { ProductPriceDisplay } from "@/components/shop/ProductPriceDisplay";
import { ProductReviewsSection } from "@/components/shop/ProductReviewsSection";
import { SizeGuideModal } from "@/components/shop/SizeGuideModal";
import { getTotalProductStock, getStockForSize, isLimitedStock } from "@/lib/product-stock";
import { Reveal } from "@/components/luxury/Reveal";
import { MagneticButton } from "@/components/luxury/MagneticButton";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

type Props = {
  slug: string;
  adminPreviewToken?: string | null;
};

export function ProductDetail({ slug, adminPreviewToken }: Props) {
  const router = useRouter();
  const { addLine, openCart } = useCart();
  const { token, wishlistIds, updateWishlistLocal } = useAuth();
  const { ids: recentIds, track } = useRecentlyViewed();
  const [product, setProduct] = useState<Product | null>(null);
  const [suggested, setSuggested] = useState<Product[]>([]);
  const [suggestedLabel, setSuggestedLabel] = useState("Suggested for you");
  const [sizeGuide, setSizeGuide] = useState<SizeGuideConfig | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("care");
  const [addedPulse, setAddedPulse] = useState(false);
  const [showStickyCart, setShowStickyCart] = useState(false);
  const primaryCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const path = adminPreviewToken
          ? `/admin/products/slug/${slug}`
          : `/products/slug/${slug}`;
        const data = await apiFetch<{
          product: Product;
          related?: Product[];
          suggested?: { label: string; products: Product[] };
          storefront?: StorefrontSettings;
        }>(path, {
          token: adminPreviewToken ?? undefined,
        });
        if (cancelled) return;
        setProduct(data.product);
        const list = data.suggested?.products ?? data.related ?? [];
        setSuggested(list);
        setSuggestedLabel(data.suggested?.label ?? "Suggested for you");
        setSizeGuide(
          mergeStorefrontSettings(data.storefront).sizeGuide ?? null,
        );
        track(data.product._id);
        const v0 = data.product.variants[0];
        if (v0) {
          setSize(v0.size);
          setColor(v0.color);
        }
      } catch {
        if (!cancelled) setProduct(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, adminPreviewToken, track]);

  useEffect(() => {
    const others = recentIds.filter((id) => id !== product?._id).slice(0, 4);
    if (others.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiFetch<{ products: Product[] }>(
          `/products?ids=${others.map(encodeURIComponent).join(",")}`,
        );
        if (!cancelled) setRecentProducts(data.products ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recentIds, product?._id]);

  const galleryImages = useMemo(
    () => (product?.images ?? []).map((s) => s.trim()).filter(Boolean),
    [product?.images],
  );
  const hoverOverlaySrc = galleryImages[1];
  const galleryItems = useMemo(
    () => buildProductGalleryItems(product?.images ?? [], product?.imageCaptions),
    [product?.images, product?.imageCaptions],
  );
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
      if (galleryImages.length <= 1) return;
      if (e.key === "ArrowLeft") {
        setActiveIdx((i) => (i - 1 + galleryImages.length) % galleryImages.length);
      }
      if (e.key === "ArrowRight") {
        setActiveIdx((i) => (i + 1) % galleryImages.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen, galleryImages.length]);

  const variant = useMemo(() => {
    if (!product) return null;
    return (
      product.variants.find((v) => v.size === size && v.color === color) ??
      product.variants.find((v) => v.size === size) ??
      product.variants[0]
    );
  }, [product, size, color]);

  const sizes = useMemo(() => {
    if (!product) return [];
    return [...new Set(product.variants.map((v) => v.size))];
  }, [product]);

  const colors = useMemo(() => {
    if (!product) return [];
    const matchSize = product.variants.filter((v) => v.size === size);
    const pool = matchSize.length ? matchSize : product.variants;
    return [...new Set(pool.map((v) => v.color))];
  }, [product, size]);

  const liked = product ? wishlistIds.includes(product._id) : false;

  const totalStock = useMemo(
    () => (product ? getTotalProductStock(product) : 0),
    [product],
  );
  const showLimitedStock = isLimitedStock(totalStock);
  const accordionFlags = useMemo(
    () => (product ? getProductDetailAccordionFlags(product) : null),
    [product],
  );

  const toggleWishlist = async () => {
    if (!product) return;
    try {
      if (token) {
        await apiFetch<{ wishlist: string[] }>("/users/wishlist", {
          method: "PATCH",
          token,
          body: JSON.stringify({ productId: product._id }),
        });
      }
      updateWishlistLocal(product._id, !liked);
    } catch {
      updateWishlistLocal(product._id, !liked);
    }
  };

  const handleAdd = (opts?: { openCart?: boolean }) => {
    if (!product || !variant || variant.stock <= 0) return;
    addLine({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] ?? "",
      price: product.price,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: qty,
    });
    setAddedPulse(true);
    window.setTimeout(() => setAddedPulse(false), 2200);
    if (opts?.openCart !== false) openCart();
  };

  const handleBuyNow = () => {
    handleAdd({ openCart: false });
    router.push("/checkout");
  };

  const handleSizeChange = (next: string) => {
    setSize(next);
    if (!product) return;
    const inStock = product.variants.filter((v) => v.size === next && (v.stock ?? 0) > 0);
    if (inStock[0]) setColor(inStock[0].color);
  };

  useEffect(() => {
    const el = primaryCtaRef.current;
    if (!el || !product) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry) setShowStickyCart(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [product]);

  if (!product) {
    return (
      <div className="lux-shell py-32">
        <p className="font-sans text-sm font-light text-ink-muted">
          This piece is no longer on the rails —{" "}
          <Link href="/collections" className="lux-link-underline text-gold">
            return to collections
          </Link>
          .
        </p>
      </div>
    );
  }

  const safeActiveIdx = galleryImages.length
    ? Math.min(activeIdx, galleryImages.length - 1)
    : 0;
  const image = galleryImages[safeActiveIdx];
  const activeLabel = galleryItems[safeActiveIdx]?.label;

  const canAdd = variant && variant.stock > 0;

  return (
    <>
      <div className="lux-shell pb-mobile-cta pb-pdp-sticky pt-3 sm:pt-4 md:pb-36 md:pt-6">
        {adminPreviewToken ? (
          <motion.div className="mb-6 rounded-lux-lg border border-amber-200/80 bg-amber-50/90 px-4 py-3 font-sans text-xs text-amber-950 md:text-sm">
            <span className="font-medium">Admin preview</span>
            <span className="text-amber-800">
              {" "}
              — matches live product styling. Hidden products only appear here.
            </span>
          </motion.div>
        ) : null}

        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[9px] uppercase tracking-[0.22em] text-ink-soft sm:mb-5 sm:text-[10px]"
        >
          <Link href="/" className="transition-colors hover:text-gold">
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link href="/collections" className="transition-colors hover:text-gold">
            Collections
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink-muted">{product.category}</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
          <div
            ref={galleryRef}
            className="lg:sticky lg:top-[calc(var(--store-nav-pad)+0.25rem)] lg:self-start"
          >
            <Reveal>
              <ProductGallery
                variant="pdp"
                images={galleryImages}
                hoverOverlaySrc={hoverOverlaySrc}
                captions={product.imageCaptions}
                productName={product.name}
                activeIdx={safeActiveIdx}
                onActiveChange={setActiveIdx}
                onOpenZoom={() => setZoomOpen(true)}
              />
            </Reveal>
          </div>

          <Reveal delay={0.06} className="lg:max-w-md lg:justify-self-end lg:w-full xl:max-w-lg">
            <div className="flex items-start justify-between gap-3">
              <p className="lux-kicker text-gold/90">{product.category}</p>
              <motion.button
                type="button"
                onClick={() => void toggleWishlist()}
                aria-label={liked ? "Remove from wishlist" : "Save to wishlist"}
                whileTap={{ scale: 0.9 }}
                className="touch-target rounded-full p-1.5 text-ink-muted transition-colors hover:text-gold"
              >
                <Heart
                  className={cn(
                    "h-[1.125rem] w-[1.125rem] transition-all duration-500",
                    liked ? "fill-gold text-gold" : "",
                  )}
                  strokeWidth={1.25}
                />
              </motion.button>
            </div>

            <h1 className="lux-title-section mt-1.5">{product.name}</h1>

            <ProductDetailDescription product={product} className="mt-4" />

            <ProductPriceDisplay product={product} className="mt-4" size="lg" />

            <div className="pdp-purchase-panel mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="pdp-option-label">
                    Size{size ? `: ${size}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-gold"
                  >
                    <Ruler className="h-3 w-3" strokeWidth={1.25} />
                    Size chart
                  </button>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {sizes.map((s) => {
                    const sizeStock = getStockForSize(product, s);
                    const oos = sizeStock <= 0;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={oos}
                        onClick={() => handleSizeChange(s)}
                        className={cn(
                          "pdp-chip",
                          size === s ? "pdp-chip-active" : oos ? "pdp-chip-disabled" : "pdp-chip-idle",
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                {showLimitedStock ? (
                  <LimitedStockBanner totalStock={totalStock} />
                ) : null}
              </div>

              {colors.length > 1 ? (
                <div>
                  <p className="pdp-option-label">
                    Colour{color ? `: ${color}` : ""}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "pdp-chip",
                          color === c ? "pdp-chip-active" : "pdp-chip-idle",
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <p className="pdp-option-label mr-1">Qty</p>
                <div className="inline-flex items-center gap-2 rounded-md border border-ivory-deep bg-ivory px-2 py-1">
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-ivory-soft"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[1.75rem] text-center font-sans text-sm">{qty}</span>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-ivory-soft"
                    aria-label="Increase quantity"
                    onClick={() =>
                      setQty((q) => Math.min(variant?.stock ?? q + 1, q + 1))
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {!canAdd ? (
                  <span className="font-sans text-xs text-gold">Awaiting restock</span>
                ) : null}
              </div>

              <div ref={primaryCtaRef} className="space-y-2.5 pt-1">
                <MagneticButton
                  variant="outline"
                  disabled={!canAdd}
                  onClick={() => handleAdd()}
                  className="w-full"
                >
                  {addedPulse ? "Added to bag" : "Add to cart"}
                </MagneticButton>
                <MagneticButton
                  variant="primary"
                  disabled={!canAdd}
                  onClick={handleBuyNow}
                  className="w-full"
                >
                  Buy it now
                </MagneticButton>
                <p className="text-center font-sans text-[10px] font-light text-ink-soft">
                  Secure checkout · Complimentary exchanges
                </p>
              </div>

              <ProductDetailSidebarServices
                product={product}
                className="border-t border-ivory-deep/60 pt-4"
              />
            </div>
          </Reveal>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-3xl flex-col items-center lg:mt-10">
          {accordionFlags &&
          (accordionFlags.showFabric || accordionFlags.showStyling) ? (
            <Reveal delay={0.12} className="mt-5 w-full">
              <div className="divide-y divide-ivory-deep rounded-lux border border-ivory-deep/70 px-4 sm:px-5">
                {accordionFlags.showFabric ? (
                  <AccordionRow
                    title="Fabric & finish"
                    open={openSection === "fabric"}
                    onToggle={() =>
                      setOpenSection(openSection === "fabric" ? null : "fabric")
                    }
                  >
                    <p className="pb-4 font-sans text-sm font-light leading-[1.7] text-ink-muted">
                      {product.fabricDetails?.trim()}
                    </p>
                  </AccordionRow>
                ) : null}
                {accordionFlags.showStyling ? (
                  <AccordionRow
                    title="Styling notes"
                    open={openSection === "styling"}
                    onToggle={() =>
                      setOpenSection(openSection === "styling" ? null : "styling")
                    }
                  >
                    <p className="pb-4 font-sans text-sm font-light leading-[1.7] text-ink-muted">
                      {product.stylingSuggestions?.trim()}
                    </p>
                  </AccordionRow>
                ) : null}
              </div>
            </Reveal>
          ) : null}

          <ProductReviewsSection
            productName={product.name}
            className="mt-14 w-full border-t border-ivory-deep pt-12"
          />
        </div>

        {suggested.length > 0 ? (
          <div className="mt-12 overflow-visible border-t border-ivory-deep pt-10 md:mt-14">
            <ProductCarouselRail
              eyebrow="Suggested"
              title={suggestedLabel}
              products={suggested}
            />
          </div>
        ) : null}

        {recentProducts.length > 0 ? (
          <Reveal className="mt-14 border-t border-ivory-deep pt-12">
            <p className="lux-kicker">Recently viewed</p>
            <h2 className="lux-heading-rail mt-2">Continue browsing</h2>
            <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {recentProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </Reveal>
        ) : null}
      </div>

      <ProductStickyCartBar
        visible={showStickyCart}
        product={product}
        variant={variant}
        size={size}
        sizes={sizes}
        qty={qty}
        canAdd={Boolean(canAdd)}
        addedPulse={addedPulse}
        onSizeChange={handleSizeChange}
        onQtyChange={setQty}
        onAdd={() => handleAdd()}
      />

      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        config={sizeGuide}
      />

      <AnimatePresence>
        {zoomOpen && image ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomOpen(false)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomOpen(false);
              }}
              className="fixed right-4 top-4 z-[95] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/95 text-ink"
              aria-label="Close image preview"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lux-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cn("relative aspect-[3/4] bg-ink", storefrontImageShellClass)}>
                {image ? (
                  <Image
                    key={image}
                    src={image}
                    alt={product.name}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    {...storefrontImageProps}
                  />
                ) : null}
              </div>
              {galleryImages.length > 1 ? (
                <>
                  <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5">
                    {activeLabel ? (
                      <p className="rounded-full bg-white/95 px-3 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-ink">
                        {activeLabel}
                      </p>
                    ) : null}
                    <p className="rounded-full bg-white/90 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                      {safeActiveIdx + 1} / {galleryImages.length}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIdx(
                        (i) => (i - 1 + galleryImages.length) % galleryImages.length,
                      );
                    }}
                    className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/90 text-ink hover:text-gold"
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.25} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIdx((i) => (i + 1) % galleryImages.length);
                    }}
                    className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/90 text-ink hover:text-gold"
                  >
                    <ChevronRight className="h-5 w-5" strokeWidth={1.25} />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 flex gap-2 overflow-x-auto bg-gradient-to-t from-black/50 to-transparent p-3 pt-10">
                    {galleryImages.map((src, i) => (
                      <button
                        key={`${src}-${i}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIdx(i);
                        }}
                        className={cn(
                          "relative h-14 w-11 shrink-0 overflow-hidden rounded-md border-2 transition",
                          safeActiveIdx === i ? "border-gold" : "border-transparent opacity-70",
                        )}
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="44px"
                          {...storefrontImageProps}
                        />
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function AccordionRow({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3 text-left font-display text-base font-normal text-ink sm:text-lg"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform duration-500 ease-luxury",
            open ? "rotate-180" : "",
          )}
          strokeWidth={1.25}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
