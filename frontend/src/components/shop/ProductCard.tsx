"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";
import { cn } from "@/lib/cn";
import { QuickViewModal } from "@/components/shop/QuickViewModal";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { isNextImageSrc } from "@/lib/image-src";
import { ProductPriceDisplay } from "@/components/shop/ProductPriceDisplay";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

type Props = {
  product: Product;
  className?: string;
  badge?: "bestseller" | "new" | "latest";
};

export function ProductCard({ product, className, badge }: Props) {
  const [quickOpen, setQuickOpen] = useState(false);
  const { token, wishlistIds, updateWishlistLocal } = useAuth();
  const primary = product.images[0]?.trim();
  const liked = useMemo(
    () => Boolean(wishlistIds.includes(product._id)),
    [wishlistIds, product._id],
  );

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (token) {
        await apiFetch<{ wishlist: string[] }>("/users/wishlist", {
          method: "PATCH",
          token,
          body: JSON.stringify({ productId: product._id }),
        });
      }
      updateWishlistLocal(product._id, !liked);
    } catch {
      updateWishlistLocal(product._id, !liked);
    }
  };

  return (
    <motion.article
      layout
      className={cn("group", className)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className={cn("lux-product-frame", storefrontImageShellClass)}>
          {isNextImageSrc(primary) ? (
            <Image
              src={primary}
              alt={product.name}
              fill
              loading="lazy"
              sizes="(max-width:768px) 50vw, 25vw"
              className="lux-image-zoom object-cover"
              {...storefrontImageProps}
            />
          ) : (
            <MediaPlaceholder />
          )}
          {badge ? (
            <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-[rgb(245_241_236/0.55)] bg-[rgb(44_40_37/0.3)] px-3 py-1 font-sans text-[9px] font-light uppercase tracking-[0.22em] text-[rgb(245_241_236/0.95)] backdrop-blur-sm">
              {badge === "bestseller"
                ? "Best seller"
                : badge === "latest"
                  ? "Latest drop"
                  : "New"}
            </span>
          ) : null}
          <div className="absolute right-3 top-3 z-[1] flex gap-2 opacity-100 transition duration-500 sm:right-4 sm:top-4 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickOpen(true);
              }}
              className="lux-card-action h-11 w-11"
              aria-label="Quick view"
            >
              <Eye className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={toggleWishlist}
              className="lux-card-action h-11 w-11"
              aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={cn("h-5 w-5", liked ? "fill-gold text-gold" : "text-white")}
                strokeWidth={1.25}
              />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgb(44_40_37/0.35)] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        </div>
        <div className="mt-3 space-y-1.5">
          <h3 className="lux-product-name">{product.name}</h3>
          <p className="lux-product-meta">{product.category}</p>
          <ProductPriceDisplay product={product} size="compact" />
        </div>
      </Link>
      <QuickViewModal product={product} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </motion.article>
  );
}
