"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function BrandStory() {
  return (
    <section id="story" className="bg-ivory-soft px-6 py-section md:px-10">
      <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9 }}
          className="relative aspect-[4/5] overflow-hidden rounded-[32px]"
        >
          <Image
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80"
            alt="Atelier mood"
            fill
            className="object-cover"
            sizes="(max-width:1024px) 100vw, 50vw"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="space-y-8"
        >
          <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">
            Brand story
          </p>
          <h2 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] leading-tight text-ink">
            Studio-born,
            <br />
            silhouette-led.
          </h2>
          <p className="max-w-xl font-sans text-base leading-relaxed text-ink-muted md:text-lg">
            Naya Studio is a women&apos;s atelier devoted to calm luxury — garments that feel
            cinematic in stillness, engineered with tactile honesty and tailored grace.
          </p>
          <p className="max-w-xl font-sans text-base leading-relaxed text-ink-muted">
            We privilege cloth that breathes, seams that disappear, and palettes that echo ivory,
            warmth, and gold — an invitation to dress with intention.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
