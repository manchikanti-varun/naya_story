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
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

type Props = {
  product: Product;
  className?: string;
  badge?: "bestseller" | "new" | "latest";
};

export function ProductCard({ product, className, badge }: Props) {
  const [hovered, setHovered] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const { token, wishlistIds, updateWishlistLocal } = useAuth();
  const secondImage = product.images[1];
  const primary = product.images[0];
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div
          className={cn(
            "relative aspect-[3/4] overflow-hidden rounded-[24px] bg-ivory-soft",
            storefrontImageShellClass,
          )}
        >
          {primary ? (
            <Image
              src={primary}
              alt={product.name}
              fill
              loading="lazy"
              sizes="(max-width:768px) 50vw, 25vw"
              className={cn(
                "object-cover transition duration-[1.35s] ease-out",
                secondImage && hovered ? "scale-[1.03] opacity-0" : "scale-100 opacity-100",
              )}
              {...storefrontImageProps}
            />
          ) : null}
          {secondImage ? (
            <Image
              src={secondImage}
              alt=""
              fill
              loading="lazy"
              sizes="(max-width:768px) 50vw, 25vw"
              className={cn(
                "object-cover transition duration-[1.35s] ease-out",
                hovered ? "scale-[1.03] opacity-100" : "opacity-0",
              )}
              {...storefrontImageProps}
            />
          ) : null}
          {badge ? (
            <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-ivory/55 bg-ink/30 px-3 py-1 font-sans text-[9px] font-light uppercase tracking-[0.22em] text-ivory/95 backdrop-blur-sm">
              {badge === "bestseller"
                ? "Best seller"
                : badge === "latest"
                  ? "Latest drop"
                  : "New"}
            </span>
          ) : null}
          <div className="absolute right-4 top-4 z-[1] flex translate-y-1 gap-2 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickOpen(true);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-sm backdrop-blur transition duration-500 hover:bg-black/85"
              aria-label="Quick view"
            >
              <Eye className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={toggleWishlist}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-sm backdrop-blur transition duration-500 hover:bg-black/85"
              aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={cn("h-5 w-5", liked ? "fill-gold text-gold" : "text-white")}
                strokeWidth={1.25}
              />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/35 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        </div>
        <div className="mt-5 space-y-2">
          <h3 className="font-display text-xl text-ink transition-colors group-hover:text-gold">
            {product.name}
          </h3>
          <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            {product.category}
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-sans text-sm tracking-wide text-ink">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="font-sans text-xs text-ink-soft line-through">
                ₹{product.compareAtPrice.toLocaleString("en-IN")}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      <QuickViewModal product={product} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </motion.article>
  );
}
