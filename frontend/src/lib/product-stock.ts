import type { Product } from "@/types";

/** Show urgency messaging when combined variant stock is below this count */
export const LIMITED_STOCK_THRESHOLD = 5;

export function getTotalProductStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + Math.max(0, v.stock ?? 0), 0);
}

export function isLimitedStock(totalStock: number): boolean {
  return totalStock > 0 && totalStock < LIMITED_STOCK_THRESHOLD;
}

/** Progress fill for the limited-stock bar (0–100) */
export function limitedStockBarFill(totalStock: number): number {
  if (totalStock <= 0) return 0;
  return Math.max(8, Math.min(100, Math.round((totalStock / LIMITED_STOCK_THRESHOLD) * 100)));
}

export function getStockForSize(product: Product, sizeName: string): number {
  return product.variants
    .filter((v) => v.size === sizeName)
    .reduce((sum, v) => sum + Math.max(0, v.stock ?? 0), 0);
}
