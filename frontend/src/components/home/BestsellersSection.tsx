"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";
import { ProductCard } from "@/components/shop/ProductCard";

export function BestsellersSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiFetch<{ products: Product[] }>(
          "/products?tag=bestseller&limit=8",
        );
        if (!cancelled) setProducts(data.products);
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-ivory-muted px-6 py-section md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">
              Bestsellers
            </p>
            <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">
              Quietly coveted
            </h2>
          </div>
          <p className="max-w-md font-sans text-sm leading-relaxed text-ink-muted">
            Pieces that return season after season — chosen for drape, proportion, and ease.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
        >
          {products.map((p) => (
            <motion.div
              key={p._id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
              }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
