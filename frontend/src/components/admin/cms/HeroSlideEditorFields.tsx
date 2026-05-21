"use client";

import type { HeroSlide } from "@/types/homepage";
import { ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { BlockTextColorFields } from "@/components/admin/cms/BlockTextColorFields";
import { CmsFieldGroup } from "@/components/admin/cms/CmsFieldGroup";
import { SectionDesignFields } from "@/components/admin/cms/SectionDesignFields";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { CmsImageUrlField } from "@/components/admin/cms/CmsImageUrlField";
import { AdminField, AdminInput } from "@/components/admin/ui/AdminField";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { cn } from "@/lib/cn";

type Props = {
  slide: HeroSlide;
  index: number;
  total: number;
  token?: string | null;
  onUpdate: (patch: Partial<HeroSlide>) => void;
  onMove: (dir: -1 | 1) => void;
};

export function HeroSlideEditorFields({ slide, index, total, token, onUpdate, onMove }: Props) {
  const desktop = slide.desktopImage?.trim() || "";
  const mobile = slide.mobileImage?.trim() || "";

  return (
    <article className="admin-cms-slide-card">
      <header className="admin-cms-slide-card-header">
        <div className="flex items-center gap-3">
          <span className="admin-cms-slide-badge">{index + 1}</span>
          <div>
            <p className="font-sans text-sm font-semibold text-[var(--admin-ink)]">
              {slide.heading?.trim() || `Slide ${index + 1}`}
            </p>
            <p className="font-sans text-[11px] text-[var(--admin-muted)]">
              {slide.enabled ? "Visible on storefront" : "Hidden from carousel"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </header>

      <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-[var(--admin-border)]">
        <div className="space-y-6 p-5 sm:p-6">
          <CmsFieldGroup title="Copy" description="Headline, subcopy, and call to action for this slide.">
            <div className="grid gap-4">
              <AdminField label="Kicker" hint="Leave blank to use site name + slide number.">
                <AdminInput
                  placeholder="Naya — 01"
                  value={slide.kicker ?? ""}
                  onChange={(e) => onUpdate({ kicker: e.target.value })}
                />
              </AdminField>
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
                <AdminField label="CTA label">
                  <AdminInput
                    placeholder="Explore collection"
                    value={slide.ctaLabel ?? ""}
                    onChange={(e) => onUpdate({ ctaLabel: e.target.value })}
                  />
                </AdminField>
                <AdminField label="CTA link">
                  <AdminInput
                    placeholder="/collections"
                    value={slide.ctaHref}
                    onChange={(e) => onUpdate({ ctaHref: e.target.value })}
                  />
                </AdminField>
              </div>
              <AdminField label="Meta label" hint="Small label in the right column (e.g. Season IV).">
                <AdminInput
                  placeholder="Season IV"
                  value={slide.metaLabel ?? ""}
                  onChange={(e) => onUpdate({ metaLabel: e.target.value })}
                />
              </AdminField>
            </div>
          </CmsFieldGroup>
        </div>

        <div className="space-y-6 bg-[var(--admin-surface-raised)]/60 p-5 sm:p-6">
          <CmsFieldGroup
            title="Imagery"
            description="Desktop image is required. Add a mobile crop for smaller screens."
            actions={
              <div className="flex gap-1">
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
              </div>
            }
          >
            <div className="grid gap-4">
              {desktop ? (
                <div className="admin-cms-image-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={desktop} alt="" />
                </div>
              ) : (
                <div
                  className={cn(
                    "admin-cms-image-preview flex flex-col items-center justify-center gap-2",
                    "font-sans text-[10px] uppercase tracking-[0.16em] text-[var(--admin-faint)]",
                  )}
                >
                  <ImageIcon className="h-6 w-6 opacity-40" strokeWidth={1.25} />
                  No image yet
                </div>
              )}
              <CmsImageUrlField
                label="Desktop image URL"
                token={token}
                value={slide.desktopImage}
                onChange={(desktopImage) => onUpdate({ desktopImage })}
              />
              <CmsImageUrlField
                label="Mobile image URL"
                token={token}
                hint="Optional — uses desktop image when empty."
                value={slide.mobileImage ?? ""}
                onChange={(mobileImage) => onUpdate({ mobileImage })}
              />
              {mobile && mobile !== desktop ? (
                <div className="admin-cms-image-preview max-h-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mobile} alt="" />
                </div>
              ) : null}
            </div>
          </CmsFieldGroup>
        </div>
      </div>

      <div className="space-y-6 border-t border-[var(--admin-border)] p-5 sm:p-6">
        <CmsFieldGroup
          title="Design & typography"
          description="Colors, fonts, overlay, and layout for this slide only. Carousel-wide defaults apply when fields are empty."
        >
          <div className="space-y-6">
            <BlockTextColorFields
              fields={["kicker", "heading", "subheading", "link"]}
              value={slide.textColors}
              onChange={(textColors) => onUpdate({ textColors })}
              intro="Override text colors for this slide."
            />
            <SectionDesignFields
              value={slide.styles}
              onChange={(styles) => onUpdate({ styles })}
              showTypography
            />
          </div>
        </CmsFieldGroup>
      </div>
    </article>
  );
}

