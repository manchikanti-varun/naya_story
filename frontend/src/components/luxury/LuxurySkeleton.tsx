"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  aspect?: string;
};

export function LuxurySkeleton({ className, aspect = "aspect-[3/4]" }: Props) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-[24px] bg-ivory-soft",
        aspect,
        className,
      )}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}
