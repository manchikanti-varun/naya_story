"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          aria-label="Scroll to top"
          initial={{ opacity: 0, y: 18, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.95 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-5 z-[80] grid h-10 w-10 place-items-center rounded-full border border-ivory-deep/85 bg-[#f6f1e9]/96 text-ink/85 shadow-[0_10px_24px_-14px_rgba(44,40,37,0.4)] backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-gold/65 hover:bg-[#f3eadb] hover:text-gold md:bottom-8 md:right-8"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={1.55} />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
