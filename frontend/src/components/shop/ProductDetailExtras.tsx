"use client";

import type { ReactNode } from "react";
import { ArrowLeftRight, Package, Share2, Truck } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { Product } from "@/types";
import { useProductCompare } from "@/hooks/use-product-compare";
import { getEstimatedDeliveryLabel } from "@/lib/delivery-estimate";
import {
  bulletsFromStylingNotes,
  parseProductDescription,
} from "@/lib/parse-product-description";
import { MAX_COMPARE_ITEMS } from "@/lib/product-compare";
import { formatInr, FREE_SHIPPING_THRESHOLD_INR } from "@/lib/store-shipping";
import { cn } from "@/lib/cn";

const DEFAULT_PRINT_DISCLAIMER =
  "Print and placement may differ, making every piece uniquely yours.";

type Props = {
  product: Product;
  className?: string;
  /** Center story + actions (PDP below-fold) */
  align?: "start" | "center";
};

function UtilityAction({
  icon,
  label,
  onClick,
  href,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const className = cn(
    "inline-flex items-center gap-2 rounded-md px-2 py-1.5 font-sans text-[13px] font-light text-ink transition-colors",
    "hover:bg-ivory-soft hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {icon}
      {label}
    </button>
  );
}

export function ProductDetailExtras({ product, className, align = "center" }: Props) {
  const { inCompare, toggle, mounted, count } = useProductCompare(product.slug);
  const [shareHint, setShareHint] = useState<string | null>(null);

  const parsed = parseProductDescription(product.description);
  const legacyBullets = bulletsFromStylingNotes(product.stylingSuggestions);
  const bullets = parsed.bullets.length > 0 ? parsed.bullets : legacyBullets;

  const intro =
    parsed.intro ||
    product.shortDescription?.trim() ||
    (bullets.length === 0 ? product.description?.trim() : "");

  const fabricRaw =
    product.fabricDetails?.trim() || product.material?.trim() || null;
  const fabricLabel = fabricRaw
    ? /^fabric used:/i.test(fabricRaw)
      ? fabricRaw
      : `Fabric Used: ${fabricRaw}`
    : null;

  const printDisclaimer =
    product.pdpPrintDisclaimer?.trim() || DEFAULT_PRINT_DISCLAIMER;
  const deliveryRange =
    product.pdpDeliveryRange?.trim() || getEstimatedDeliveryLabel();
  const freeShippingLine =
    product.pdpFreeShippingNote?.trim() ||
    `Orders over ${formatInr(FREE_SHIPPING_THRESHOLD_INR)}`;
  const hasStory = Boolean(intro || bullets.length > 0 || fabricLabel);

  const handleCompare = () => {
    const { added, slugs } = toggle();
    if (added) {
      const atMax = slugs.length >= MAX_COMPARE_ITEMS;
      setShareHint(
        atMax
          ? `Added — list is full (${MAX_COMPARE_ITEMS}). Oldest piece was replaced.`
          : `Added to compare (${slugs.length} of ${MAX_COMPARE_ITEMS})`,
      );
    } else {
      setShareHint("Removed from compare");
    }
    window.setTimeout(() => setShareHint(null), 3200);
  };

  const handleShare = useCallback(async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/products/${product.slug}`
        : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.shortDescription ?? product.name,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint("Link copied");
    } catch {
      setShareHint("Could not share");
    }
    window.setTimeout(() => setShareHint(null), 2400);
  }, [product.name, product.shortDescription, product.slug]);

  const centered = align === "center";

  return (
    <section
      className={cn(
        "pdp-details-card overflow-hidden",
        centered && "text-center",
        className,
      )}
    >
      {hasStory ? (
        <div
          className={cn(
            "space-y-3 px-4 py-4 sm:px-5 sm:py-5",
            centered && "mx-auto max-w-xl",
          )}
        >
          {intro ? (
            <p className="font-sans text-sm font-light leading-[1.7] text-ink-muted">{intro}</p>
          ) : null}

          {bullets.length > 0 ? (
            <ul
              className={cn(
                "space-y-1.5 font-sans text-sm font-light leading-[1.6] text-ink-muted",
                centered && "mx-auto inline-block text-left",
              )}
            >
              {bullets.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="shrink-0 text-ink/40" aria-hidden>
                    ›
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {fabricLabel ? (
            <p className="font-sans text-sm font-light text-ink-muted">{fabricLabel}</p>
          ) : null}

          <p className="font-sans text-[11px] font-light leading-relaxed text-ink-soft">
            {printDisclaimer}
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-wrap items-center gap-x-1 gap-y-1 border-ivory-deep/60 px-3 py-2.5 sm:px-4",
          hasStory && "border-t",
          centered && "justify-center",
        )}
      >
        <UtilityAction
          icon={<ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />}
          label={mounted && inCompare ? "Remove from compare" : "Add to compare"}
          onClick={handleCompare}
        />
        {mounted && count > 0 ? (
          <>
            <span className="text-ink-soft/40" aria-hidden>
              ·
            </span>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 font-sans text-[13px] font-light text-ink transition-colors hover:bg-ivory-soft hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              View compare ({count})
            </Link>
          </>
        ) : null}
        <span className="text-ink-soft/40" aria-hidden>
          ·
        </span>
        <UtilityAction
          icon={<Share2 className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />}
          label="Share"
          onClick={() => void handleShare()}
        />
        {shareHint ? (
          <span
            className={cn(
              "font-sans text-[11px] text-gold",
              centered ? "w-full basis-full text-center" : "ml-auto",
            )}
            role="status"
          >
            {shareHint}
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "grid gap-3 border-t border-ivory-deep/60 px-4 py-3 sm:grid-cols-2 sm:px-5 sm:py-4",
          centered && "sm:mx-auto sm:max-w-xl",
        )}
      >
        <div className={cn("flex gap-2.5", centered && "sm:justify-center")}>
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-ink" strokeWidth={1.25} aria-hidden />
          <p className="font-sans text-[13px] font-light leading-snug text-ink-muted">
            <span className="text-ink">Estimated delivery</span>
            <br />
            <span className="font-normal text-ink">{deliveryRange}</span>
          </p>
        </div>
        <div className={cn("flex gap-2.5", centered && "sm:justify-center")}>
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-ink" strokeWidth={1.25} aria-hidden />
          <p className="font-sans text-[13px] font-light leading-snug text-ink-muted">
            <span className="text-ink">Free shipping</span>
            <br />
            <span className="font-normal text-ink">{freeShippingLine}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Whether accordion rows duplicate content already shown in extras */
export function getProductDetailAccordionFlags(product: Product) {
  const parsed = parseProductDescription(product.description);
  const bullets =
    parsed.bullets.length > 0
      ? parsed.bullets
      : bulletsFromStylingNotes(product.stylingSuggestions);
  const fabricInExtras = Boolean(product.fabricDetails?.trim() || product.material?.trim());
  const stylingInExtras = bullets.length > 0;
  const showFabric =
    !fabricInExtras && Boolean(product.fabricDetails?.trim());
  const showStyling =
    !stylingInExtras && Boolean(product.stylingSuggestions?.trim());
  return { showFabric, showStyling, showCare: false };
}
