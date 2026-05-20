"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { LuxuryCursor } from "@/components/luxury/LuxuryCursor";

type Props = { children: React.ReactNode };

export function LuxuryProvider({ children }: Props) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const isStore =
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/login") &&
    pathname !== "/register";

  if (!isStore || reduced) {
    return <>{children}</>;
  }

  return (
    <>
      <LuxuryCursor />
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
