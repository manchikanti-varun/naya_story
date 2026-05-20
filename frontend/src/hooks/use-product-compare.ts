"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isInCompareList,
  readCompareSlugs,
  toggleCompareSlug,
} from "@/lib/product-compare";

export function useProductCompare(slug: string) {
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

  const inCompare = mounted && isInCompareList(slug);

  const toggle = useCallback(() => {
    const result = toggleCompareSlug(slug);
    setSlugs(result.slugs);
    return result;
  }, [slug]);

  return { slugs, inCompare, toggle, mounted, count: slugs.length };
}
