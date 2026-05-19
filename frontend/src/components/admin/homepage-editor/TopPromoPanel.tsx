"use client";

import { SectionTypographyFields } from "@/components/admin/cms/SectionTypographyFields";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";

export function ContentEditorTopPromoPanel() {
  const { hp, setHp } = useHomepageEditor();
  if (!hp) return null;

  const bar = hp.topPromoBar;

  return (
    <section className="admin-surface-elevated p-6 sm:p-8">
      <h2 className="font-sans text-xl font-semibold tracking-tight text-[var(--admin-ink)] sm:text-2xl">Top promo bar</h2>
      <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
        A slim strip above the main navigation on every storefront page — ideal for coupon codes, free shipping, or
        short announcements. Shoppers can scroll the line horizontally on small screens and close it with the ×; it
        stays hidden until you change the message (same browser).
      </p>

      <label className="mt-6 flex items-center gap-2 font-sans text-sm text-[var(--admin-muted)]">
        <input
          type="checkbox"
          checked={bar.enabled === true}
          onChange={(e) =>
            setHp({
              ...hp,
              topPromoBar: { ...bar, enabled: e.target.checked },
            })
          }
        />
        Show on live site
      </label>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
          Message (plain text, one line — use scroll on phones if long)
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder='e.g. Use code NAYA10 for 10% off your first order'
            value={bar.message}
            onChange={(e) =>
              setHp({
                ...hp,
                topPromoBar: { ...bar, message: e.target.value },
              })
            }
          />
        </label>
        <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
          Optional link label
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Shop sale"
            value={bar.linkLabel ?? ""}
            onChange={(e) =>
              setHp({
                ...hp,
                topPromoBar: { ...bar, linkLabel: e.target.value },
              })
            }
          />
        </label>
        <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
          Optional link URL
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="/collections"
            value={bar.linkHref ?? ""}
            onChange={(e) =>
              setHp({
                ...hp,
                topPromoBar: { ...bar, linkHref: e.target.value },
              })
            }
          />
        </label>
        <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
          Style
          <select
            className="mt-2 w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
          </select>
        </label>
      </div>
      <SectionTypographyFields section="promoBar" />
    </section>
  );
}
