"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  delay?: number;
};

export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: Props) {
  const reduced = useReducedMotion();
  const Comp =
    as === "section" ? motion.section : as === "article" ? motion.article : motion.div;

  if (reduced) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <Comp
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: fadeUp.hidden,
        visible: {
          ...fadeUp.visible,
          transition: {
            ...(typeof fadeUp.visible === "object" && "transition" in fadeUp.visible
              ? fadeUp.visible.transition
              : {}),
            delay,
          },
        },
      }}
    >
      {children}
    </Comp>
  );
}
