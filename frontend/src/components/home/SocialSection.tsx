"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

const TILE_COUNT = 6;

export function SocialSection() {
  return (
    <section className="bg-ivory py-section">
      <div className="lux-shell-wide">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">
              @nayastory
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
          {Array.from({ length: TILE_COUNT }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: i * 0.05 }}
              className="group relative aspect-square overflow-hidden rounded-[24px] bg-ivory-soft"
            >
              <Link href="https://instagram.com" target="_blank" rel="noreferrer" className="absolute inset-0">
                <MediaPlaceholder label="Instagram" />
                <div className="absolute inset-0 bg-ink/0 transition duration-500 group-hover:bg-ink/25" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
