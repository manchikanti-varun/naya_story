"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isInCompareList,
  readCompareSlugs,
  toggleCompareSlug,
} from "@/lib/product-compare";

function useCompareSync() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const sync = useCallback(() => {
    setSlugs(readCompareSlugs());
  }, []);

  useEffect(() => {
    setMounted(true);
    sync();
    const onChange = () => sync();
    window.addEventListener("naya-compare-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("naya-compare-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [sync]);

  return { slugs, mounted, sync };
}

/** Compare list for header / compare page (no product slug). */
export function useCompareList() {
  const { slugs, mounted } = useCompareSync();
  return { slugs, mounted, count: slugs.length };
}

export function useProductCompare(slug: string) {
  const { slugs, mounted, sync } = useCompareSync();

  const inCompare = mounted && isInCompareList(slug);

  const toggle = useCallback(() => {
    const result = toggleCompareSlug(slug);
    sync();
    return result;
  }, [slug, sync]);

  return { slugs, inCompare, toggle, mounted, count: slugs.length };
}
