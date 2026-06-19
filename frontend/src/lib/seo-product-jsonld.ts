import type { Product } from "@/types";
import { SITE_NAME } from "@/lib/constants";

export type ProductReviewStats = {
  averageRating: number;
  totalCount: number;
};

/** Google Merchant / schema.org Product JSON-LD for PDP. */
export function buildProductJsonLd(
  product: Product,
  siteUrl: string,
  reviewStats?: ProductReviewStats | null,
): Record<string, unknown> {
  const url = `${siteUrl.replace(/\/$/, "")}/products/${encodeURIComponent(product.slug)}`;
  const images = (product.images ?? []).filter(Boolean);
  const offers =
    typeof product.price === "number"
      ? {
          "@type": "Offer",
          url,
          priceCurrency: "INR",
          price: product.price,
          availability:
            product.variants?.some((v) => v.stock > 0)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        }
      : undefined;

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl.replace(/\/$/, "") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${siteUrl.replace(/\/$/, "")}/collections`,
      },
      ...(product.category
        ? [{
            "@type": "ListItem",
            position: 3,
            name: product.category,
            item: `${siteUrl.replace(/\/$/, "")}/collections?category=${encodeURIComponent(product.category)}`,
          }]
        : []),
      {
        "@type": "ListItem",
        position: product.category ? 4 : 3,
        name: product.name,
        item: url,
      },
    ],
  };

  const productNode: Record<string, unknown> = {
    "@type": "Product",
    name: product.name,
    description: (product.shortDescription ?? product.description ?? "").slice(0, 5000),
    image: images.length ? images : undefined,
    sku: product.variants?.[0]?.sku,
    brand: { "@type": "Brand", name: SITE_NAME },
    url,
    ...(product.category ? { category: product.category } : {}),
    ...(product.material ? { material: product.material } : {}),
    ...(offers ? { offers } : {}),
  };

  // Aggregate rating (from approved reviews)
  if (reviewStats && reviewStats.totalCount > 0 && reviewStats.averageRating > 0) {
    productNode.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewStats.averageRating,
      reviewCount: reviewStats.totalCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [productNode, breadcrumb],
  };
}
