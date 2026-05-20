"use client";

import type { ReactNode } from "react";
import type { HomepageConfig } from "@/types/homepage";
import { sortSlides, sortSections } from "@/components/admin/homepage-editor/context";
import { PreviewCmsImage } from "@/components/admin/homepage-editor/preview/PreviewCmsImage";
import { useAdminProductCatalog } from "@/hooks/use-admin-product-catalog";
import { formatProductIdList } from "@/lib/admin/product-catalog";
import { cn } from "@/lib/cn";
import type { PreviewSectionSlug } from "@/components/admin/homepage-editor/preview/PreviewSectionNav";

const promoVariant: Record<NonNullable<HomepageConfig["topPromoBar"]["variant"]>, string> = {
  ink: "bg-slate-900 text-[#f7f3ee]",
  sand: "bg-[#e8dfd4] text-slate-900",
  gold: "bg-gradient-to-r from-[#f0e6d8] to-[#ebe1d4] text-slate-900",
};

function PanelShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-display text-xl text-slate-900">{title}</h3>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-1.5 font-sans text-sm text-slate-800">{children}</div>
    </div>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700">{children}</pre>;
}

function PreviewProductList({ ids }: { ids: string[] }) {
  const { byId, loading } = useAdminProductCatalog();
  if (ids.length === 0) {
    return <p className="mt-1 text-sm text-slate-500">No products — rail uses catalog defaults.</p>;
  }
  if (loading) {
    return <p className="mt-1 text-sm text-slate-500">Loading product names…</p>;
  }
  const lines = formatProductIdList(ids, byId);
  return <Mono>{lines.join("\n")}</Mono>;
}

export function renderPreviewSection(slug: PreviewSectionSlug, hp: HomepageConfig): ReactNode {
  switch (slug) {
    case "promo-bar":
      return <PreviewPromoBar hp={hp} />;
    case "hero":
      return <PreviewHero hp={hp} />;
    case "home-layout":
      return <PreviewHomeLayout hp={hp} />;
    case "bestsellers":
      return <PreviewBestsellers hp={hp} />;
    case "new-in-home":
      return <PreviewNewInHome hp={hp} />;
    case "new-in-page":
      return <PreviewNewInPage hp={hp} />;
    case "categories":
      return <PreviewCategories hp={hp} />;
    case "collections":
      return <PreviewCollections hp={hp} />;
    case "our-story":
      return <PreviewOurStory hp={hp} />;
    case "newsletter":
      return <PreviewNewsletter hp={hp} />;
    case "footer":
      return <PreviewFooter hp={hp} />;
    default:
      return null;
  }
}

