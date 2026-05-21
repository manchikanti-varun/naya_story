"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Check, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { MediaAsset } from "@/types";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, asset: MediaAsset) => void;
  token: string;
  title?: string;
};

export function MediaLibraryPicker({ open, onClose, onSelect, token, title = "Media library" }: Props) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (q.trim()) params.set("q", q.trim());
      const data = await apiFetch<{ items: MediaAsset[] }>(`/media?${params.toString()}`, { token });
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, q]);

  useEffect(() => {
    if (!open) return;
    setPickedId(null);
    const t = setTimeout(() => {
      void load();
    }, 220);
    return () => clearTimeout(t);
  }, [open, load]);

  const pick = (asset: MediaAsset) => {
    setPickedId(asset._id);
    onSelect(asset.url, asset);
    onClose();
  };

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title={title}
      description="Click an image to insert its URL into the field you were editing."
      size="xl"
    >
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]"
          aria-hidden
        />
        <AdminInput
          className="pl-9"
          placeholder="Search by name or tags…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="py-12 text-center font-sans text-sm text-[var(--admin-muted)]">Loading assets…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--admin-border)] py-12 text-center font-sans text-sm text-[var(--admin-muted)]">
          No images in the library yet. Upload one from Admin → Media first.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              className={cn(
                "group relative overflow-hidden rounded-[var(--admin-radius-sm)] border text-left transition",
                pickedId === item._id
                  ? "border-[var(--admin-accent)] ring-2 ring-[var(--admin-accent)]/30"
                  : "border-[var(--admin-border)] hover:border-[var(--admin-border-strong)] hover:shadow-sm",
              )}
              onClick={() => pick(item)}
            >
              <div className="relative aspect-[4/3] bg-[var(--admin-surface-raised)]">
                <Image src={item.url} alt={item.name} fill className="object-cover" sizes="200px" unoptimized />
                <span className="absolute inset-0 flex items-center justify-center bg-[var(--admin-ink)]/0 opacity-0 transition group-hover:bg-[var(--admin-ink)]/25 group-hover:opacity-100">
                  <Check className="h-8 w-8 text-white" strokeWidth={1.5} />
                </span>
              </div>
              <div className="space-y-0.5 p-2.5">
                <p className="truncate font-sans text-xs font-medium text-[var(--admin-ink)]">{item.name}</p>
                {item.category ? (
                  <p className="font-sans text-[10px] uppercase tracking-[0.14em] text-[var(--admin-faint)]">
                    {item.category}
                  </p>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}
    </AdminDrawer>
  );
}
