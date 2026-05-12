"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const shots = [
  {
    src: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=900&q=80",
    span: "md:col-span-7 md:row-span-2",
    aspect: "aspect-[4/5]",
  },
  {
    src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80",
    span: "md:col-span-5",
    aspect: "aspect-[16/11]",
  },
  {
    src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80",
    span: "md:col-span-5",
    aspect: "aspect-[16/11]",
  },
  {
    src: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a7?w=900&q=80",
    span: "md:col-span-12",
    aspect: "aspect-[21/9]",
  },
];

export function LookbookSection() {
  return (
    <section id="lookbook" className="bg-ivory px-6 py-section md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">
            Lookbook
          </p>
          <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">
            Campaign stills
          </h2>
          <p className="mt-4 font-sans text-sm leading-relaxed text-ink-muted md:text-base">
            A sequence of frames — light, negative space, and the arc of a sleeve.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-12">
          {shots.map((s, i) => (
            <motion.figure
              key={s.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.85, delay: i * 0.06 }}
              className={`group relative overflow-hidden rounded-[28px] bg-ivory-soft ${s.span}`}
            >
              <div className={`relative ${s.aspect} md:h-full`}>
                <Image
                  src={s.src}
                  alt=""
                  fill
                  className="object-cover transition duration-[1.4s] ease-out group-hover:scale-[1.04]"
                  sizes="(max-width:768px) 100vw, 80vw"
                />
                <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-700 group-hover:opacity-100 bg-gradient-to-t from-ink/35 to-transparent" />
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
