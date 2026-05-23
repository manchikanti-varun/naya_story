import type { Product } from "@/types";
import {
  formatProductInr,
  getProductPriceDisplay,
} from "@/lib/product-price";
import { cn } from "@/lib/cn";

type Props = {
  product: Pick<Product, "price" | "compareAtPrice" | "discountPercent">;
  className?: string;
  size?: "md" | "lg" | "compact";
};

export function ProductPriceDisplay({ product, className, size = "md" }: Props) {
  const pricing = getProductPriceDisplay(product);
  const priceClass =
    size === "lg"
      ? "font-sans text-xl font-light tracking-wide text-ink sm:text-2xl"
      : size === "compact"
        ? "lux-product-price"
        : "font-sans text-lg font-light tracking-wide text-ink";

  return (
    <div className={cn(size === "compact" ? "space-y-0" : "space-y-1", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={priceClass}>{formatProductInr(pricing.currentPrice)}</span>
        {pricing.onSale && pricing.originalPrice ? (
          <>
            <span className="font-sans text-sm font-light text-ink-soft line-through">
              {formatProductInr(pricing.originalPrice)}
            </span>
            {pricing.savingsPercent != null && pricing.savingsPercent >= 1 ? (
              <span className="rounded-full border border-gold/25 bg-gold/8 px-2.5 py-0.5 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-gold">
                {pricing.savingsPercent}% off
              </span>
            ) : null}
          </>
        ) : null}
      </div>
      {size !== "compact" ? (
        <p className="font-sans text-[11px] font-light text-ink-soft">Tax included</p>
      ) : null}
    </div>
  );
}
