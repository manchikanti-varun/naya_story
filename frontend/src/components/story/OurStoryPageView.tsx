"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { HomepageConfig } from "@/types/homepage";
import { SITE_NAME } from "@/lib/constants";

type StorySection = HomepageConfig["ourStoryPage"]["sections"][number];

export function OurStoryPageView({ story }: { story: HomepageConfig["ourStoryPage"] }) {
  const sections = story.sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const get = (id: StorySection["id"]) => sections.find((s) => s.id === id);

  const philosophy = get("philosophy");
  const founder = get("founder");
  const editorial = get("editorial");
  const craft = get("craft");
  const manifesto = get("manifesto");
  const closing = get("closing");

  return (
    <div className="bg-ivory text-ink">
      <section className="relative min-h-[78vh] overflow-hidden md:min-h-[88vh]">
        <Image
          src={story.heroImage}
          alt={story.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/20" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative lux-shell flex min-h-[78vh] items-end pb-16 md:min-h-[88vh] md:pb-24"
        >
          <div className="max-w-3xl text-ivory">
            <p className="lux-kicker text-[#f0debd]">
              {SITE_NAME}
            </p>
            <h1 className="mt-5 font-display text-6xl leading-[0.9] md:text-8xl">{story.title}</h1>
            <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-[#f4ede1] md:text-lg">
              {story.subtitle}
            </p>
          </div>
        </motion.div>
      </section>

      {philosophy ? <TextImageSection section={philosophy} /> : null}
      {founder ? <TextImageSection section={founder} reverse /> : null}
      {editorial ? <EditorialGallery section={editorial} /> : null}
      {craft ? <TextImageSection section={craft} /> : null}
      {manifesto ? <ManifestoSection section={manifesto} /> : null}
      {closing ? (
        <section className="relative mt-10 overflow-hidden md:mt-16">
          {closing.image ? (
            <Image
              src={closing.image}
              alt={closing.imageAlt || closing.heading}
              width={1800}
              height={1200}
              sizes="100vw"
              className="h-[64vh] w-full object-cover md:h-[78vh]"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1500px] px-6 pb-12 md:px-10 md:pb-16">
            <div className="max-w-3xl text-[#f6f0e6]">
              <h2 className="font-display text-4xl leading-tight md:text-6xl">{closing.heading}</h2>
              <p className="mt-4 font-sans text-sm leading-relaxed md:text-base">{closing.body}</p>
              <Link
                href={story.ctaHref}
                className="mt-7 inline-flex items-center rounded-full border border-[#d3b37d] px-7 py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-[#f3e8d3] transition hover:bg-[#d3b37d]/20"
              >
                {story.ctaLabel}
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TextImageSection({ section, reverse = false }: { section: StorySection; reverse?: boolean }) {
  return (
    <section className="lux-shell py-20 md:py-28">
      <div className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-20 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="font-display text-4xl leading-tight text-ink md:text-5xl">{section.heading}</h2>
          <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-ink-muted">{section.body}</p>
          {section.secondaryBody ? (
            <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-ink-muted">
              {section.secondaryBody}
            </p>
          ) : null}
        </motion.div>
        {section.image ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/5] overflow-hidden rounded-[30px]"
          >
            <Image
              src={section.image}
              alt={section.imageAlt || section.heading}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}

function EditorialGallery({ section }: { section: StorySection }) {
  const gallery = section.gallery ?? [];
  if (gallery.length === 0) return null;
  return (
    <section className="py-8 md:py-14">
      <div className="mx-auto max-w-[1700px] px-0 md:px-2">
        <div className="columns-2 [column-gap:0] md:columns-3">
          {gallery.map((src, idx) => (
            <motion.div
              key={`${src}-${idx}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: idx * 0.05 }}
              className="break-inside-avoid"
            >
              <div className={`relative overflow-hidden ${idx % 3 === 0 ? "aspect-[4/6]" : idx % 3 === 1 ? "aspect-[3/4]" : "aspect-[5/6]"}`}>
                <Image src={src} alt={section.heading} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ManifestoSection({ section }: { section: StorySection }) {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-20 text-center md:px-10 md:py-28">
      <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold">Manifesto</p>
      <blockquote className="mt-6 font-display text-4xl leading-[1.1] text-ink md:text-6xl">
        {section.quote || section.body}
      </blockquote>
    </section>
  );
}
