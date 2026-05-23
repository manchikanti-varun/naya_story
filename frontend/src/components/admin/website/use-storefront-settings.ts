"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";
import { mergeStorefrontSettings } from "@/lib/storefront-settings";
import type { StorefrontSettings } from "@/types/storefront-settings";

export function useStorefrontSettings() {
  const { token } = useAuth();
  const [storefront, setStorefront] = useState<StorefrontSettings | null>(null);
  const [committed, setCommitted] = useState<StorefrontSettings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await apiFetch<{ settings: { storefront?: StorefrontSettings } }>("/content/site", {
      token: token ?? undefined,
    });
    const merged = mergeStorefrontSettings(data.settings.storefront);
    setStorefront(structuredClone(merged));
    setCommitted(structuredClone(merged));
  }, [token]);

  useEffect(() => {
    void load().catch(() => {
      setStorefront(null);
      setCommitted(null);
    });
  }, [load]);

  const isDirty = useMemo(() => {
    if (!storefront || !committed) return false;
    try {
      return JSON.stringify(storefront) !== JSON.stringify(committed);
    } catch {
      return true;
    }
  }, [storefront, committed]);

  const save = async () => {
    if (!token || !storefront || saving) return;
    setMsg(null);
    setSaving(true);
    try {
      await apiFetch("/content/site", {
        method: "PATCH",
        token,
        body: JSON.stringify({ storefront }),
      });
      publishStorefrontSettingsChanged();
      setMsg("Saved — live on the storefront immediately.");
      await load();
    } catch {
      setMsg("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (!committed) return;
    setStorefront(structuredClone(committed));
    setMsg(null);
  };

  return {
    storefront,
    setStorefront,
    isDirty,
    saving,
    msg,
    save,
    discard,
    loading: !storefront,
  };
}
