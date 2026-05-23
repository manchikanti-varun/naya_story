"use client";

import Image from "next/image";
import { buildProductGalleryItems } from "@/lib/product-gallery";
import { cn } from "@/lib/cn";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

type Props = {
  images: string[];
  captions?: string[] | null;
  productName: string;
  className?: string;
  /** Maps detail-grid index to full product gallery index (default: same index). */
  onSelectIndex?: (galleryIndex: number) => void;
  detailStartIndex?: number;
};

/** Editorial grid of design / detail shots below the main PDP gallery. */
export function ProductDesignGallery({
  images,
  captions,
  productName,
  className,
  onSelectIndex,
  detailStartIndex = 0,
}: Props) {
  const items = buildProductGalleryItems(images, captions);
  if (items.length < 1) return null;

  return (
    <section className={cn("border-t border-ivory-deep pt-10 md:pt-12", className)} aria-label="Design details">
      <p className="lux-kicker text-gold/90">The piece, in detail</p>
      <h2 className="lux-title-section mt-2 text-balance">Design & construction</h2>
      <p className="lux-copy mt-3 max-w-xl text-ink-muted">
        Every angle of {productName} — fabric, silhouette, and finish.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {items.map((item, idx) => {
          const galleryIndex = detailStartIndex + idx;
          return (
            <li key={`${item.url}-${galleryIndex}`}>
              <button
                type="button"
                onClick={() => onSelectIndex?.(galleryIndex)}
                className={cn(
                  "group block w-full text-left transition",
                  onSelectIndex ? "cursor-pointer" : "cursor-default",
                )}
              >
                <div
                  className={cn(
                    "relative aspect-[3/4] overflow-hidden rounded-lux",
                    storefrontImageShellClass,
                  )}
                >
                  <Image
                    src={item.url}
                    alt={`${productName} — ${item.label}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    loading="lazy"
                    {...storefrontImageProps}
                  />
                </div>
                <p className="mt-3 font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
                  {item.label}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
