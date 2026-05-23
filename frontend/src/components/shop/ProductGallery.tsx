"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildProductGalleryItems } from "@/lib/product-gallery";
import { cn } from "@/lib/cn";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

type Props = {
  images: string[];
  captions?: string[] | null;
  productName: string;
  activeIdx: number;
  onActiveChange: (index: number) => void;
  onOpenZoom: () => void;
  variant?: "default" | "pdp";
  /** PDP only: second image as hover overlay when viewing photo 1. */
  hoverOverlaySrc?: string;
};

export function ProductGallery({
  images,
  captions,
  productName,
  activeIdx,
  onActiveChange,
  onOpenZoom,
  variant = "default",
  hoverOverlaySrc,
}: Props) {
  const isPdp = variant === "pdp";
  const [mobileShowOverlay, setMobileShowOverlay] = useState(false);

  const mediaClass =
    variant === "pdp" ? "lux-product-media lux-product-media--pdp" : "lux-product-media";
  const items = useMemo(() => buildProductGalleryItems(images, captions), [images, captions]);
  const gallery = useMemo(() => items.map((it) => it.url), [items]);
  const safeIdx = gallery.length ? Math.min(activeIdx, gallery.length - 1) : 0;
  const overlaySrc = hoverOverlaySrc?.trim() || (isPdp && gallery.length > 1 ? gallery[1] : undefined);
  const showHoverOverlay = isPdp && safeIdx === 0 && Boolean(overlaySrc);
  const mainSrc = gallery[safeIdx] ?? gallery[0];
  const activeLabel = items[safeIdx]?.label;
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const showThumbs = gallery.length > 1;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (gallery.length <= 1) return;
      const next = (safeIdx + dir + gallery.length) % gallery.length;
      onActiveChange(next);
    },
    [gallery.length, onActiveChange, safeIdx],
  );

  useEffect(() => {
    if (!isPdp) return;
    setMobileShowOverlay(false);
  }, [safeIdx, isPdp]);

  useEffect(() => {
    const el = thumbStripRef.current;
    if (!el || !showThumbs) return;
    const thumb = el.querySelector<HTMLElement>(`[data-thumb-index="${safeIdx}"]`);
    thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [safeIdx, showThumbs]);

  if (!mainSrc) {
    return <div className={cn(mediaClass, "rounded-lux", storefrontImageShellClass)} />;
  }

  const thumbMaxH =
    variant === "pdp"
      ? "max-h-[min(68vh,520px)] sm:max-h-[min(72vh,560px)] lg:max-h-[min(78vh,620px)]"
      : "max-h-[min(58vh,480px)]";

  const handlePdpMainClick = () => {
    if (showHoverOverlay && typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileShowOverlay((v) => !v);
      return;
    }
    onOpenZoom();
  };

  return (
    <div className="lg:flex lg:gap-3 xl:gap-4">
      {showThumbs ? (
        <div className={cn("hidden shrink-0 lg:block lg:w-[4rem] xl:w-[4.5rem]", thumbMaxH)}>
          <div
            className={cn(
              "flex flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5 no-scrollbar",
              thumbMaxH,
            )}
          >
            {gallery.map((src, i) => (
              <ThumbButton
                key={`${src}-${i}`}
                src={src}
                index={i}
                label={items[i]?.label}
                active={safeIdx === i}
                layout="vertical"
                onSelect={() => onActiveChange(i)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="group relative">
          <button
            type="button"
            onClick={isPdp && showHoverOverlay ? handlePdpMainClick : onOpenZoom}
            className={cn(mediaClass, "rounded-lux", storefrontImageShellClass)}
          >
            {showHoverOverlay ? (
              <>
                <Image
                  key={gallery[0]}
                  src={gallery[0]!}
                  alt={items[0]?.label ? `${productName} — ${items[0].label}` : productName}
                  fill
                  priority
                  className={cn(
                    "object-cover transition duration-[1.4s] ease-luxury",
                    mobileShowOverlay ? "opacity-0" : "opacity-100",
                  )}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  {...storefrontImageProps}
                />
                <Image
                  src={overlaySrc!}
                  alt={`${productName} — alternate view`}
                  fill
                  className={cn(
                    "object-cover transition duration-[1.2s] ease-luxury",
                    "opacity-0 group-hover:opacity-100",
                    mobileShowOverlay && "opacity-100",
                    !mobileShowOverlay && "max-lg:opacity-0",
                  )}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  {...storefrontImageProps}
                />
              </>
            ) : (
              <Image
                key={mainSrc}
                src={mainSrc}
                alt={activeLabel ? `${productName} — ${activeLabel}` : productName}
                fill
                priority={safeIdx === 0}
                className={cn(
                  "object-cover transition duration-[1.4s] ease-luxury",
                  !isPdp && "group-hover:scale-[1.02]",
                )}
                sizes="(max-width: 1024px) 100vw, 50vw"
                {...storefrontImageProps}
              />
            )}
          </button>

          {showHoverOverlay ? (
            <>
              <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-ivory/90 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-ink-muted backdrop-blur-sm max-lg:hidden lg:opacity-0 lg:transition lg:group-hover:opacity-100">
                Hover for alternate view
              </p>
              <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-ivory/90 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-ink-muted backdrop-blur-sm lg:hidden">
                Tap to switch view
              </p>
            </>
          ) : null}

          <button
            type="button"
            aria-label="Expand image"
            onClick={(e) => {
              e.stopPropagation();
              onOpenZoom();
            }}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-ivory-deep/60 bg-ivory/90 text-ink shadow-sm transition hover:border-gold/50 hover:text-gold"
          >
            <Expand className="h-4 w-4" strokeWidth={1.25} />
          </button>

          {showThumbs ? (
            <>
              <div className="pointer-events-none absolute bottom-3 left-3 flex max-w-[min(100%,16rem)] flex-col gap-1.5">
                {activeLabel ? (
                  <p className="rounded-full bg-ivory/95 px-3 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-ink backdrop-blur-sm">
                    {activeLabel}
                  </p>
                ) : null}
                <p className="w-fit rounded-full bg-ivory/90 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-ink-muted backdrop-blur-sm">
                  {safeIdx + 1} / {gallery.length}
                </p>
              </div>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ivory-deep/60 bg-ivory/90 text-ink shadow-sm transition hover:border-gold/50 hover:text-gold lg:hidden"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={1.25} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ivory-deep/60 bg-ivory/90 text-ink shadow-sm transition hover:border-gold/50 hover:text-gold lg:hidden"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </>
          ) : null}
        </div>

        {showThumbs ? (
          <div ref={thumbStripRef} className="mt-3 md:mt-4 lg:hidden">
            <div className="lux-scroll-x gap-2.5 md:gap-3">
              {gallery.map((src, i) => (
                <ThumbButton
                  key={`${src}-${i}`}
                  src={src}
                  index={i}
                  label={items[i]?.label}
                  active={safeIdx === i}
                  layout="horizontal"
                  onSelect={() => onActiveChange(i)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ThumbButton({
  src,
  index,
  label,
  active,
  layout,
  onSelect,
}: {
  src: string;
  index: number;
  label?: string;
  active: boolean;
  layout: "horizontal" | "vertical";
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      data-thumb-index={index}
      title={label}
      onClick={onSelect}
      className={cn(
        "relative overflow-hidden rounded-lux transition-all duration-500",
        storefrontImageShellClass,
        layout === "horizontal"
          ? "aspect-[3/4] w-[3.75rem] shrink-0 sm:w-[4.5rem]"
          : "aspect-[3/4] w-full",
        active ? "ring-1 ring-gold ring-offset-2 ring-offset-ivory" : "opacity-65 hover:opacity-100",
      )}
    >
      <Image
        src={src}
        alt={label ?? ""}
        fill
        className="object-cover"
        sizes={layout === "horizontal" ? "80px" : "72px"}
        {...storefrontImageProps}
      />
    </button>
  );
}
