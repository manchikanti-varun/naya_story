"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { HeroSlideEditorFields } from "@/components/admin/cms/HeroSlideEditorFields";
import { CmsSectionEditorShell } from "@/components/admin/cms/CmsSectionEditorShell";
import { SectionDesignFields } from "@/components/admin/cms/SectionDesignFields";
import { SectionTypographyFields } from "@/components/admin/cms/SectionTypographyFields";
import { slideHasCustomStyle } from "@/lib/cms/hero-slide-styles";
import { sortSlides, useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { AdminField, AdminInput } from "@/components/admin/ui/AdminField";
import { cn } from "@/lib/cn";

export function HeroCarouselEditor() {
  const { hp, setHp, moveSlide, updateSlide, token } = useHomepageEditor();
  const slides = hp ? sortSlides(hp.carousel.slides) : [];
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);

  useEffect(() => {
    if (!slides.length) {
      setActiveSlideId(null);
      return;
    }
    if (!activeSlideId || !slides.some((s) => s.id === activeSlideId)) {
      setActiveSlideId(slides[0]!.id);
    }
  }, [slides, activeSlideId]);

  if (!hp) return null;

  const activeIndex = slides.findIndex((s) => s.id === activeSlideId);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeSlide = slides[safeIndex];

  const editorContent = (
    <div className="space-y-6">
      <details className="group rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface-sunken)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-sans text-sm font-medium text-[var(--admin-ink)] [&::-webkit-details-marker]:hidden">
          <span>
            Shared defaults
            <span className="mt-0.5 block text-xs font-normal text-[var(--admin-muted)]">
              Autoplay + fallback colors when a slide leaves style fields empty
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--admin-muted)] transition group-open:rotate-180" />
        </summary>
        <div className="space-y-6 border-t border-[var(--admin-border)] px-4 py-4">
          <AdminField label="Autoplay between slides" hint="Milliseconds (min 4000).">
            <AdminInput
              type="number"
              min={4000}
              step={500}
              className="max-w-[9rem]"
              value={hp.carousel.autoplayMs}
              onChange={(e) =>
                setHp({
                  ...hp,
                  carousel: { ...hp.carousel, autoplayMs: Number(e.target.value) || 9000 },
                })
              }
            />
          </AdminField>
          <SectionDesignFields
            value={hp.carousel.styles}
            onChange={(styles) => setHp({ ...hp, carousel: { ...hp.carousel, styles } })}
            showTypography
          />
          <SectionTypographyFields section="hero" />
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSlideId(s.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-sans text-xs transition",
              s.id === activeSlideId
                ? "border-[var(--admin-ink)] bg-[var(--admin-ink)] text-white"
                : "border-[var(--admin-border)] bg-white text-[var(--admin-ink)] hover:border-[var(--admin-accent)]",
              !s.enabled && s.id !== activeSlideId && "opacity-60",
            )}
          >
            <span className="font-medium">{i + 1}.</span> {s.heading?.trim() || `Slide ${i + 1}`}
            {slideHasCustomStyle(s) ? " ●" : null}
            {!s.enabled ? " · off" : null}
          </button>
        ))}
      </div>

      {activeSlide ? (
        <HeroSlideEditorFields
          key={activeSlide.id}
          allSlides={slides}
          slide={activeSlide}
          index={safeIndex}
          total={slides.length}
          token={token}
          carouselStyles={hp.carousel.styles}
          carouselTextColors={hp.sectionTextColors?.hero}
          onUpdate={(patch) => updateSlide(activeSlide.id, patch)}
          onMove={(dir) => moveSlide(safeIndex, dir)}
        />
      ) : (
        <p className="rounded-[var(--admin-radius-sm)] border border-dashed border-[var(--admin-border)] px-4 py-8 text-center font-sans text-sm text-[var(--admin-muted)]">
          No slides yet.
        </p>
      )}

      <p className="font-sans text-xs text-[var(--admin-faint)]">
        Reorder homepage blocks in{" "}
        <Link href="/admin/website/homepage" className="text-[var(--admin-accent)] hover:underline">
          Homepage layout
        </Link>
        .
      </p>
    </div>
  );

  return (
    <CmsSectionEditorShell
      sectionId="admin-section-hero"
      title="Hero carousel"
      description="One page: pick a slide, edit content and style. Shared defaults are optional."
      previewHref="/admin/content/preview/hero"
      tabs={[{ id: "content", content: editorContent }]}
    />
  );
}
