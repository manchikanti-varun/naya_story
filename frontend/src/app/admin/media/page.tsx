"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Search, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { MediaAsset } from "@/types";

const categories = ["general", "banner", "homepage", "collection", "campaign", "lookbook", "product"];

export default function AdminMediaPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ url: "", name: "", tags: "", category: "general" });

  const load = useCallback(async () => {
    if (!token) return;
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    params.set("limit", "200");
    const data = await apiFetch<{ items: MediaAsset[] }>(`/media?${params.toString()}`, { token });
    setItems(data.items);
  }, [token, q, category]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load().catch(() => setItems([]));
    }, 280);
    return () => clearTimeout(t);
  }, [load]);

  async function addAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !form.url.trim() || !form.name.trim()) return;
    setBusy(true);
    try {
      await apiFetch("/media", {
        method: "POST",
        token,
        body: JSON.stringify({
          url: form.url.trim(),
          name: form.name.trim(),
          tags: form.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          category: form.category,
        }),
      });
      setForm({ url: "", name: "", tags: "", category: form.category });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!token || !confirm("Remove this asset from the library?")) return;
    await apiFetch(`/media/${id}`, { method: "DELETE", token });
    await load();
  }

  return (
    <div className="space-y-10 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Assets</p>
          <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">Media library</h1>
          <p className="mt-2 max-w-xl font-sans text-sm text-slate-600">
            Central place for banners and campaign art. Paste HTTPS URLs, tag usage, then reuse across homepage
            CMS and products.
          </p>
        </div>
      </header>

      <form
        onSubmit={addAsset}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <h2 className="font-display text-lg text-slate-900">Add asset</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Image URL
            <input
              required
              type="url"
              placeholder="https://…"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </label>
          <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Name
            <input
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Category
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Tags (comma-separated)
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="hero, spring, homepage"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Save to library
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900"
            placeholder="Search by name or tags…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 sm:w-48"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <article
            key={item._id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="relative aspect-[4/3] bg-slate-100">
              <Image src={item.url} alt={item.name} fill className="object-cover" sizes="280px" unoptimized />
            </div>
            <div className="space-y-2 p-4">
              <p className="truncate font-medium text-slate-900">{item.name}</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-slate-400">
                {item.category ?? "general"}
              </p>
              {item.tags?.length ? (
                <p className="text-xs text-slate-500">{item.tags.join(" · ")}</p>
              ) : null}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 hover:text-slate-900"
                  onClick={() => void navigator.clipboard.writeText(item.url)}
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  title="Delete"
                  onClick={() => void remove(item._id)}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!items.length ? (
        <p className="text-center font-sans text-sm text-slate-500">No assets yet — add your first URL above.</p>
      ) : null}
    </div>
  );
}
