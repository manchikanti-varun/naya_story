"use client";

import type { SectionDesign } from "@/types/homepage";
import { AdminField, AdminInput } from "@/components/admin/ui/AdminField";

type Props = {
  value?: SectionDesign | null;
  onChange: (next: SectionDesign) => void;
  /** Show font size / family controls (hero slides, rich sections). */
  showTypography?: boolean;
};

export function SectionDesignFields({ value, onChange, showTypography = false }: Props) {
  const v = value ?? {};

  const set = <K extends keyof SectionDesign>(key: K, val: SectionDesign[K]) => {
    onChange({ ...v, [key]: val || undefined });
  };

  return (
    <div className="space-y-6">
      <div className="admin-cms-group">
        <div className="admin-cms-group-header">
          <div>
            <h4 className="admin-cms-kicker">Colors</h4>
            <p className="mt-1.5 font-sans text-xs leading-relaxed text-[var(--admin-muted)]">
              Background, text, buttons, and overlay. Hex or rgba values.
            </p>
          </div>
        </div>
        <div className="admin-cms-group-body">
          <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Background">
            <AdminInput
              placeholder="#f7f3ee"
              value={v.backgroundColor ?? ""}
              onChange={(e) => set("backgroundColor", e.target.value)}
            />
          </AdminField>
          <AdminField label="Text">
            <AdminInput
              placeholder="#2c2825"
              value={v.textColor ?? ""}
              onChange={(e) => set("textColor", e.target.value)}
            />
          </AdminField>
          <AdminField label="Button border / accent">
            <AdminInput
              placeholder="#a67c32"
              value={v.buttonColor ?? ""}
              onChange={(e) => set("buttonColor", e.target.value)}
            />
          </AdminField>
          <AdminField label="Button hover">
            <AdminInput
              placeholder="#c9a227"
              value={v.buttonHoverColor ?? ""}
              onChange={(e) => set("buttonHoverColor", e.target.value)}
            />
          </AdminField>
          <AdminField label="Button text">
            <AdminInput
              placeholder="#ffffff"
              value={v.buttonTextColor ?? ""}
              onChange={(e) => set("buttonTextColor", e.target.value)}
            />
          </AdminField>
          <AdminField label="Overlay color">
            <AdminInput
              placeholder="#000000 or rgba(0,0,0,0.45)"
              value={v.overlayColor ?? ""}
              onChange={(e) => set("overlayColor", e.target.value)}
            />
          </AdminField>
          <AdminField label="Overlay strength (0–1)" className="sm:col-span-2">
            <AdminInput
              type="number"
              min={0}
              max={1}
              step={0.05}
              placeholder="Default gradients when empty"
              value={v.overlayOpacity ?? ""}
              onChange={(e) => {
                const n = e.target.value === "" ? undefined : Number(e.target.value);
                set("overlayOpacity", n as SectionDesign["overlayOpacity"]);
              }}
            />
          </AdminField>
        </div>
        </div>
      </div>

      {showTypography ? (
        <div className="admin-cms-group">
          <div className="admin-cms-group-header">
            <div>
              <h4 className="admin-cms-kicker">Typography</h4>
              <p className="mt-1.5 font-sans text-xs leading-relaxed text-[var(--admin-muted)]">
                Font family, sizes, and weight for this block or slide.
              </p>
            </div>
          </div>
          <div className="admin-cms-group-body">
            <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Heading font">
              <select
                className="admin-input mt-1.5 w-full"
                value={v.headingFont ?? ""}
                onChange={(e) =>
                  set("headingFont", (e.target.value || undefined) as SectionDesign["headingFont"])
                }
              >
                <option value="">Default (display)</option>
                <option value="display">Display (Cormorant)</option>
                <option value="sans">Sans (Inter)</option>
              </select>
            </AdminField>
            <AdminField label="Font weight">
              <AdminInput
                placeholder="e.g. 300, 400"
                value={v.fontWeight ?? ""}
                onChange={(e) => set("fontWeight", e.target.value)}
              />
            </AdminField>
            <AdminField label="Heading size">
              <AdminInput
                placeholder="e.g. clamp(1.65rem,5vw,3.35rem)"
                value={v.headingFontSize ?? ""}
                onChange={(e) => set("headingFontSize", e.target.value)}
              />
            </AdminField>
            <AdminField label="Subheading size">
              <AdminInput
                placeholder="e.g. 1rem"
                value={v.subheadingFontSize ?? ""}
                onChange={(e) => set("subheadingFontSize", e.target.value)}
              />
            </AdminField>
            <AdminField label="Kicker size">
              <AdminInput
                placeholder="e.g. 10px"
                value={v.kickerFontSize ?? ""}
                onChange={(e) => set("kickerFontSize", e.target.value)}
              />
            </AdminField>
            <AdminField label="CTA size">
              <AdminInput
                placeholder="e.g. 11px"
                value={v.ctaFontSize ?? ""}
                onChange={(e) => set("ctaFontSize", e.target.value)}
              />
            </AdminField>
            <AdminField label="Letter spacing">
              <AdminInput
                placeholder="e.g. 0.28em"
                value={v.letterSpacing ?? ""}
                onChange={(e) => set("letterSpacing", e.target.value)}
              />
            </AdminField>
            <AdminField label="Line height">
              <AdminInput
                placeholder="e.g. 1.06"
                value={v.lineHeight ?? ""}
                onChange={(e) => set("lineHeight", e.target.value)}
              />
            </AdminField>
          </div>
          </div>
        </div>
      ) : null}

      <div className="admin-cms-group">
        <div className="admin-cms-group-header">
          <div>
            <h4 className="admin-cms-kicker">Layout & spacing</h4>
          </div>
        </div>
        <div className="admin-cms-group-body">
          <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Padding top">
            <AdminInput
              placeholder="e.g. 4rem"
              value={v.paddingTop ?? ""}
              onChange={(e) => set("paddingTop", e.target.value)}
            />
          </AdminField>
          <AdminField label="Padding bottom">
            <AdminInput
              placeholder="e.g. 4rem"
              value={v.paddingBottom ?? ""}
              onChange={(e) => set("paddingBottom", e.target.value)}
            />
          </AdminField>
          <AdminField label="Max width">
            <AdminInput
              placeholder="e.g. 72rem"
              value={v.maxWidth ?? ""}
              onChange={(e) => set("maxWidth", e.target.value)}
            />
          </AdminField>
          <AdminField label="Border radius">
            <AdminInput
              placeholder="e.g. 0px"
              value={v.borderRadius ?? ""}
              onChange={(e) => set("borderRadius", e.target.value)}
            />
          </AdminField>
          <AdminField label="Alignment">
            <select
              className="admin-input mt-1.5 w-full"
              value={v.align ?? ""}
              onChange={(e) => set("align", (e.target.value || undefined) as SectionDesign["align"])}
            >
              <option value="">Default</option>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </AdminField>
          <AdminField label="Mode">
            <select
              className="admin-input mt-1.5 w-full"
              value={v.mode ?? ""}
              onChange={(e) => set("mode", (e.target.value || undefined) as SectionDesign["mode"])}
            >
              <option value="">Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </AdminField>
          <AdminField label="Opacity (0–1)" className="sm:col-span-2">
            <AdminInput
              type="number"
              min={0}
              max={1}
              step={0.05}
              placeholder="1"
              value={v.opacity ?? ""}
              onChange={(e) => {
                const n = e.target.value === "" ? undefined : Number(e.target.value);
                set("opacity", n as SectionDesign["opacity"]);
              }}
            />
          </AdminField>
        </div>
        </div>
      </div>
    </div>
  );
}
