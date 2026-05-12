"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryCard } from "@/types/homepage";

type Props = {
  title: string;
  subtitle: string;
  items: CategoryCard[];
  cta?: { label: string; href: string };
  compactTop?: boolean;
};

export function ShopByCategorySection({ title, subtitle, items, cta, compactTop = false }: Props) {
  const visible = [...items]
    .filter((c) => c.enabled)
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);

  return (
    <section
      className={`bg-ivory-muted/60 px-6 ${compactTop ? "pt-10 pb-section md:pt-14" : "py-section"} md:px-10 lg:px-12`}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-sans text-[10px] font-light uppercase tracking-[0.36em] text-gold/90">
            Explore
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.85rem,3.5vw,2.75rem)] font-normal tracking-[-0.02em] text-ink">
            {title}
          </h2>
          <p className="mt-4 font-sans text-sm font-light leading-relaxed text-ink-muted md:text-[15px]">
            {subtitle}
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
          {visible.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.95, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={cat.href || "/collections"}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[28px] bg-ivory-soft md:aspect-[3/4.2]"
              >
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    loading="lazy"
                    className="object-cover object-center transition duration-[1.6s] ease-out group-hover:scale-[1.07]"
                    sizes="(max-width:768px) 50vw, 33vw"
                    unoptimized={
                      !cat.image.includes("images.unsplash.com") &&
                      !cat.image.includes("res.cloudinary.com")
                    }
                  />
                ) : null}
                <div className="absolute inset-0 bg-ink/20 transition duration-700 ease-out group-hover:bg-ink/48" />
                <div className="absolute inset-0 flex items-end justify-start p-7 pb-9 md:p-9 md:pb-11">
                  <span className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-normal leading-tight tracking-[-0.02em] text-ivory opacity-0 translate-y-3 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100">
                    {cat.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        {cta ? (
          <div className="mt-12 flex justify-center">
            <Link
              href={cta.href}
              className="rounded-full border border-ivory-deep/80 bg-transparent px-8 py-3 font-sans text-[11px] uppercase tracking-[0.24em] text-ink transition-all duration-500 hover:border-gold hover:text-gold"
            >
              {cta.label}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
