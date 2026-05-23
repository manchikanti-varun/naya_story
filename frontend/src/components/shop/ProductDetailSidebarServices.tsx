"use client";

import type { ReactNode } from "react";
import { ArrowLeftRight, Package, Share2, Truck } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { Product } from "@/types";
import { useProductCompare } from "@/hooks/use-product-compare";
import { getEstimatedDeliveryLabel } from "@/lib/delivery-estimate";
import { MAX_COMPARE_ITEMS } from "@/lib/product-compare";
import { formatInr, FREE_SHIPPING_THRESHOLD_INR } from "@/lib/store-shipping";
import { cn } from "@/lib/cn";

const DEFAULT_PDP_DELIVERY_AND_CARE =
  "Complimentary shipping over ₹15,000. Dry clean only — store on a padded hanger away from direct sunlight.";

function ServiceRow({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 shrink-0 text-ink">{icon}</span>
      <div className="min-w-0 font-sans text-[13px] font-light leading-snug text-ink-muted">
        <p className="font-medium text-ink">{title}</p>
        <div className="mt-0.5 text-ink">{children}</div>
      </div>
    </div>
  );
}

type Props = {
  product: Product;
  className?: string;
};

/** Compare, share, delivery — sits below add-to-cart on the PDP column. */
export function ProductDetailSidebarServices({ product, className }: Props) {
  const { inCompare, toggle, mounted, count } = useProductCompare(product.slug);
  const [statusHint, setStatusHint] = useState<string | null>(null);

  const deliveryRange =
    product.pdpDeliveryRange?.trim() || getEstimatedDeliveryLabel();
  const freeShippingLine =
    product.pdpFreeShippingNote?.trim() ||
    `Orders over ${formatInr(FREE_SHIPPING_THRESHOLD_INR)}`;
  const deliveryAndCare =
    product.pdpDeliveryAndCare?.trim() || DEFAULT_PDP_DELIVERY_AND_CARE;

  const handleCompare = () => {
    const { added, slugs } = toggle();
    if (added) {
      const atMax = slugs.length >= MAX_COMPARE_ITEMS;
      setStatusHint(
        atMax
          ? `Added — list full (${MAX_COMPARE_ITEMS}). Oldest piece replaced.`
          : `Added to compare (${slugs.length} of ${MAX_COMPARE_ITEMS})`,
      );
    } else {
      setStatusHint("Removed from compare");
    }
    window.setTimeout(() => setStatusHint(null), 3200);
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
          text: product.name,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatusHint("Link copied");
    } catch {
      setStatusHint("Could not share");
    }
    window.setTimeout(() => setStatusHint(null), 2400);
  }, [product.name, product.slug]);

  const actionClass =
    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-sans text-[12px] font-light text-ink transition-colors hover:bg-ivory-soft hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <button type="button" onClick={handleCompare} className={actionClass}>
          <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
          {mounted && inCompare ? "Remove from compare" : "Compare"}
        </button>
        <span className="text-ink-soft/35" aria-hidden>
          ·
        </span>
        <button type="button" onClick={() => void handleShare()} className={actionClass}>
          <Share2 className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
          Share
        </button>
        {mounted && count > 0 ? (
          <>
            <span className="text-ink-soft/35" aria-hidden>
              ·
            </span>
            <Link href="/compare" className={actionClass}>
              View compare ({count})
            </Link>
          </>
        ) : null}
        {statusHint ? (
          <span className="w-full font-sans text-[11px] text-gold" role="status">
            {statusHint}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ServiceRow
          icon={<Truck className="h-4 w-4" strokeWidth={1.25} aria-hidden />}
          title="Estimated delivery"
        >
          {deliveryRange}
        </ServiceRow>
        <ServiceRow
          icon={<Package className="h-4 w-4" strokeWidth={1.25} aria-hidden />}
          title="Free shipping"
        >
          {freeShippingLine}
        </ServiceRow>
      </div>

      <div className="border-t border-ivory-deep/50 pt-4">
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
          Delivery &amp; care
        </p>
        <p className="mt-2 font-sans text-[13px] font-light leading-[1.65] text-ink-muted">
          {deliveryAndCare}
        </p>
      </div>
    </div>
  );
}
