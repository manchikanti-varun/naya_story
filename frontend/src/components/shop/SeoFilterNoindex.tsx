"use client";

import { useSearchParams } from "next/navigation";

/**
 * Renders a <meta name="robots" content="noindex, follow"> tag when the
 * current URL has filter/search query parameters.
 *
 * This prevents search engines from indexing thousands of filter combinations
 * (e.g. /collections?category=dresses&size=M&color=black) as duplicate content.
 *
 * The "follow" directive ensures links on filtered pages are still crawled.
 *
 * Place this component inside pages that support filtering.
 */
const FILTER_PARAMS = new Set([
  "category", "size", "color", "minPrice", "maxPrice",
  "inStock", "sort", "q", "tab", "page",
]);

export function SeoFilterNoindex() {
  const params = useSearchParams();

  const hasFilters = Array.from(params.keys()).some((key) => FILTER_PARAMS.has(key));

  if (!hasFilters) return null;

  return <meta name="robots" content="noindex, follow" />;
}
