/**
 * Image alt text generators for SEO and accessibility.
 *
 * Usage:
 *   import { productImageAlt, categoryImageAlt } from "@/lib/image-alt";
 *
 *   <Image alt={productImageAlt(product.name, index, caption)} ... />
 *   <Image alt={categoryImageAlt(categoryName)} ... />
 */

import { SITE_NAME } from "@/lib/constants";

/**
 * Generate descriptive alt text for a product gallery image.
 * Falls back to a useful generic description if no caption is provided.
 */
export function productImageAlt(
  productName: string,
  imageIndex?: number,
  caption?: string | null,
): string {
  if (caption?.trim()) {
    return `${productName} — ${caption.trim()}`;
  }
  if (imageIndex === 0 || imageIndex === undefined) {
    return productName;
  }
  return `${productName} — view ${imageIndex + 1}`;
}

/**
 * Generate alt text for a category/collection card image.
 */
export function categoryImageAlt(categoryName: string): string {
  return `${categoryName} collection — ${SITE_NAME}`;
}

/**
 * Generate alt text for a hero/banner image.
 */
export function heroImageAlt(heading?: string, slideIndex?: number): string {
  if (heading?.trim()) {
    return heading.trim();
  }
  return slideIndex !== undefined
    ? `${SITE_NAME} — featured look ${slideIndex + 1}`
    : `${SITE_NAME} — featured collection`;
}

/**
 * Generate alt text for editorial/lookbook images.
 */
export function editorialImageAlt(sectionName: string, description?: string): string {
  if (description?.trim()) {
    return `${sectionName} — ${description.trim()}`;
  }
  return `${SITE_NAME} ${sectionName}`;
}

/**
 * Fallback: ensure an alt attribute is never empty.
 * Pass this as a default when the source might be undefined.
 */
export function safeAlt(alt: string | undefined | null, fallback = ""): string {
  const trimmed = alt?.trim();
  return trimmed || fallback;
}
