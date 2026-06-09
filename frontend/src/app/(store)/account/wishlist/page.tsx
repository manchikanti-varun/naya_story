"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Product } from "@/types";
import { ProductCard } from "@/components/shop/ProductCard";

export default function WishlistPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const data = await apiFetch<{ products: Product[] }>("/users/wishlist", { token });
        setProducts(data.products);
      } catch {
        setProducts([]);
      }
    })();
  }, [token]);

  return (
    <div className="space-y-10 rounded-[32px] border border-ivory-deep bg-white/70 p-5 md:p-10 backdrop-blur">
      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Wishlist</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Saved reverie</h1>
      </div>
      {products.length === 0 ? (
        <p className="font-sans text-sm text-ink-muted">
          Tap the heart on any silhouette to keep it here.
        </p>
      ) : (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
