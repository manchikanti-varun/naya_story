import type { Product } from "@/types";

export type ProductPriceDisplay = {
  currentPrice: number;
  originalPrice?: number;
  savingsPercent?: number;
  onSale: boolean;
};

type PriceFields = Pick<Product, "price" | "compareAtPrice" | "discountPercent">;

/** Storefront price: honors compare-at, discount %, or both. */
export function getProductPriceDisplay(product: PriceFields): ProductPriceDisplay {
  const currentPrice = product.price;
  const discountPct = Math.max(0, Number(product.discountPercent) || 0);
  let originalPrice =
    product.compareAtPrice != null && product.compareAtPrice > 0
      ? product.compareAtPrice
      : undefined;

  if (discountPct >= 1) {
    const derived = Math.round(currentPrice / (1 - discountPct / 100));
    if (!originalPrice || originalPrice <= currentPrice) {
      originalPrice = derived;
    }
  }

  if (originalPrice && originalPrice > currentPrice) {
    const fromPrices = Math.round(
      ((originalPrice - currentPrice) / originalPrice) * 100,
    );
    const savingsPercent =
      discountPct >= 1 ? Math.round(discountPct) : fromPrices;

    return {
      currentPrice,
      originalPrice,
      savingsPercent: savingsPercent >= 1 ? savingsPercent : undefined,
      onSale: true,
    };
  }

  return { currentPrice, onSale: false };
}

export function formatProductInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
