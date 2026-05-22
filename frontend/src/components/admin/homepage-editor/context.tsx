"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { HomepageCmsMeta } from "@/types/cms-meta";
import type { CategoryCard, HeroSlide, HomepageConfig, SectionOrderEntry } from "@/types/homepage";
import {
  moveHomepageStorefrontBlock,
  withRefreshedLayoutBlocks,
} from "@/lib/homepage-layout-blocks";
import type { HomepageStorefrontBlockType } from "@/types/homepage";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";

export function sortSlides(slides: HeroSlide[]) {
  return [...slides].sort((a, b) => a.order - b.order);
}

export function sortSections(order: SectionOrderEntry[]) {
  return [...order].sort((a, b) => a.order - b.order);
}

type HomepageEditorContextValue = {
  hp: HomepageConfig | null;
  setHp: React.Dispatch<React.SetStateAction<HomepageConfig | null>>;
  /** Last saved copy from the server (baseline for discard / dirty). */
  committedHp: HomepageConfig | null;
  /** Server-side draft vs published (admin only). */
  cmsMeta: HomepageCmsMeta | null;
  isDirty: boolean;
  discardDraft: () => void;
  load: () => Promise<void>;
  save: () => Promise<void>;
  /** Promotes saved draft to live storefront homepage. */
  publish: () => Promise<void>;
  saving: boolean;
  msg: string | null;
  token: string | null;
  moveSlide: (index: number, dir: -1 | 1) => void;
  moveSection: (index: number, dir: -1 | 1) => void;
  moveStorefrontBlock: (type: HomepageStorefrontBlockType, dir: -1 | 1) => void;
  updateSlide: (id: string, patch: Partial<HeroSlide>) => void;
  updateCategory: (id: string, patch: Partial<CategoryCard>) => void;
  updateCollectionsCategory: (
    id: string,
    patch: Partial<HomepageConfig["collectionsPage"]["categories"][number]>,
  ) => void;
};

const HomepageEditorContext = createContext<HomepageEditorContextValue | null>(null);

export function HomepageEditorProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [hp, setHp] = useState<HomepageConfig | null>(null);
  const [committedHp, setCommittedHp] = useState<HomepageConfig | null>(null);
  const [cmsMeta, setCmsMeta] = useState<HomepageCmsMeta | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await apiFetch<{
      settings: { homepage: HomepageConfig; cms?: HomepageCmsMeta };
    }>("/content/site", { token: token ?? undefined });
    const next = data.settings.homepage;
    const snap = structuredClone(next);
    setHp(snap);
    setCommittedHp(structuredClone(next));
    setCmsMeta(data.settings.cms ?? null);
  }, [token]);

  useEffect(() => {
    void load().catch(() => {
      setHp(null);
      setCommittedHp(null);
      setCmsMeta(null);
    });
  }, [load]);

  const isDirty = useMemo(() => {
    if (!hp || !committedHp) return false;
    try {
      return JSON.stringify(hp) !== JSON.stringify(committedHp);
    } catch {
      return true;
    }
  }, [hp, committedHp]);

  const discardDraft = useCallback(() => {
    if (!committedHp) return;
    setHp(structuredClone(committedHp));
    setMsg(null);
  }, [committedHp]);

  const save = useCallback(async () => {
    if (!token || !hp || saving) return;
    setMsg(null);
    setSaving(true);
    try {
      await apiFetch("/content/site", {
        method: "PATCH",
        token,
        body: JSON.stringify({ homepage: hp }),
      });
      setMsg("Draft saved.");
      await load();
    } finally {
      setSaving(false);
    }
  }, [token, hp, load, saving]);

  const publish = useCallback(async () => {
    if (!token || saving) return;
    setMsg(null);
    setSaving(true);
    try {
      await apiFetch("/content/site/publish", { method: "POST", token });
      publishStorefrontSettingsChanged();
      setMsg("Published to storefront.");
      await load();
    } finally {
      setSaving(false);
    }
  }, [token, load, saving]);

  const moveSlide = useCallback((index: number, dir: -1 | 1) => {
    setHp((prev) => {
      if (!prev) return prev;
      const slides = sortSlides([...prev.carousel.slides]);
      const j = index + dir;
      if (j < 0 || j >= slides.length) return prev;
      const a = slides[index];
      const b = slides[j];
      const next = prev.carousel.slides.map((s) => {
        if (s.id === a.id) return { ...s, order: b.order };
        if (s.id === b.id) return { ...s, order: a.order };
        return s;
      });
      return {
        ...prev,
        carousel: { ...prev.carousel, slides: sortSlides(next) },
      };
    });
  }, []);

  const moveSection = useCallback((index: number, dir: -1 | 1) => {
    setHp((prev) => {
      if (!prev) return prev;
      const list = sortSections(prev.sectionsOrder);
      const entry = list[index];
      if (!entry) return prev;
      return moveHomepageStorefrontBlock(prev, entry.id, dir);
    });
  }, []);

  const moveStorefrontBlock = useCallback((type: HomepageStorefrontBlockType, dir: -1 | 1) => {
    setHp((prev) => {
      if (!prev) return prev;
      return moveHomepageStorefrontBlock(prev, type, dir);
    });
  }, []);

  const updateSlide = useCallback((id: string, patch: Partial<HeroSlide>) => {
    setHp((prev) => {
      if (!prev) return prev;
      return withRefreshedLayoutBlocks({
        ...prev,
        carousel: {
          ...prev.carousel,
          slides: prev.carousel.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        },
      });
    });
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<CategoryCard>) => {
    setHp((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: {
          ...prev.categories,
          items: prev.categories.items.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        },
      };
    });
  }, []);

  const updateCollectionsCategory = useCallback(
    (id: string, patch: Partial<HomepageConfig["collectionsPage"]["categories"][number]>) => {
      setHp((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          collectionsPage: {
            ...prev.collectionsPage,
            categories: prev.collectionsPage.categories.map((c) =>
              c.id === id ? { ...c, ...patch } : c,
            ),
          },
        };
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      hp,
      setHp,
      committedHp,
      cmsMeta,
      isDirty,
      discardDraft,
      load,
      save,
      publish,
      saving,
      msg,
      token,
      moveSlide,
      moveSection,
      moveStorefrontBlock,
      updateSlide,
      updateCategory,
      updateCollectionsCategory,
    }),
    [
      hp,
      committedHp,
      cmsMeta,
      isDirty,
      discardDraft,
      load,
      save,
      publish,
      saving,
      msg,
      token,
      moveSlide,
      moveSection,
      moveStorefrontBlock,
      updateSlide,
      updateCategory,
      updateCollectionsCategory,
    ],
  );

  return <HomepageEditorContext.Provider value={value}>{children}</HomepageEditorContext.Provider>;
}

export function useHomepageEditor() {
  const ctx = useContext(HomepageEditorContext);
  if (!ctx) throw new Error("useHomepageEditor must be used within HomepageEditorProvider");
  return ctx;
}

/** Returns null outside `HomepageEditorProvider` (e.g. optional CMS chrome). */
export function useHomepageEditorOptional() {
  return useContext(HomepageEditorContext);
}
