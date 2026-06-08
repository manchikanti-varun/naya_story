import type { Product } from "@/types";

/** Show urgency messaging when combined variant stock is below this count */
export const LIMITED_STOCK_THRESHOLD = 5;

export function getTotalProductStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + Math.max(0, v.stock ?? 0), 0);
}

/**
 * Determines if limited-stock banner should show.
 * Only shows when admin explicitly sets lowStockDisplay to "show".
 */
export function isLimitedStock(
  totalStock: number,
  lowStockDisplay?: "show" | "hide",
): boolean {
  if (totalStock <= 0) return false;
  return lowStockDisplay === "show";
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
