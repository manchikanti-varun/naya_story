"use client";

import { SectionTypographyFields } from "@/components/admin/cms/SectionTypographyFields";
import { CmsFormGrid, CmsPageEditorShell, CmsVisibilityToggle } from "@/components/admin/cms/CmsFormHelpers";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/ui/AdminField";

export function ContentEditorTopPromoPanel() {
  const { hp, setHp } = useHomepageEditor();
  if (!hp) return null;

  const bar = hp.topPromoBar;

  return (
    <CmsPageEditorShell
      title="Top promo bar"
      description="A slim strip above the main navigation on every storefront page — ideal for coupon codes, free shipping, or short announcements. Shoppers can scroll the line horizontally on small screens and close it with ×."
    >
      <CmsVisibilityToggle
        label="Show on live site"
        checked={bar.enabled === true}
        onChange={(enabled) =>
          setHp({
            ...hp,
            topPromoBar: { ...bar, enabled },
          })
        }
      />

      <CmsFormGrid>
        <AdminField
          label="Message"
          hint="Plain text, one line — use scroll on phones if long."
          className="md:col-span-2"
        >
          <AdminInput
            placeholder="e.g. Use code NAYA10 for 10% off your first order"
            value={bar.message}
            onChange={(e) =>
              setHp({
                ...hp,
                topPromoBar: { ...bar, message: e.target.value },
              })
            }
          />
        </AdminField>
        <AdminField label="Optional link label">
          <AdminInput
            placeholder="Shop sale"
            value={bar.linkLabel ?? ""}
            onChange={(e) =>
              setHp({
                ...hp,
                topPromoBar: { ...bar, linkLabel: e.target.value },
              })
            }
          />
        </AdminField>
        <AdminField label="Optional link URL">
          <AdminInput
            placeholder="/collections"
            value={bar.linkHref ?? ""}
            onChange={(e) =>
              setHp({
                ...hp,
                topPromoBar: { ...bar, linkHref: e.target.value },
              })
            }
          />
        </AdminField>
        <AdminField label="Style" className="md:col-span-2">
          <AdminSelect
            className="max-w-xs"
            value={bar.variant ?? "ink"}
            onChange={(e) =>
              setHp({
                ...hp,
                topPromoBar: {
                  ...bar,
                  variant: e.target.value as "ink" | "sand" | "gold",
                },
              })
            }
          >
            <option value="ink">Dark (ivory text)</option>
            <option value="sand">Sand</option>
            <option value="gold">Soft gold</option>
          </AdminSelect>
        </AdminField>
      </CmsFormGrid>

      <SectionTypographyFields section="promoBar" />
    </CmsPageEditorShell>
  );
}
