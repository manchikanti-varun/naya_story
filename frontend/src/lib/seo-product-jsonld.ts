import type { Product } from "@/types";
import { SITE_NAME } from "@/lib/constants";

/** Google Merchant / schema.org Product JSON-LD for PDP. */
export function buildProductJsonLd(product: Product, siteUrl: string): Record<string, unknown> {
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
      { "@type": "ListItem", position: 3, name: product.name, item: url },
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
    ...(offers ? { offers } : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [productNode, breadcrumb],
  };
}
