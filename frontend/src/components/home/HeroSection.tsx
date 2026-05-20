"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { SITE_NAME } from "@/lib/constants";

export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden bg-ink">
      <motion.div style={{ y }} className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1920&q=85"
          alt={`${SITE_NAME} hero`}
          fill
          priority
          className="object-cover opacity-90 animate-slow-zoom"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/35 to-ivory/90" />
      </motion.div>

      <div className="lux-shell relative z-10 flex min-h-[100svh] flex-col justify-end pb-24 pt-32 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] as const }}
          className="max-w-3xl text-balance"
        >
          <p className="font-sans text-[11px] uppercase tracking-[0.42em] text-ivory/80">
            {SITE_NAME}
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.75rem,7vw,5rem)] font-normal leading-[1.05] text-ivory">
            Timeless silhouettes for modern femininity.
          </h1>
          <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-ivory/85 md:text-lg">
            An editorial rhythm of fabric and form — minimal, cinematic, unhurried.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/collections"
              className="rounded-full bg-gold px-10 py-4 font-sans text-[11px] uppercase tracking-[0.32em] text-white transition-transform hover:scale-[1.02]"
            >
              Shop collection
            </Link>
            <Link
              href="/collections?collection=new-arrivals"
              className="rounded-full border border-ivory/50 px-10 py-4 font-sans text-[11px] uppercase tracking-[0.32em] text-ivory transition-colors hover:border-gold hover:text-gold"
            >
              New arrivals
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
