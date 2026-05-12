"use client";

import { motion } from "framer-motion";

const quotes = [
  {
    text: "It feels like wearing stillness — tailored without theatrics.",
    name: "Amelia K.",
    locale: "London",
  },
  {
    text: "The drape is cinematic. I reach for these pieces on evenings that matter.",
    name: "Rhea S.",
    locale: "Mumbai",
  },
  {
    text: "Luxury that whispers. The fabric speaks before you do.",
    name: "Noor A.",
    locale: "Dubai",
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-ivory-muted px-6 py-section md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="max-w-xl">
          <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">
            Testimonials
          </p>
          <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">
            Voices, softly spoken
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {quotes.map((q) => (
            <motion.blockquote
              key={q.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75 }}
              className="rounded-[28px] border border-ivory-deep bg-white/70 p-8 shadow-sm backdrop-blur"
            >
              <p className="font-display text-xl leading-snug text-ink">&ldquo;{q.text}&rdquo;</p>
              <footer className="mt-8 font-sans text-[11px] uppercase tracking-[0.22em] text-ink-soft">
                {q.name}
                <span className="mx-2 text-gold">·</span>
                {q.locale}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
