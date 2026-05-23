"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { stripUnsplashUrl } from "@/lib/strip-unsplash";
import type { CartLine } from "@/types";

function sanitizeCartLine(line: CartLine): CartLine {
  return { ...line, image: stripUnsplashUrl(line.image) };
}

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  coupon?: string;
  openCart: () => void;
  closeCart: () => void;
  addLine: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  updateQty: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  setCoupon: (code: string | undefined) => void;
  subtotal: number;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "naya_cart_v1";

export function lineKey(line: Pick<CartLine, "productId" | "sku">) {
  return `${line.productId}:${line.sku}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [coupon, setCoupon] = useState<string | undefined>();
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { lines: CartLine[]; coupon?: string };
        setLines((parsed.lines ?? []).map(sanitizeCartLine));
        setCoupon(parsed.coupon);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, coupon }));
  }, [lines, coupon, hydrated]);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const addLine = useCallback(
    (input: Omit<CartLine, "quantity"> & { quantity?: number }) => {
      const qty = input.quantity ?? 1;
      setLines((prev) => {
        const key = lineKey(input);
        const idx = prev.findIndex((l) => lineKey(l) === key);
        if (idx === -1) {
          return [...prev, sanitizeCartLine({ ...input, quantity: qty })];
        }
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      });
      setOpen(true);
    },
    [],
  );

  const updateQty = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) => (lineKey(l) === key ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setCoupon(undefined);
  }, []);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      isOpen,
      coupon,
      openCart,
      closeCart,
      addLine,
      updateQty,
      removeLine,
      setCoupon,
      subtotal,
      clear,
    }),
    [
      lines,
      isOpen,
      coupon,
      openCart,
      closeCart,
      addLine,
      updateQty,
      removeLine,
      subtotal,
      clear,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
