"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { useIsCoarsePointer } from "@/lib/use-media-query";
import { cn } from "@/lib/cn";

type Props = {
  variant?: "primary" | "outline" | "ghost";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
};

const variants = {
  primary:
    "bg-ink text-ivory hover:bg-gold disabled:opacity-40",
  outline:
    "border border-ink/15 bg-transparent text-ink hover:border-gold hover:text-gold",
  ghost: "text-ink-muted hover:text-gold",
};

export function MagneticButton({
  children,
  className,
  variant = "primary",
  ...props
}: Props) {
  const reduced = useReducedMotion();
  const coarse = useIsCoarsePointer();
  const magnetic = !reduced && !coarse;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 280, damping: 22 });
  const springY = useSpring(y, { stiffness: 280, damping: 22 });

  return (
    <motion.button
      type="button"
      style={magnetic ? { x: springX, y: springY } : undefined}
      onMouseMove={
        magnetic
          ? (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              x.set((e.clientX - rect.left - rect.width / 2) * 0.12);
              y.set((e.clientY - rect.top - rect.height / 2) * 0.12);
            }
          : undefined
      }
      onMouseLeave={
        magnetic
          ? () => {
              x.set(0);
              y.set(0);
            }
          : undefined
      }
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center rounded-full px-8 py-3.5 font-sans text-[10px] font-light uppercase tracking-[0.26em] transition-colors duration-700 sm:px-10 sm:py-4 sm:text-[11px] sm:tracking-[0.3em]",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
