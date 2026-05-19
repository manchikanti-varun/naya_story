"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { STOREFRONT_SETTINGS_CHANNEL } from "@/lib/storefront-live-sync";
import { storefrontThemeCssString, updateDocumentStorefrontThemeCss } from "@/lib/storefront-theme";
import type { StorefrontTheme } from "@/types/homepage";

const STORAGE_REV_KEY = "naya_store_rev";

async function pullThemeAndRefresh(router: ReturnType<typeof useRouter>) {
  try {
    const res = await fetch(`${API_BASE}/content/site`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { settings?: { homepage?: { theme?: StorefrontTheme } } };
      const theme = data.settings?.homepage?.theme;
      updateDocumentStorefrontThemeCss(storefrontThemeCssString(theme));
    }
  } catch {
    /* ignore */
  } finally {
    router.refresh();
  }
}

export function StorefrontLiveSync() {
  const router = useRouter();

  const onInvalidate = useCallback(() => {
    void pullThemeAndRefresh(router);
  }, [router]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(STOREFRONT_SETTINGS_CHANNEL);
    bc.onmessage = () => onInvalidate();
    return () => bc.close();
  }, [onInvalidate]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_REV_KEY && e.newValue) onInvalidate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [onInvalidate]);

  return null;
}
