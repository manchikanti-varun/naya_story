"use client";

import type { PdpSuggestedMode } from "@/types/storefront-settings";
import { CmsFormGrid, CmsPageEditorShell } from "@/components/admin/cms/CmsFormHelpers";
import { AdminField, AdminSelect } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { useStorefrontSettings } from "@/components/admin/website/use-storefront-settings";

const SUGGESTED_MODES: { value: PdpSuggestedMode; label: string; hint: string }[] = [
  {
    value: "auto",
    label: "Auto (recommended)",
    hint: "Tries same collection → category → bestsellers → new in → all until a rail has items.",
  },
  { value: "collection", label: "Same collection", hint: "Only pieces sharing this product's collection tag." },
  { value: "category", label: "Same category", hint: "e.g. all Dresses when viewing a dress." },
  { value: "bestsellers", label: "Bestsellers", hint: "Homepage bestseller pins, then flagged bestsellers." },
  { value: "newIn", label: "New in", hint: "Products marked New In on the catalog." },
  { value: "all", label: "All products", hint: "Latest visible pieces across the shop." },
];

export function StorefrontProductPagePanel() {
  const { storefront, setStorefront, isDirty, saving, msg, save, discard, loading } =
    useStorefrontSettings();

  if (loading || !storefront) {
    return <p className="font-sans text-sm text-[var(--admin-muted)]">Loading product page settings…</p>;
  }

  const modeMeta = SUGGESTED_MODES.find((m) => m.value === (storefront.pdpSuggestedMode ?? "auto"));

  return (
    <CmsPageEditorShell
      title="Suggested products"
      description="Controls the product carousel below each product detail page. The global size chart is edited separately under Website → Size chart."
    >
      <CmsFormGrid>
        <AdminField label="Rail source" className="md:col-span-2">
          <AdminSelect
            className="max-w-md"
            value={storefront.pdpSuggestedMode ?? "auto"}
            onChange={(e) =>
              setStorefront({
                ...storefront,
                pdpSuggestedMode: e.target.value as PdpSuggestedMode,
              })
            }
          >
            {SUGGESTED_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
      </CmsFormGrid>
      {modeMeta ? (
        <p className="font-sans text-xs text-[var(--admin-muted)]">{modeMeta.hint}</p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--admin-border)] pt-6">
        <AdminButton type="button" onClick={() => void save()} disabled={!isDirty || saving}>
          {saving ? "Saving…" : "Save"}
        </AdminButton>
        {isDirty ? (
          <AdminButton type="button" variant="ghost" onClick={discard}>
            Discard
          </AdminButton>
        ) : null}
        {msg ? <p className="font-sans text-xs text-[var(--admin-muted)]">{msg}</p> : null}
      </div>
    </CmsPageEditorShell>
  );
}
