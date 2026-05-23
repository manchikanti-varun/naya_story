"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";
import { cn } from "@/lib/cn";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

type Props = { open: boolean; onClose: () => void };

const RECENT_KEY = "naya_recent_searches";

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, 5);
  } catch {
    return [];
  }
}

function pushRecent(phrase: string) {
  if (typeof window === "undefined") return;
  const t = phrase.trim();
  if (!t) return;
  try {
    const prev = readRecent().filter((x) => x.toLowerCase() !== t.toLowerCase());
    const next = [t, ...prev].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function SearchPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  const refreshRecent = useCallback(() => setRecent(readRecent()), []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    refreshRecent();
  }, [open, refreshRecent]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        const data = await apiFetch<{ products: Product[] }>(
          `/products?limit=8&${params.toString()}`,
        );
        if (!cancelled) setProducts(data.products);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(run, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const trending = useMemo(() => ["Silk slip", "Evening drape", "Tailored coat"], []);

  const applyPhrase = (phrase: string) => {
    setQuery(phrase);
    pushRecent(phrase);
    refreshRecent();
  };

  const onPickProduct = () => {
    if (query.trim()) {
      pushRecent(query);
      refreshRecent();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-ink/18 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Search"
            className="fixed inset-0 z-[90] flex flex-col bg-[#F5F1EC]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end border-b border-ivory-deep/30 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-10">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2.5 text-ink-muted transition-colors duration-500 hover:bg-ivory-deep/40 hover:text-ink"
                aria-label="Close search"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            <div className="mx-auto w-full max-w-4xl shrink-0 px-5 pb-6 pt-8 md:px-10 md:pt-12">
              <p className="text-center font-sans text-[10px] font-light uppercase tracking-[0.38em] text-ink-soft">
                Search the collection
              </p>
              <div className="mt-6 flex items-end gap-4 border-b border-ivory-deep/45 pb-4 md:gap-5 md:pb-6">
                <Search
                  className="mb-1 h-6 w-6 shrink-0 text-gold/80 md:h-7 md:w-7"
                  strokeWidth={1.05}
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && query.trim()) {
                      pushRecent(query);
                      refreshRecent();
                    }
                  }}
                  placeholder="Silhouettes, fabrics, moods…"
                  className="min-w-0 flex-1 bg-transparent font-sans text-2xl font-light text-ink outline-none placeholder:text-ink-soft/70 md:text-3xl md:font-extralight"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-16 md:px-10">
              <div className="mx-auto grid max-w-4xl gap-12 pb-8 pt-4 md:grid-cols-[1fr_1.1fr] md:gap-16">
                <div className="space-y-10">
                  <div>
                    <p className="font-sans text-[10px] font-light uppercase tracking-[0.34em] text-ink-soft">
                      Trending searches
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {trending.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => applyPhrase(t)}
                          className="rounded-full border border-ivory-deep/60 bg-white/50 px-4 py-2.5 font-sans text-xs font-light text-ink-muted transition-all duration-500 hover:border-gold/40 hover:text-gold"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {recent.length > 0 ? (
                    <div>
                      <p className="font-sans text-[10px] font-light uppercase tracking-[0.34em] text-ink-soft">
                        Recent
                      </p>
                      <ul className="mt-3 space-y-2">
                        {recent.map((r) => (
                          <li key={r}>
                            <button
                              type="button"
                              onClick={() => setQuery(r)}
                              className="font-display text-xl font-light text-ink/80 transition-colors duration-500 hover:text-gold"
                            >
                              {r}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div>
                    <p className="font-sans text-[10px] font-light uppercase tracking-[0.34em] text-ink-soft">
                      Categories
                    </p>
                    <ul className="mt-3 space-y-2 font-display text-lg font-light text-ink-muted">
                      <li>
                        <Link
                          href="/collections?category=dresses"
                          onClick={onClose}
                          className="transition-colors duration-500 hover:text-gold"
                        >
                          Dresses
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/collections?category=tops"
                          onClick={onClose}
                          className="transition-colors duration-500 hover:text-gold"
                        >
                          Tops & shirts
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/collections?category=outerwear"
                          onClick={onClose}
                          className="transition-colors duration-500 hover:text-gold"
                        >
                          Outerwear
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <p className="font-sans text-[10px] font-light uppercase tracking-[0.34em] text-ink-soft">
                    {loading ? "Searching…" : "Suggestions"}
                  </p>
                  <ul className="mt-4 space-y-1">
                    {products.map((p) => (
                      <li key={p._id}>
                        <Link
                          href={`/products/${p.slug}`}
                          onClick={onPickProduct}
                          className="group flex gap-3 rounded-2xl border border-transparent p-2 transition-all duration-500 hover:border-ivory-deep/50 hover:bg-white/60"
                        >
                          <div
                            className={cn(
                              "relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-ivory-soft",
                              storefrontImageShellClass,
                            )}
                          >
                            {p.images[0]?.trim() ? (
                              <Image
                                src={p.images[0].trim()}
                                alt={p.name}
                                fill
                                className="object-cover transition duration-700 group-hover:scale-105"
                                sizes="56px"
                                {...storefrontImageProps}
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-display text-base font-normal text-ink transition-colors duration-500 group-hover:text-gold">
                              {p.name}
                            </p>
                            <p className="font-sans text-xs font-light uppercase tracking-[0.2em] text-ink-soft">
                              {p.category}
                            </p>
                            <p className="mt-1 font-sans text-sm font-light text-ink">
                              ₹{p.price.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                    {!loading && products.length === 0 ? (
                      <li className="font-sans text-sm font-light text-ink-muted">
                        No pieces matched — try a softer phrase.
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
