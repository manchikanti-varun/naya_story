import type { Variants, Transition } from "framer-motion";
import { luxuryDurations, luxuryEase } from "@/lib/luxury/design-tokens";

export const transitionLuxury: Transition = {
  duration: luxuryDurations.base,
  ease: luxuryEase,
};

export const transitionCinematic: Transition = {
  duration: luxuryDurations.cinematic,
  ease: luxuryEase,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionCinematic,
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitionLuxury,
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionCinematic,
  },
};

export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 1.04 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: luxuryDurations.hero, ease: luxuryEase },
  },
};

export const drawerSlide: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { type: "spring", damping: 32, stiffness: 280 },
  },
  exit: {
    x: "100%",
    transition: { duration: luxuryDurations.fast, ease: luxuryEase },
  },
};

export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: luxuryDurations.fast } },
  exit: { opacity: 0, transition: { duration: luxuryDurations.fast } },
};

export const accordionContent: Variants = {
  collapsed: { height: 0, opacity: 0 },
  open: {
    height: "auto",
    opacity: 1,
    transition: { duration: luxuryDurations.base, ease: luxuryEase },
  },
};
