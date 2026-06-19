"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { stripUnsplashUrl } from "@/lib/strip-unsplash";
import type { CartLine } from "@/types";

function sanitizeCartLine(line: CartLine): CartLine {
  return { ...line, image: stripUnsplashUrl(line.image) };
}

// --- Types ---

type CartDataContextValue = {
  lines: CartLine[];
  coupon?: string;
  subtotal: number;
  addLine: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  updateQty: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  setCoupon: (code: string | undefined) => void;
  clear: () => void;
};

type CartUIContextValue = {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

// --- Contexts ---

const CartDataContext = createContext<CartDataContextValue | null>(null);
const CartUIContext = createContext<CartUIContextValue | null>(null);

// --- Helpers ---

const STORAGE_KEY = "naya_cart_v1";

export function lineKey(line: Pick<CartLine, "productId" | "sku">) {
  return `${line.productId}:${line.sku}`;
}

// --- Provider ---

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [coupon, setCoupon] = useState<string | undefined>();
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Ref so addLine can trigger drawer open without depending on UI state
  const openCartRef = useRef(() => setOpen(true));

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

  // --- UI actions (stable references) ---
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  // --- Data actions ---
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
      // Auto-open the cart drawer when adding an item
      openCartRef.current();
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

  // --- Memoized context values (separate to prevent cross-renders) ---
  const dataValue = useMemo<CartDataContextValue>(
    () => ({
      lines,
      coupon,
      subtotal,
      addLine,
      updateQty,
      removeLine,
      setCoupon,
      clear,
    }),
    [lines, coupon, subtotal, addLine, updateQty, removeLine, clear],
  );

  const uiValue = useMemo<CartUIContextValue>(
    () => ({ isOpen, openCart, closeCart }),
    [isOpen, openCart, closeCart],
  );

  return (
    <CartDataContext.Provider value={dataValue}>
      <CartUIContext.Provider value={uiValue}>
        {children}
      </CartUIContext.Provider>
    </CartDataContext.Provider>
  );
}

// --- Hooks ---

/** Cart data (lines, subtotal, coupon, mutations). Does NOT re-render on drawer open/close. */
export function useCartData() {
  const ctx = useContext(CartDataContext);
  if (!ctx) throw new Error("useCartData must be used within CartProvider");
  return ctx;
}

/** Cart UI state (isOpen, openCart, closeCart). Does NOT re-render on data changes. */
export function useCartUI() {
  const ctx = useContext(CartUIContext);
  if (!ctx) throw new Error("useCartUI must be used within CartProvider");
  return ctx;
}

/**
 * Legacy combined hook — returns both data and UI context merged.
 * Use useCartData() or useCartUI() directly for better performance.
 * @deprecated Prefer useCartData() / useCartUI() for granular subscriptions.
 */
export function useCart() {
  const data = useCartData();
  const ui = useCartUI();
  return { ...data, ...ui };
}
