"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const tiles = [
  "https://images.unsplash.com/photo-1496747611176-843222ebc4d2?w=600&q=80",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
  "https://images.unsplash.com/photo-1525507119028-ed4c629a60a7?w=600&q=80",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
];

export function SocialSection() {
  return (
    <section className="bg-ivory px-6 py-section md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">
              @nayastudio
            </p>
            <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">
              In the wild
            </h2>
          </div>
          <Link
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="font-sans text-[11px] uppercase tracking-[0.28em] text-ink-muted underline-offset-8 hover:text-gold hover:underline"
          >
            Follow along
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5">
          {tiles.map((src, i) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: i * 0.05 }}
              className="group relative aspect-square overflow-hidden rounded-[24px] bg-ivory-soft"
            >
              <Link href="https://instagram.com" target="_blank" rel="noreferrer">
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover transition duration-[1.2s] ease-out group-hover:scale-[1.06]"
                  sizes="(max-width:768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-ink/0 transition duration-500 group-hover:bg-ink/25" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
