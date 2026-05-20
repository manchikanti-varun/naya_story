"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Product } from "@/types";

export function useAdminProductCatalog() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<{ products: Product[] }>("/products?limit=500&sort=newest", { token });
      setProducts(data.products);
      setError(null);
    } catch {
      setProducts([]);
      setError("Could not load catalog.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byId = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p._id, p));
    return m;
  }, [products]);

  return { products, byId, loading, error, reload };
}
