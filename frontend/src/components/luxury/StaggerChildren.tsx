"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
};

export function StaggerChildren({ children, className, itemClassName }: Props) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <motion.div className={className}>{children}</motion.div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={staggerContainer}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} className={itemClassName} variants={staggerItem}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
