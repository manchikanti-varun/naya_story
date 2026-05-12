"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const DEFAULT = {
  title: "Letters from the studio",
  description:
    "Quiet announcements — new drops, private previews, and notes on fabric.",
  placeholder: "Email address",
  buttonLabel: "Join",
};

type Props = {
  dense?: boolean;
  /** Centered editorial stack for homepage band */
  layout?: "split" | "centered";
  title?: string;
  description?: string;
  placeholder?: string;
  buttonLabel?: string;
};

export function NewsletterInline({
  dense,
  layout = "split",
  title,
  description,
  placeholder,
  buttonLabel,
}: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const t = title?.trim() || DEFAULT.title;
  const d = description?.trim() || DEFAULT.description;
  const ph = placeholder?.trim() || DEFAULT.placeholder;
  const btn = buttonLabel?.trim() || DEFAULT.buttonLabel;

  const centered = layout === "centered";

  return (
    <div
      className={
        dense
          ? ""
          : "rounded-[32px] border border-ivory-deep/60 bg-ivory-muted/35 p-8 md:p-10"
      }
    >
      <div
        className={
          centered
            ? "mx-auto flex max-w-lg flex-col items-center gap-10 text-center"
            : "flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
        }
      >
        <div className={centered ? "max-w-md" : "max-w-md"}>
          <p className="font-sans text-[10px] font-light uppercase tracking-[0.36em] text-gold/90">
            Newsletter
          </p>
          <h3 className="mt-4 font-display text-3xl font-normal tracking-[-0.02em] text-ink md:text-[2.35rem]">
            {t}
          </h3>
          <p className="mt-4 font-sans text-sm font-light leading-relaxed text-ink-muted md:text-[15px]">
            {d}
          </p>
        </div>
        <form
          className={
            centered
              ? "flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-stretch"
              : "flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center"
          }
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            setSent(true);
            setEmail("");
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={ph}
            className="flex-1 rounded-full border border-ivory-deep/70 bg-white/90 px-5 py-3.5 font-sans text-sm font-light text-ink outline-none ring-gold/25 placeholder:text-ink-soft/80 focus:ring-2"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            type="submit"
            className="rounded-full border border-transparent bg-ink px-8 py-3.5 font-sans text-[11px] font-light uppercase tracking-[0.28em] text-ivory transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold/40 hover:bg-gold hover:text-white"
          >
            {btn}
          </motion.button>
        </form>
      </div>
      {sent ? (
        <p
          className={
            centered
              ? "mt-8 text-center font-sans text-xs font-light text-gold"
              : "mt-4 font-sans text-xs font-light text-gold"
          }
        >
          Thank you — your invitation is on its way.
        </p>
      ) : null}
    </div>
  );
}