function PreviewPromoBar({ hp }: { hp: HomepageConfig }) {
  const bar = hp.topPromoBar;
  return (
    <PanelShell title="Top promo bar (above nav on storefront)">
      <Field label="Enabled on site">{bar.enabled ? "Yes" : "No"}</Field>
      <Field label="Variant">{bar.variant ?? "ink"}</Field>
      <Field label="Message">{bar.message?.trim() || "—"}</Field>
      <Field label="Link label">{bar.linkLabel?.trim() || "—"}</Field>
      <Field label="Link href">{bar.linkHref?.trim() || "—"}</Field>
      {bar.enabled && bar.message?.trim() ? (
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Strip mock-up</p>
          <div
            className={cn(
              "mt-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-center font-sans text-[11px] font-medium uppercase tracking-[0.12em]",
              promoVariant[bar.variant ?? "ink"],
            )}
          >
            {bar.message.trim()}
            {bar.linkHref?.trim() && bar.linkLabel?.trim() ? (
              <span className="opacity-70">· {bar.linkLabel.trim()}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </PanelShell>
  );
}

function PreviewHero({ hp }: { hp: HomepageConfig }) {
  const slides = sortSlides(hp.carousel.slides);
  const ann = hp.announcements ?? [];
  return (
    <PanelShell title="Hero & legacy hero fields">
      {hp.heroTitle || hp.heroSubtitle || hp.heroImage ? (
        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-slate-400">Legacy hero fields (if used)</p>
          {hp.heroTitle ? <Field label="heroTitle">{hp.heroTitle}</Field> : null}
          {hp.heroSubtitle ? <Field label="heroSubtitle">{hp.heroSubtitle}</Field> : null}
          {hp.heroImage ? (
            <div>
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">heroImage</p>
              <div className="relative mt-2 aspect-[2/1] max-h-48 overflow-hidden rounded-lg bg-slate-200">
                <PreviewCmsImage src={hp.heroImage} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {ann.length > 0 ? (
        <Field label="announcements[]">
          <ul className="list-disc pl-5">
            {ann.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Field>
      ) : (
        <Field label="announcements[]">— (empty)</Field>
      )}
      <Field label="Carousel autoplay (ms)">{hp.carousel.autoplayMs}</Field>
      <div>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Slides (all)</p>
        <div className="mt-3 space-y-4">
          {slides.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-xl border border-slate-100">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 font-sans text-[11px] text-slate-600">
                <span className="font-mono text-slate-800">{s.id}</span>
                <span>·</span>
                <span>order {s.order}</span>
                <span>·</span>
                <span>{s.enabled ? "enabled" : "disabled"}</span>
              </div>
              <div className="grid gap-3 p-3 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-200">
                    <PreviewCmsImage
                      src={s.desktopImage}
                      alt=""
                      className="h-full w-full object-cover"
                      fallbackLabel="No desktop image"
                    />
                  </div>
                  <p className="font-mono text-[10px] text-slate-500">desktopImage</p>
                </div>
                <div className="space-y-2">
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-200">
                    <PreviewCmsImage
                      src={s.mobileImage ?? ""}
                      alt=""
                      className="h-full w-full object-cover"
                      fallbackLabel="No mobile image"
                    />
                  </div>
                  <p className="font-mono text-[10px] text-slate-500">mobileImage</p>
                </div>
              </div>
              <div className="space-y-2 px-3 pb-3">
                <Field label="heading">{s.heading}</Field>
                <Field label="subheading">{s.subheading ?? "—"}</Field>
                <Field label="ctaLabel">{s.ctaLabel ?? "—"}</Field>
                <Field label="ctaHref">{s.ctaHref}</Field>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

function PreviewHomeLayout({ hp }: { hp: HomepageConfig }) {
  const rows = sortSections(hp.sectionsOrder);
  return (
    <PanelShell title="Homepage section order & visibility">
      <p className="font-sans text-sm text-slate-600">
        Order below is top-to-bottom on the homepage (under the hero). Disabled sections are hidden on the storefront.
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[420px] text-left font-sans text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Section id</th>
              <th className="px-3 py-2">Label</th>
              <th className="px-3 py-2">Visible</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-slate-50">
                <td className="px-3 py-2 tabular-nums">{s.order}</td>
                <td className="px-3 py-2 font-mono text-xs">{s.id}</td>
                <td className="px-3 py-2">
                  {s.id === "newIn"
                    ? "New in"
                    : s.id === "bestsellers"
                      ? "Bestsellers"
                      : s.id === "categories"
                        ? "Shop by category"
                        : "Newsletter"}
                </td>
                <td className="px-3 py-2">{s.enabled ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}

function PreviewBestsellers({ hp }: { hp: HomepageConfig }) {
  const b = hp.bestsellers;
  return (
    <PanelShell title="Bestsellers rail (homepage)">
      <Field label="Visible on homepage">{b.enabled !== false ? "Yes" : "No"}</Field>
      <Field label="Title">{b.title}</Field>
      <Field label="Subtitle">{b.subtitle}</Field>
      <Field label={`Products (${b.productIds.length})`}>
        <PreviewProductList ids={b.productIds} />
      </Field>
    </PanelShell>
  );
}

function PreviewNewInHome({ hp }: { hp: HomepageConfig }) {
  const n = hp.newIn;
  return (
    <PanelShell title="New In rail (homepage)">
      <Field label="Visible on homepage">{n.enabled !== false ? "Yes" : "No"}</Field>
      <Field label="Title">{n.title}</Field>
      <Field label="Subtitle">{n.subtitle}</Field>
      <Field label="CTA label">{n.ctaLabel}</Field>
      <Field label="CTA href">{n.ctaHref}</Field>
      <Field label={`Products (${n.productIds.length})`}>
        <PreviewProductList ids={n.productIds} />
      </Field>
    </PanelShell>
  );
}

function PreviewNewInPage({ hp }: { hp: HomepageConfig }) {
  const p = hp.newInPage;
  return (
    <PanelShell title="New In page (/new-in)">
      <Field label="Curated mode (fixed order)">{p.useCuratedOrder ? "On" : "Off"}</Field>
      <Field label="Page heading">{p.heading}</Field>
      <Field label="Page subheading">{p.subheading?.trim() || "—"}</Field>
      <Field label={`Products (${p.productIds?.length ?? 0})`}>
        <PreviewProductList ids={p.productIds ?? []} />
      </Field>
    </PanelShell>
  );
}

function PreviewCategories({ hp }: { hp: HomepageConfig }) {
  const c = hp.categories;
  const items = [...c.items].sort((a, b) => a.order - b.order);
  return (
    <PanelShell title="Shop by category (homepage)">
      <Field label="Section visible on homepage">{c.enabled !== false ? "Yes" : "No"}</Field>
      <Field label="Section title">{c.title}</Field>
      <Field label="Section subtitle">{c.subtitle}</Field>
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">All cards (including disabled)</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((card) => (
          <div key={card.id} className="overflow-hidden rounded-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2 font-sans text-[11px]">
              <span className="font-mono text-slate-700">{card.id}</span>
              <span className={card.enabled ? "text-emerald-700" : "text-slate-400"}>
                {card.enabled ? "Visible" : "Hidden"}
              </span>
            </div>
            <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
              <PreviewCmsImage
                src={card.image}
                alt={card.name}
                className="absolute inset-0 h-full w-full object-cover"
                fallbackLabel="No image"
              />
            </div>
            <div className="space-y-1 p-3">
              <p className="font-display text-base text-slate-900">{card.name}</p>
              <p className="font-mono text-[10px] text-slate-500">order {card.order}</p>
              <p className="break-all font-mono text-[10px] text-slate-600">{card.href}</p>
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function PreviewCollections({ hp }: { hp: HomepageConfig }) {
  const cp = hp.collectionsPage;
  const tabs = [...cp.categories].sort((a, b) => a.order - b.order);
  const pins = cp.pinnedProductIds ?? [];
  return (
    <PanelShell title="Collections page">
      <Field label="Title">{cp.title}</Field>
      <Field label="Subtitle">{cp.subtitle}</Field>
      <Field label="Pagination limit">{cp.paginationLimit}</Field>
      <Field label="Pin products on “All” tab">{cp.usePinnedProducts ? "Yes" : "No"}</Field>
      <div>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          pinnedProductIds ({pins.length})
        </p>
        {pins.length ? <Mono>{pins.join("\n")}</Mono> : <p className="mt-1 text-sm text-slate-500">None</p>}
      </div>
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Category tabs (all)</p>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[520px] text-left font-sans text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">id</th>
              <th className="px-3 py-2">Label</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">value</th>
              <th className="px-3 py-2">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {tabs.map((t) => (
              <tr key={t.id} className="border-b border-slate-50">
                <td className="px-3 py-2 tabular-nums">{t.order}</td>
                <td className="px-3 py-2 font-mono text-xs">{t.id}</td>
                <td className="px-3 py-2">{t.label}</td>
                <td className="px-3 py-2 font-mono text-xs">{t.type}</td>
                <td className="px-3 py-2 font-mono text-xs">{t.value ?? "—"}</td>
                <td className="px-3 py-2">{t.enabled ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}

function PreviewOurStory({ hp }: { hp: HomepageConfig }) {
  const s = hp.ourStoryPage;
  const secs = [...s.sections].sort((a, b) => a.order - b.order);
  return (
    <PanelShell title="Our Story page">
      <Field label="Hero title">{s.title}</Field>
      <Field label="Hero subtitle">{s.subtitle}</Field>
      <Field label="CTA label">{s.ctaLabel}</Field>
      <Field label="CTA href">{s.ctaHref}</Field>
      <div>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Hero image</p>
        <div className="relative mt-2 aspect-[2/1] max-h-56 overflow-hidden rounded-lg bg-slate-200">
          <PreviewCmsImage src={s.heroImage} alt="" className="h-full w-full object-cover" fallbackLabel="No hero image" />
        </div>
      </div>
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Sections (all)</p>
      <div className="space-y-6">
        {secs.map((sec) => (
          <div key={sec.id} className="rounded-xl border border-slate-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="font-mono text-sm text-slate-800">{sec.id}</span>
              <span className="text-xs text-slate-500">
                order {sec.order} · {sec.enabled ? "enabled" : "disabled"}
              </span>
            </div>
            <div className="mt-3 space-y-3">
              <Field label="heading">{sec.heading}</Field>
              <Field label="body">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{sec.body}</p>
              </Field>
              {sec.secondaryBody ? (
                <Field label="secondaryBody">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{sec.secondaryBody}</p>
                </Field>
              ) : null}
              {sec.quote ? <Field label="quote">{sec.quote}</Field> : null}
              {sec.image ? (
                <div>
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">image</p>
                  <div className="relative mt-2 aspect-video max-h-48 overflow-hidden rounded-lg bg-slate-200">
                    <PreviewCmsImage src={sec.image} alt={sec.imageAlt ?? ""} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{sec.imageAlt ?? ""}</p>
                </div>
              ) : null}
              {sec.gallery && sec.gallery.length > 0 ? (
                <div>
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">gallery</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {sec.gallery.map((url, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                        <PreviewCmsImage src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function PreviewNewsletter({ hp }: { hp: HomepageConfig }) {
  const n = hp.newsletter;
  return (
    <PanelShell title="Newsletter (homepage block)">
      <Field label="Visible on homepage">{n.enabled !== false ? "Yes" : "No"}</Field>
      <Field label="Title">{n.title}</Field>
      <Field label="Description">
        <p className="whitespace-pre-wrap leading-relaxed">{n.description}</p>
      </Field>
      <Field label="Input placeholder">{n.placeholder}</Field>
      <Field label="Button label">{n.buttonLabel}</Field>
    </PanelShell>
  );
}

function PreviewFooter({ hp }: { hp: HomepageConfig }) {
  const f = hp.footer;
  const legal = [...f.legalLinks].sort((a, b) => a.order - b.order);
  const social = [...f.socialLinks].sort((a, b) => a.order - b.order);
  const ctas = [...f.ctaLinks].sort((a, b) => a.order - b.order);
  return (
    <PanelShell title="Footer (site-wide)">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Logo</p>
          <div className="relative mt-2 h-12 w-40">
            <PreviewCmsImage
              src={f.logoUrl}
              alt={f.logoAlt}
              className="h-full w-full object-contain object-left"
              fallbackLabel="No logo"
            />
          </div>
          <Field label="logoAlt">{f.logoAlt}</Field>
        </div>
        <div>
          <Field label="brandDescription">
            <p className="whitespace-pre-wrap leading-relaxed">{f.brandDescription}</p>
          </Field>
        </div>
      </div>
      <Field label="supportingText">
        <p className="whitespace-pre-wrap text-sm">{f.supportingText}</p>
      </Field>
      <div className="grid gap-6 border-t border-slate-100 pt-4 md:grid-cols-2">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{f.legalTitle}</p>
          <ul className="mt-2 space-y-1 font-sans text-sm">
            {legal.map((l, i) => (
              <li key={i} className={l.enabled ? "" : "text-slate-400 line-through"}>
                {l.label} → {l.href}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{f.contactTitle}</p>
          <ul className="mt-2 space-y-1 font-sans text-sm">
            <li>{f.email}</li>
            <li>{f.phone}</li>
            <li>{f.location}</li>
          </ul>
          <p className="mt-3 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Social</p>
          <ul className="mt-1 space-y-1 font-mono text-xs">
            {social.map((s, i) => (
              <li key={i} className={s.enabled ? "" : "text-slate-400 line-through"}>
                {s.platform}: {s.href}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Footer CTAs</p>
        <ul className="mt-2 space-y-1 font-sans text-sm">
          {ctas.map((c, i) => (
            <li key={i} className={c.enabled ? "" : "text-slate-400 line-through"}>
              {c.label} → {c.href}
            </li>
          ))}
        </ul>
      </div>
      <Field label="copyrightText">{f.copyrightText}</Field>
    </PanelShell>
  );
}
