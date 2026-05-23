"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp, Images, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CloudinaryImageUpload } from "@/components/admin/CloudinaryImageUpload";
import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/ui/AdminField";
import {
  normalizeProductCaptions,
  PRODUCT_IMAGE_LABEL_PRESETS,
} from "@/lib/product-gallery";

const MAX_IMAGES = 12;

type Props = {
  images: string[];
  captions?: string[];
  onChange: (images: string[], captions: string[]) => void;
  token?: string | null;
};

function normalize(urls: string[]) {
  return urls.map((u) => u.trim()).filter(Boolean);
}

export function ProductImagesField({ images: imagesProp, captions: captionsProp, onChange, token }: Props) {
  const [draft, setDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const images = normalize(imagesProp.length ? imagesProp : []);
  const captions = normalizeProductCaptions(images, captionsProp);
  const atMax = images.length >= MAX_IMAGES;

  const emit = (nextImages: string[], nextCaptions: string[]) => {
    const urls = normalize(nextImages).slice(0, MAX_IMAGES);
    onChange(urls, normalizeProductCaptions(urls, nextCaptions));
  };

  const setImages = (next: string[]) => emit(next, captions);

  const addUrl = (url: string, caption = "") => {
    const trimmed = url.trim();
    if (!trimmed || atMax || images.includes(trimmed)) return;
    emit([...images, trimmed], [...captions, caption]);
    setDraft("");
  };

  const addUrlFromDraft = () => addUrl(draft);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...images];
    const nextCaps = [...captions];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    [nextCaps[index], nextCaps[j]] = [nextCaps[j]!, nextCaps[index]!];
    emit(next, nextCaps);
  };

  const removeAt = (index: number) => {
    emit(
      images.filter((_, j) => j !== index),
      captions.filter((_, j) => j !== index),
    );
  };

  const setCaption = (index: number, label: string) => {
    const nextCaps = [...captions];
    nextCaps[index] = label;
    emit(images, nextCaps);
  };

  const setUrl = (index: number, url: string) => {
    const next = [...images];
    next[index] = url;
    emit(next, captions);
  };

  return (
    <div className="space-y-4">
      <CloudinaryImageUpload
        token={token}
        category="product"
        label="Upload photo"
        hint={`Up to ${MAX_IMAGES} images. Saved to Media library.`}
        disabled={atMax}
        onUploaded={(url) => addUrl(url)}
      />
      <AdminField label="Add by URL">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <AdminInput
            type="url"
            placeholder="https://…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrlFromDraft();
              }
            }}
            className="flex-1"
          />
          {token ? (
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={atMax}
              onClick={() => setPickerOpen(true)}
            >
              <Images className="h-4 w-4" strokeWidth={1.5} />
              Library
            </AdminButton>
          ) : null}
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={!draft.trim() || atMax}
            onClick={addUrlFromDraft}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Add image
          </AdminButton>
        </div>
      </AdminField>

      {token ? (
        <MediaLibraryPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          token={token}
          title="Choose product image"
          onSelect={(url) => addUrl(url)}
        />
      ) : null}

      {images.length === 0 ? (
        <p className="rounded-[var(--admin-radius-sm)] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-6 text-center font-sans text-sm text-[var(--admin-muted)]">
          No gallery images yet. Add at least one image before saving.
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
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-xs font-medium text-[var(--admin-muted)]">
                  {i === 0
                    ? "Photo 1 — Hero (product page)"
                    : i === 1
                      ? "Photo 2 — Hover on hero (product page only)"
                      : `Photo ${i + 1} — Design & construction grid`}
                </p>
                <AdminField label="Label" className="!mt-0">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <AdminSelect
                      className="sm:max-w-[11rem]"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setCaption(i, e.target.value);
                      }}
                    >
                      <option value="">Quick label…</option>
                      {PRODUCT_IMAGE_LABEL_PRESETS.filter(Boolean).map((preset) => (
                        <option key={preset} value={preset}>
                          {preset}
                        </option>
                      ))}
                    </AdminSelect>
                    <AdminInput
                      placeholder="e.g. Embroidery detail"
                      value={captions[i] ?? ""}
                      onChange={(e) => setCaption(i, e.target.value)}
                      className="min-w-0 flex-1"
                    />
                  </div>
                </AdminField>
                <AdminInput
                  className="font-mono text-xs"
                  value={url}
                  onChange={(e) => setUrl(i, e.target.value)}
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
                  onClick={() => removeAt(i)}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-[var(--admin-faint)]">
        {images.length}/{MAX_IMAGES} · Photo 1 = hero, photo 2 = hover on hero, photos 3+ = Design
        &amp; construction section only (no duplicates on cards or listings).
      </p>
    </div>
  );
}
