"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CloudinaryImageUpload } from "@/components/admin/CloudinaryImageUpload";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminField, AdminInput } from "@/components/admin/ui/AdminField";
const MAX_IMAGES = 12;

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  token?: string | null;
};

function normalize(urls: string[]) {
  return urls.map((u) => u.trim()).filter(Boolean);
}

export function ProductImagesField({ value, onChange, token }: Props) {
  const [draft, setDraft] = useState("");
  const images = normalize(value.length ? value : []);

  const setImages = (next: string[]) => onChange(normalize(next).slice(0, MAX_IMAGES));

  const addUrl = () => {
    const url = draft.trim();
    if (!url) return;
    if (images.length >= MAX_IMAGES) return;
    setImages([...images, url]);
    setDraft("");
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...images];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    setImages(next);
  };

  const addUploaded = (url: string) => {
    if (images.length >= MAX_IMAGES) return;
    setImages([...images, url]);
  };

  return (
    <div className="space-y-4">
      <CloudinaryImageUpload
        token={token}
        category="product"
        label="Upload to Cloudinary"
        hint={`Adds to gallery (max ${MAX_IMAGES}). Also saved in Media library.`}
        disabled={images.length >= MAX_IMAGES}
        onUploaded={addUploaded}
      />
      <AdminField
        label="Gallery images"
        hint={`First image is the main product photo. Up to ${MAX_IMAGES} — upload above or paste a URL.`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <AdminInput
            type="url"
            placeholder="https://…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            className="flex-1"
          />
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={!draft.trim() || images.length >= MAX_IMAGES}
            onClick={addUrl}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Add image
          </AdminButton>
        </div>
      </AdminField>

      {images.length === 0 ? (
        <p className="rounded-[var(--admin-radius-sm)] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-6 text-center font-sans text-sm text-[var(--admin-muted)]">
          No gallery images yet. Add at least one URL before saving.
        </p>
      ) : (
        <ul className="space-y-3">
          {images.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="flex gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] p-3"
            >
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--admin-surface)]">
                <Image src={url} alt="" fill className="object-cover" sizes="64px" unoptimized />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-faint)]">
                  {i === 0 ? "Primary · storefront hero" : `Image ${i + 1}`}
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-[var(--admin-muted)]">{url}</p>
                <AdminInput
                  className="mt-2 font-mono text-xs"
                  value={url}
                  onChange={(e) => {
                    const next = [...images];
                    next[i] = e.target.value;
                    onChange(next);
                  }}
                />
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[var(--admin-muted)] hover:bg-black/[0.04] disabled:opacity-30"
                  disabled={i === 0}
                  title="Move up"
                  onClick={() => move(i, -1)}
                >
                  <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[var(--admin-muted)] hover:bg-black/[0.04] disabled:opacity-30"
                  disabled={i === images.length - 1}
                  title="Move down"
                  onClick={() => move(i, 1)}
                >
                  <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30"
                  disabled={images.length <= 1}
                  title="Remove"
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="font-sans text-[11px] text-[var(--admin-faint)]">
        {images.length}/{MAX_IMAGES} images · Shoppers see every image on the product page gallery.
      </p>
    </div>
  );
}
