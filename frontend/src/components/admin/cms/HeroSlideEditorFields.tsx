"use client";

import { useState } from "react";
import type { HeroSlide, SectionDesign, SectionTextColors } from "@/types/homepage";
import { ChevronDown, ChevronUp, Copy, ImageIcon, RotateCcw } from "lucide-react";
import {
  cloneHeroSlideStyle,
  getEffectiveHeroSlideStyle,
  slideHasCustomStyle,
} from "@/lib/cms/hero-slide-styles";
import { BlockTextColorFields } from "@/components/admin/cms/BlockTextColorFields";
import { CmsImageUrlField } from "@/components/admin/cms/CmsImageUrlField";
import { SectionDesignFields } from "@/components/admin/cms/SectionDesignFields";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminField, AdminInput } from "@/components/admin/ui/AdminField";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { cn } from "@/lib/cn";

type SlideTab = "content" | "style";

type Props = {
  slide: HeroSlide;
  index: number;
  total: number;
  allSlides: HeroSlide[];
  carouselStyles?: SectionDesign | null;
  carouselTextColors?: SectionTextColors | null;
  token?: string | null;
  onUpdate: (patch: Partial<HeroSlide>) => void;
  onMove: (dir: -1 | 1) => void;
  onClear: () => void;
  onRemove: () => void;
};

function SlideSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-white"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-sans text-sm font-medium text-[var(--admin-ink)] [&::-webkit-details-marker]:hidden">
        <span>
          {title}
          {summary ? (
            <span className="mt-0.5 block text-xs font-normal text-[var(--admin-muted)]">{summary}</span>
          ) : null}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--admin-muted)] transition group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-[var(--admin-border)] px-4 py-4">{children}</div>
    </details>
  );
}

