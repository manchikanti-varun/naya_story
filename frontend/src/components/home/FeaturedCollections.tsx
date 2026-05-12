"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { COLLECTIONS } from "@/lib/constants";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function FeaturedCollections() {
  return (
    <section className="bg-ivory px-6 py-section md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">
              Featured collections
            </p>
            <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">
              Editorials in cloth
            </h2>
          </div>
          <Link
            href="/collections"
            className="self-start font-sans text-[11px] uppercase tracking-[0.28em] text-ink-muted underline-offset-8 hover:text-gold hover:underline"
          >
            View all
          </Link>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid gap-8 md:grid-cols-12 md:gap-6"
        >
          <motion.article
            variants={item}
            className="group relative overflow-hidden rounded-[28px] md:col-span-7 md:min-h-[520px]"
          >
            <Link href={`/collections?collection=${COLLECTIONS[0].slug}`}>
              <div className="relative aspect-[4/5] md:absolute md:inset-0 md:aspect-auto">
                <Image
                  src={COLLECTIONS[0].image}
                  alt={COLLECTIONS[0].title}
                  fill
                  className="object-cover transition duration-[1.4s] ease-out group-hover:scale-[1.06]"
                  sizes="(max-width:768px) 100vw, 58vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/10 to-transparent opacity-90 transition duration-700 group-hover:from-ink/75" />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-8 md:p-12">
                <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-ivory/80">
                  {COLLECTIONS[0].subtitle}
                </p>
                <h3 className="mt-3 font-display text-4xl text-ivory">{COLLECTIONS[0].title}</h3>
              </div>
            </Link>
          </motion.article>

          <div className="grid gap-6 md:col-span-5">
            {COLLECTIONS.slice(1).map((c, idx) => (
              <motion.article
                key={c.slug}
                variants={item}
                className={`group relative overflow-hidden rounded-[28px] ${
                  idx === 0 ? "md:min-h-[248px]" : "md:min-h-[248px]"
                }`}
              >
                <Link href={`/collections?collection=${c.slug}`}>
                  <div className="relative aspect-[16/11] md:absolute md:inset-0 md:aspect-auto">
                    <Image
                      src={c.image}
                      alt={c.title}
                      fill
                      className="object-cover transition duration-[1.4s] ease-out group-hover:scale-[1.05]"
                      sizes="(max-width:768px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-ink/55 via-transparent to-transparent opacity-90 transition duration-700 group-hover:from-ink/65" />
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-7">
                    <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-ivory/80">
                      {c.subtitle}
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-ivory">{c.title}</h3>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
