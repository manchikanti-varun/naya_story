import { cache } from "react";
import type { Metadata } from "next";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { SITE_NAME } from "@/lib/constants";
import { fetchApi } from "@/lib/server-fetch";
import { getSiteUrl } from "@/lib/site-url";
import { buildProductJsonLd } from "@/lib/seo-product-jsonld";
import type { Product } from "@/types";

type Props = { params: Promise<{ slug: string }> };

async function loadProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetchApi(`/api/products/slug/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { product: Product };
    return data.product ?? null;
  } catch {
    return null;
  }
}

const getProductCached = cache(async (slug: string) => loadProduct(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductCached(slug);
  const base = getSiteUrl();
  if (!product) {
    return { title: `Product · ${SITE_NAME}` };
  }
  const canonical = `${base}/products/${encodeURIComponent(product.slug)}`;
  const desc = (product.shortDescription ?? product.description ?? "").slice(0, 160);
  const ogImage = product.images?.[0];
  return {
    title: product.name,
    description: desc || undefined,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: product.name,
      description: desc || undefined,
      siteName: SITE_NAME,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: desc || undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductCached(slug);
  const siteUrl = getSiteUrl();
  const jsonLd = product ? buildProductJsonLd(product, siteUrl) : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <ProductDetail slug={slug} />
    </>
  );
}