export function HeroSlideEditorFields({
  slide,
  index,
  total,
  allSlides,
  carouselStyles,
  carouselTextColors,
  token,
  onUpdate,
  onMove,
  onClear,
  onRemove,
}: Props) {
  const [tab, setTab] = useState<SlideTab>("content");
  const customStyle = slideHasCustomStyle(slide);

  const copyFromPrevious = () => {
    if (index === 0) return;
    const inherited = getEffectiveHeroSlideStyle(allSlides, allSlides[index - 1]!.id);
    const copied = cloneHeroSlideStyle(inherited);
    onUpdate({
      matchPreviousSlideStyles: false,
      styles: copied.styles ? { ...copied.styles } : {},
      textColors: copied.textColors ? { ...copied.textColors } : {},
    });
    setTab("style");
  };

  const resetToCarouselDefaults = () => {
    onUpdate({
      matchPreviousSlideStyles: false,
      styles: {},
      textColors: {},
    });
  };

  const desktop = slide.desktopImage?.trim() || "";
  const mobile = slide.mobileImage?.trim() || "";

  return (
    <article className="admin-cms-slide-card">
      <header className="admin-cms-slide-card-header">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="admin-cms-slide-badge">{index + 1}</span>
          <div className="min-w-0">
            <p className="truncate font-sans text-sm font-semibold text-[var(--admin-ink)]">
              {slide.heading?.trim() || `Slide ${index + 1}`}
            </p>
            <p className="font-sans text-[11px] text-[var(--admin-muted)]">
              {slide.enabled ? "Shown on homepage" : "Hidden"}
              {customStyle ? " · Custom style" : " · Carousel default style"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Move slide up"
          >
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} />
          </AdminButton>
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label="Move slide down"
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
          </AdminButton>
          <AdminBadge tone={slide.enabled ? "success" : "neutral"}>
            {slide.enabled ? "On" : "Off"}
          </AdminBadge>
          <label className="admin-cms-toggle">
            <input
              type="checkbox"
              checked={slide.enabled}
              onChange={(e) => onUpdate({ enabled: e.target.checked })}
            />
            Enabled
          </label>
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Clear all content from this slide? It will be disabled and emptied.")) onClear();
            }}
            aria-label="Clear slide"
            title="Clear slide content"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-600" strokeWidth={1.75} />
          </AdminButton>
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Delete this slide permanently?")) onRemove();
            }}
            aria-label="Delete slide"
            title="Delete slide"
            className="text-red-600 hover:bg-red-50"
          >
            <span className="text-xs font-semibold">✕</span>
          </AdminButton>
        </div>
      </header>

      <div className="border-b border-[var(--admin-border)] px-4 pt-3">
        <div className="admin-cms-tabs">
          <button
            type="button"
            data-active={tab === "content"}
            className="admin-cms-tab"
            onClick={() => setTab("content")}
          >
            Content
          </button>
          <button
            type="button"
            data-active={tab === "style"}
            className="admin-cms-tab"
            onClick={() => setTab("style")}
          >
            Style
            {customStyle ? (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--admin-accent)]" />
            ) : null}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {tab === "content" ? (
          <div className="space-y-3">
            <SlideSection title="Headline & button" summary="Main text visitors see" defaultOpen>
              <AdminField label="Heading">
                <AdminInput
                  placeholder="The full collection"
                  value={slide.heading}
                  onChange={(e) => onUpdate({ heading: e.target.value })}
                />
              </AdminField>
              <AdminField label="Subheading">
                <AdminInput
                  placeholder="Every silhouette, one quiet narrative."
                  value={slide.subheading ?? ""}
                  onChange={(e) => onUpdate({ subheading: e.target.value })}
                />
              </AdminField>
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Button label">
                  <AdminInput
                    placeholder="Explore collection"
                    value={slide.ctaLabel ?? ""}
                    onChange={(e) => onUpdate({ ctaLabel: e.target.value })}
                  />
                </AdminField>
                <AdminField label="Button link">
                  <AdminInput
                    placeholder="/collections"
                    value={slide.ctaHref}
                    onChange={(e) => onUpdate({ ctaHref: e.target.value })}
                  />
                </AdminField>
              </div>
            </SlideSection>

            <SlideSection title="Background image" summary="Desktop required · mobile optional" defaultOpen>
              {desktop ? (
                <div className="admin-cms-image-preview max-h-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={desktop} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div
                  className={cn(
                    "admin-cms-image-preview flex max-h-32 flex-col items-center justify-center gap-2",
                    "font-sans text-[10px] uppercase tracking-[0.16em] text-[var(--admin-faint)]",
                  )}
                >
                  <ImageIcon className="h-6 w-6 opacity-40" strokeWidth={1.25} />
                  Add a desktop image
                </div>
              )}
              <CmsImageUrlField
                label="Desktop image"
                token={token}
                value={slide.desktopImage}
                onChange={(desktopImage) => onUpdate({ desktopImage })}
              />
              <CmsImageUrlField
                label="Mobile image (optional)"
                token={token}
                value={slide.mobileImage ?? ""}
                onChange={(mobileImage) => onUpdate({ mobileImage })}
              />
            </SlideSection>

            <SlideSection title="Extra labels" summary="Kicker line and right-column meta">
              <AdminField label="Kicker" hint="Blank = site name + slide number.">
                <AdminInput
                  placeholder="Naya — 01"
                  value={slide.kicker ?? ""}
                  onChange={(e) => onUpdate({ kicker: e.target.value })}
                />
              </AdminField>
              <AdminField label="Meta label (right side)">
                <AdminInput
                  placeholder="Season IV"
                  value={slide.metaLabel ?? ""}
                  onChange={(e) => onUpdate({ metaLabel: e.target.value })}
                />
              </AdminField>
            </SlideSection>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="font-sans text-sm text-[var(--admin-muted)]">
              These settings apply <strong className="font-medium text-[var(--admin-ink)]">only to this slide</strong>{" "}
              on the homepage. Empty fields fall back to the Carousel style tab defaults.
            </p>

            <div className="flex flex-wrap gap-2">
              {index > 0 ? (
                <AdminButton type="button" variant="secondary" size="sm" onClick={copyFromPrevious}>
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Copy previous slide style
                </AdminButton>
              ) : null}
              <AdminButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetToCarouselDefaults}
                disabled={!customStyle && !slide.matchPreviousSlideStyles}
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                Use carousel defaults only
              </AdminButton>
            </div>

            {slide.matchPreviousSlideStyles ? (
              <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 font-sans text-xs text-amber-950">
                This slide was set to mirror another slide. Edit any field below to give it its own look, or
                copy from a neighbour.
              </p>
            ) : null}

            <BlockTextColorFields
              fields={["kicker", "heading", "subheading", "link"]}
              value={slide.textColors}
              onChange={(textColors) =>
                onUpdate({ textColors, matchPreviousSlideStyles: false })
              }
              intro="Text colors for this slide only."
            />

            <SectionDesignFields
              value={slide.styles}
              onChange={(styles) => onUpdate({ styles, matchPreviousSlideStyles: false })}
              showTypography
            />

            {(carouselStyles || carouselTextColors) && (
              <details className="rounded-[var(--admin-radius-sm)] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-sunken)] px-4 py-3">
                <summary className="cursor-pointer font-sans text-xs font-medium text-[var(--admin-muted)]">
                  Carousel-wide defaults (reference)
                </summary>
                <div className="mt-3 space-y-2 font-mono text-[10px] text-[var(--admin-faint)]">
                  {carouselStyles?.backgroundColor ? (
                    <p>Background: {carouselStyles.backgroundColor}</p>
                  ) : null}
                  {carouselStyles?.overlayColor ? (
                    <p>Overlay: {carouselStyles.overlayColor}</p>
                  ) : null}
                  {carouselTextColors?.heading ? (
                    <p>Heading color: {carouselTextColors.heading}</p>
                  ) : null}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
