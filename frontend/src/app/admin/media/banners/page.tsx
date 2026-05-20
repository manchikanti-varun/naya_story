"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { MediaAsset } from "@/types";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

const BANNER_CATEGORIES = ["banner", "homepage", "campaign"];

export default function AdminMediaBannersPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<MediaAsset[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    const params = new URLSearchParams();
    params.set("limit", "120");
    const rows: MediaAsset[] = [];
    for (const cat of BANNER_CATEGORIES) {
      const p = new URLSearchParams(params);
      p.set("category", cat);
      const data = await apiFetch<{ items: MediaAsset[] }>(`/media?${p.toString()}`, { token });
      rows.push(...data.items);
    }
    const seen = new Set<string>();
    setItems(rows.filter((x) => (seen.has(x._id) ? false : (seen.add(x._id), true))));
  }, [token]);

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-faint)]">
          Media
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">Banner library</h1>
        <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Assets tagged <code className="rounded bg-[var(--admin-surface-raised)] px-1 py-0.5 text-xs">banner</code>,{" "}
          <code className="rounded bg-[var(--admin-surface-raised)] px-1 py-0.5 text-xs">homepage</code>, or{" "}
          <code className="rounded bg-[var(--admin-surface-raised)] px-1 py-0.5 text-xs">campaign</code>. Upload or edit in the full{" "}
          <Link href="/admin/media" className="font-medium text-[var(--admin-accent)] underline-offset-4 hover:underline">
            media library
          </Link>
          — saves sync to the storefront automatically.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="font-sans text-sm text-[var(--admin-muted)]">No banner-tagged assets yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((a) => (
            <li key={a._id} className="admin-surface overflow-hidden rounded-2xl">
              <div className="relative aspect-[4/5] bg-[var(--admin-surface-raised)]">
                <Image src={a.url} alt={a.name} fill className="object-cover" sizes="200px" unoptimized />
              </div>
              <div className="p-3">
                <p className="truncate font-sans text-xs font-medium text-[var(--admin-ink)]">{a.name}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-[var(--admin-faint)]">
                  {a.category}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
