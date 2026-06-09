"use client";

import { HeroCarouselEditor } from "@/components/admin/cms/HeroCarouselEditor";
import { CmsLayoutTabLink } from "@/components/admin/cms/CmsLayoutTabLink";
import { CmsEditorSaveActions } from "@/components/admin/cms/CmsEditorSaveActions";
import { CmsSectionEditorShell } from "@/components/admin/cms/CmsSectionEditorShell";
import { CmsFieldGroup } from "@/components/admin/cms/CmsFieldGroup";
import {
  CmsFormGrid,
  CmsPageEditorShell,
  CmsSectionHeading,
  CmsVisibilityToggle,
  CmsStorePagePublishToggle,
} from "@/components/admin/cms/CmsFormHelpers";
import { CmsImageUrlField } from "@/components/admin/cms/CmsImageUrlField";
import { SectionDesignFields } from "@/components/admin/cms/SectionDesignFields";
import { SectionTypographyFields } from "@/components/admin/cms/SectionTypographyFields";
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { HomepageLayoutSectionList } from "@/components/admin/homepage-editor/HomepageLayoutSectionList";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { DEFAULT_COLLECTIONS_PAGE } from "@/lib/cms/collections-page-config";
import { GlobalCategoriesEditor } from "@/components/admin/cms/GlobalCategoriesEditor";
import { getGlobalCategories, moveGlobalCategory, newGlobalCategory } from "@/lib/cms/global-categories";
import {
  BESTSELLERS_HOMEPAGE_VISIBLE,
  BESTSELLERS_RAIL_MAX,
} from "@/lib/cms/homepage-product-limits";
import { homepageSectionEditUrl } from "@/lib/admin/homepage-edit";
import { apiFetch } from "@/lib/api";

export function ContentEditorHeroPanel() {
  return <HeroCarouselEditor />;
}

export function ContentEditorHomeLayoutPanel() {
  return (
    <section id="admin-section-home-order" className="admin-surface-elevated p-6 sm:p-8">
      <h2 className="font-sans text-xl font-semibold tracking-tight text-[var(--admin-ink)] sm:text-2xl">
        Homepage section order
      </h2>
      <p className="mt-2 font-sans text-sm text-slate-500">
        Reorder all homepage blocks. Changes apply on the live storefront after you save.
      </p>
      <div className="mt-6">
        <HomepageLayoutSectionList showGlobalChrome={false} />
      </div>
      <div className="mt-6 border-t border-[var(--admin-border)] pt-5">
        <CmsEditorSaveActions compact />
      </div>
    </section>
  );
}

export function ContentEditorBestsellersPanel() {
  const { hp, setHp, token } = useHomepageEditor();
  if (!hp) return null;

  const contentTab = (
    <div className="space-y-6">
      <CmsVisibilityToggle
        checked={hp.bestsellers.enabled !== false}
        onChange={(enabled) =>
          setHp({
            ...hp,
            bestsellers: { ...hp.bestsellers, enabled },
          })
        }
      />
      <CmsFormGrid>
        <AdminField
          label="Eyebrow (optional)"
          hint="Small uppercase line above the title — e.g. Curated. Leave blank to hide."
          className="md:col-span-2"
        >
          <AdminInput
            value={hp.bestsellers.kicker ?? ""}
            onChange={(e) =>
              setHp({ ...hp, bestsellers: { ...hp.bestsellers, kicker: e.target.value } })
            }
          />
        </AdminField>
        <AdminField label="Title">
          <AdminInput
            value={hp.bestsellers.title}
            onChange={(e) =>
              setHp({ ...hp, bestsellers: { ...hp.bestsellers, title: e.target.value } })
            }
          />
        </AdminField>
        <AdminField label="Subtitle" className="md:col-span-2">
          <AdminInput
            value={hp.bestsellers.subtitle}
            onChange={(e) =>
              setHp({ ...hp, bestsellers: { ...hp.bestsellers, subtitle: e.target.value } })
            }
          />
        </AdminField>
        <div className="md:col-span-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-sunken)] px-4 py-4">
          <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">How it works</p>
          <p className="mt-1 font-sans text-xs leading-relaxed text-[var(--admin-muted)]">
            Products marked as <strong className="font-medium text-[var(--admin-ink)]">Bestseller</strong> in their
            Shop display tab automatically appear here. Up to 8 show on the homepage. No manual pinning needed.
          </p>
        </div>
      </CmsFormGrid>
    </div>
  );

  return (
    <CmsSectionEditorShell
      sectionId="admin-section-bestsellers"
      title="Bestsellers rail"
      description="Curated product carousel on the homepage."
      previewHref="/admin/content/preview/bestsellers"
      tabs={[
        { id: "content", content: contentTab },
        {
          id: "design",
          content: (
            <div className="space-y-8">
              <SectionDesignFields
                value={hp.bestsellers.styles}
                onChange={(styles) => setHp({ ...hp, bestsellers: { ...hp.bestsellers, styles } })}
                showTypography
              />
              <SectionTypographyFields section="bestsellers" />
            </div>
          ),
        },
        { id: "layout", content: <CmsLayoutTabLink /> },
        { id: "seo", disabled: true, content: null },
        { id: "responsive", disabled: true, content: null },
        { id: "advanced", disabled: true, content: null },
      ]}
    />
  );
}

export function ContentEditorNewInHomePanel() {
  const { hp, setHp, token } = useHomepageEditor();
  if (!hp) return null;

  const contentTab = (
    <div className="space-y-6">
      <CmsVisibilityToggle
        checked={hp.newIn.enabled !== false}
        onChange={(enabled) => setHp({ ...hp, newIn: { ...hp.newIn, enabled } })}
      />
      <CmsFormGrid>
        <AdminField
          label="Eyebrow (optional)"
          hint="Small line above the title. Leave blank to hide."
          className="md:col-span-2"
        >
          <AdminInput
            value={hp.newIn.kicker ?? ""}
            onChange={(e) => setHp({ ...hp, newIn: { ...hp.newIn, kicker: e.target.value } })}
          />
        </AdminField>
        <AdminField label="Title">
          <AdminInput
            value={hp.newIn.title}
            onChange={(e) => setHp({ ...hp, newIn: { ...hp.newIn, title: e.target.value } })}
          />
        </AdminField>
        <AdminField label="Subtitle" className="md:col-span-2">
          <AdminInput
            value={hp.newIn.subtitle}
            onChange={(e) => setHp({ ...hp, newIn: { ...hp.newIn, subtitle: e.target.value } })}
          />
        </AdminField>
        <AdminField label="CTA label">
          <AdminInput
            value={hp.newIn.ctaLabel}
            onChange={(e) => setHp({ ...hp, newIn: { ...hp.newIn, ctaLabel: e.target.value } })}
          />
        </AdminField>
        <AdminField label="CTA URL">
          <AdminInput
            value={hp.newIn.ctaHref}
            onChange={(e) => setHp({ ...hp, newIn: { ...hp.newIn, ctaHref: e.target.value } })}
          />
        </AdminField>
        <div className="md:col-span-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-sunken)] px-4 py-4">
          <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">How it works</p>
          <p className="mt-1 font-sans text-xs leading-relaxed text-[var(--admin-muted)]">
            Products marked as <strong className="font-medium text-[var(--admin-ink)]">New In</strong> in their
            Shop display tab automatically appear here. Up to 8 show on the homepage. No manual pinning needed.
          </p>
        </div>
      </CmsFormGrid>
    </div>
  );

  return (
    <CmsSectionEditorShell
      sectionId="admin-section-newin-home"
      title="New In rail"
      description="Latest pieces on the homepage."
      previewHref="/admin/content/preview/new-in-home"
      tabs={[
        { id: "content", content: contentTab },
        {
          id: "design",
          content: (
            <div className="space-y-8">
              <SectionDesignFields
                value={hp.newIn.styles}
                onChange={(styles) => setHp({ ...hp, newIn: { ...hp.newIn, styles } })}
                showTypography
              />
              <SectionTypographyFields section="newIn" />
            </div>
          ),
        },
        { id: "layout", content: <CmsLayoutTabLink /> },
        { id: "seo", disabled: true, content: null },
        { id: "responsive", disabled: true, content: null },
        { id: "advanced", disabled: true, content: null },
      ]}
    />
  );
}

export function ContentEditorNewInPagePanel({ embedded = false }: { embedded?: boolean }) {
  const { hp, setHp, token } = useHomepageEditor();
  if (!hp) return null;
  return (
    <CmsPageEditorShell
      id="admin-section-newin-page"
      embedded={embedded}
      title="New In page (/new-in)"
      description="Turn on curated mode to control exactly which products appear and in which order on the public New In page. When off, the page lists every catalog item flagged as New In."
    >
      <CmsStorePagePublishToggle
        route="/new-in"
        checked={hp.newInPage?.enabled !== false}
        onChange={(enabled) =>
          setHp({
            ...hp,
            newInPage: {
              ...hp.newInPage,
              enabled,
              useCuratedOrder: hp.newInPage?.useCuratedOrder ?? false,
              heading: hp.newInPage?.heading ?? "New In",
              subheading: hp.newInPage?.subheading ?? "",
              productIds: hp.newInPage?.productIds ?? [],
            },
          })
        }
      />
      <div className="mt-4">
        <CmsVisibilityToggle
          label="Curated grid (fixed products & order)"
          checked={hp.newInPage?.useCuratedOrder === true}
          onChange={(useCuratedOrder) =>
            setHp({
              ...hp,
              newInPage: {
                ...hp.newInPage,
                useCuratedOrder,
                heading: hp.newInPage?.heading ?? "New In",
                subheading: hp.newInPage?.subheading ?? "",
                productIds: hp.newInPage?.productIds ?? [],
              },
            })
          }
        />
      </div>
      <CmsFormGrid className="mt-6">
        <AdminField label="Page heading">
          <AdminInput
            value={hp.newInPage?.heading ?? "New In"}
            onChange={(e) =>
              setHp({
                ...hp,
                newInPage: {
                  ...hp.newInPage,
                  useCuratedOrder: hp.newInPage?.useCuratedOrder ?? false,
                  heading: e.target.value,
                  subheading: hp.newInPage?.subheading ?? "",
                  productIds: hp.newInPage?.productIds ?? [],
                },
              })
            }
          />
        </AdminField>
        <AdminField label="Page subheading (optional)" className="md:col-span-2">
          <AdminInput
            value={hp.newInPage?.subheading ?? ""}
            onChange={(e) =>
              setHp({
                ...hp,
                newInPage: {
                  ...hp.newInPage,
                  useCuratedOrder: hp.newInPage?.useCuratedOrder ?? false,
                  heading: hp.newInPage?.heading ?? "New In",
                  subheading: e.target.value,
                  productIds: hp.newInPage?.productIds ?? [],
                },
              })
            }
          />
        </AdminField>
      </CmsFormGrid>
      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-sunken)] px-4 py-4">
          <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">How it works</p>
          <p className="mt-1 font-sans text-xs leading-relaxed text-[var(--admin-muted)]">
            Products marked as <strong className="font-medium text-[var(--admin-ink)]">New In</strong> in their
            Shop display tab automatically appear on this page. No manual pinning needed.
          </p>
        </div>
    </CmsPageEditorShell>
  );
}

export function ContentEditorCategoriesPanel() {
  const { hp, setHp, patchGlobalCategories, token } = useHomepageEditor();
  if (!hp) return null;

  const globals = getGlobalCategories(hp);

  async function syncFromProducts() {
    if (!token) return;
    try {
      const data = await apiFetch<{ products: { category: string }[] }>(
        "/products?limit=500",
        { token },
      );
      const productCategories = [...new Set(
        (data.products ?? []).map((p) => p.category).filter(Boolean),
      )];
      if (productCategories.length === 0) return;

      patchGlobalCategories((list) => {
        const existingSlugs = new Set(list.map((c) => c.name.toLowerCase()));
        const newOnes = productCategories
          .filter((cat) => !existingSlugs.has(cat.toLowerCase()))
          .map((cat, i) => {
            const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            return {
              ...newGlobalCategory(list.length + i),
              id: `cat-${slug}`,
              name: cat,
              slug,
            };
          });
        return [...list, ...newOnes];
      });
    } catch {
      // silently fail
    }
  }

  const contentTab = (
    <div className="space-y-6">
      <CmsVisibilityToggle
        checked={hp.categories.enabled !== false}
        onChange={(enabled) =>
          setHp({
            ...hp,
            categories: { ...hp.categories, enabled },
          })
        }
      />
      <CmsFormGrid>
        <AdminField
          label="Eyebrow (optional)"
          hint="Small line above the title — e.g. Explore. Leave blank to hide."
          className="md:col-span-2"
        >
          <AdminInput
            value={hp.categories.kicker ?? ""}
            onChange={(e) =>
              setHp({ ...hp, categories: { ...hp.categories, kicker: e.target.value } })
            }
          />
        </AdminField>
        <AdminField label="Section title" className="md:col-span-2">
          <AdminInput
            value={hp.categories.title}
            onChange={(e) =>
              setHp({ ...hp, categories: { ...hp.categories, title: e.target.value } })
            }
          />
        </AdminField>
        <AdminField label="Section subtitle" className="md:col-span-2">
          <AdminInput
            value={hp.categories.subtitle}
            onChange={(e) =>
              setHp({ ...hp, categories: { ...hp.categories, subtitle: e.target.value } })
            }
          />
        </AdminField>
      </CmsFormGrid>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => patchGlobalCategories((list) => [...list, newGlobalCategory(list.length)])}
        >
          + Add category manually
        </AdminButton>
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void syncFromProducts()}
        >
          Sync from products
        </AdminButton>
      </div>

      {globals.length > 0 ? (
        <GlobalCategoriesEditor
          categories={globals}
          token={token}
          onChange={(next) => patchGlobalCategories(() => next)}
          onAdd={() =>
            patchGlobalCategories((list) => [...list, newGlobalCategory(list.length)])
          }
          onRemove={(id) => patchGlobalCategories((list) => list.filter((c) => c.id !== id))}
          onMove={(index, dir) => patchGlobalCategories((list) => moveGlobalCategory(list, index, dir))}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--admin-border)] px-4 py-8 text-center">
          <p className="font-sans text-sm text-[var(--admin-muted)]">
            No categories yet.
          </p>
          <p className="mt-1 font-sans text-xs text-[var(--admin-faint)]">
            Click &quot;Sync from products&quot; to pull categories from your catalog, or add them manually.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <CmsSectionEditorShell
      sectionId="admin-section-categories"
      title="Shop by category"
      description="Category cards linking into collections."
      previewHref="/admin/content/preview/categories"
      tabs={[
        { id: "content", content: contentTab },
        {
          id: "design",
          content: (
            <div className="space-y-8">
              <SectionDesignFields
                value={hp.categories.styles}
                onChange={(styles) => setHp({ ...hp, categories: { ...hp.categories, styles } })}
                showTypography
              />
              <SectionTypographyFields section="categories" />
            </div>
          ),
        },
        { id: "layout", content: <CmsLayoutTabLink /> },
        { id: "seo", disabled: true, content: null },
        { id: "responsive", disabled: true, content: null },
        { id: "advanced", disabled: true, content: null },
      ]}
    />
  );
}

export function ContentEditorCollectionsPanel({ embedded = false }: { embedded?: boolean }) {
  const { hp, setHp, token, updateCollectionsCategory } = useHomepageEditor();
  if (!hp) return null;

  const cp = hp.collectionsPage;
  const filters = cp.filters ?? DEFAULT_COLLECTIONS_PAGE.filters!;
  const messages = cp.messages ?? DEFAULT_COLLECTIONS_PAGE.messages!;
  const kicker = cp.kicker ?? DEFAULT_COLLECTIONS_PAGE.kicker;

  const patchCollections = (patch: Partial<typeof cp>) =>
    setHp({ ...hp, collectionsPage: { ...cp, ...patch } });

  const patchFilters = (patch: Partial<typeof filters>) =>
    patchCollections({ filters: { ...filters, ...patch } });

  const patchMessages = (patch: Partial<typeof messages>) =>
    patchCollections({ messages: { ...messages, ...patch } });

  const fieldLabel = "admin-cms-field-label block";
  const fieldInput = "admin-input mt-1.5 w-full";

  return (
    <CmsPageEditorShell
      id="admin-section-collections"
      embedded={embedded}
      title="Collections browse (/collections)"
      description="Full control of the public collections page — header, category tabs, filters, sort options, copy, and pinned products."
    >
      <CmsStorePagePublishToggle
        route="/collections"
        checked={cp.enabled !== false}
        onChange={(enabled) => patchCollections({ enabled })}
      />
      <CmsFieldGroup title="Page header" className="mt-6">
        <CmsFormGrid>
          <AdminField label="Kicker" hint="Small line above title.">
            <AdminInput value={kicker} onChange={(e) => patchCollections({ kicker: e.target.value })} />
          </AdminField>
          <AdminField label="Pagination limit">
            <AdminInput
              type="number"
              min={8}
              max={48}
              value={cp.paginationLimit}
              onChange={(e) =>
                patchCollections({ paginationLimit: Number(e.target.value) || 16 })
              }
            />
          </AdminField>
          <AdminField label="Page title" className="md:col-span-2">
            <AdminInput value={cp.title} onChange={(e) => patchCollections({ title: e.target.value })} />
          </AdminField>
          <AdminField label="Page subtitle" className="md:col-span-2">
            <AdminInput value={cp.subtitle} onChange={(e) => patchCollections({ subtitle: e.target.value })} />
          </AdminField>
        </CmsFormGrid>
      </CmsFieldGroup>

      <CmsFieldGroup title="Filters & sort">
      <div className="mt-4 flex flex-wrap gap-4">
        {(
          [
            ["showSize", "Size filter"],
            ["showColor", "Color filter"],
            ["showPrice", "Price filter"],
            ["showAvailability", "Availability filter"],
            ["showSort", "Sort filter"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="admin-cms-toggle">
            <input
              type="checkbox"
              checked={filters[key]}
              onChange={(e) => patchFilters({ [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className={fieldLabel}>
          Size options (comma-separated)
          <input
            className={fieldInput}
            value={filters.sizeOptions.join(", ")}
            onChange={(e) =>
              patchFilters({
                sizeOptions: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label className={fieldLabel}>
          Color options (comma-separated)
          <input
            className={fieldInput}
            value={filters.colorOptions.join(", ")}
            onChange={(e) =>
              patchFilters({
                colorOptions: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label className={fieldLabel}>
          Default sort
          <select
            className={fieldInput}
            value={filters.defaultSort}
            onChange={(e) =>
              patchFilters({
                defaultSort: e.target.value as typeof filters.defaultSort,
              })
            }
          >
            {filters.sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 space-y-3">
        <p className={fieldLabel}>Price bands</p>
        {filters.priceBands.map((band, i) => (
          <div key={band.id} className="grid gap-2 rounded-xl border border-slate-100 p-3 md:grid-cols-[1fr_5rem_5rem_auto]">
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Label"
              value={band.label}
              onChange={(e) => {
                const next = [...filters.priceBands];
                next[i] = { ...band, label: e.target.value };
                patchFilters({ priceBands: next });
              }}
            />
            <input
              type="number"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Min"
              value={band.min}
              onChange={(e) => {
                const next = [...filters.priceBands];
                next[i] = { ...band, min: Number(e.target.value) || 0 };
                patchFilters({ priceBands: next });
              }}
            />
            <input
              type="number"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Max"
              value={band.max ?? ""}
              onChange={(e) => {
                const next = [...filters.priceBands];
                next[i] = {
                  ...band,
                  max: e.target.value === "" ? undefined : Number(e.target.value) || 0,
                };
                patchFilters({ priceBands: next });
              }}
            />
            <label className="flex items-center gap-2 self-center font-sans text-xs text-slate-600">
              <input
                type="checkbox"
                checked={band.enabled}
                onChange={(e) => {
                  const next = [...filters.priceBands];
                  next[i] = { ...band, enabled: e.target.checked };
                  patchFilters({ priceBands: next });
                }}
              />
              On
            </label>
          </div>
        ))}
        <button
          type="button"
          className="rounded-full border border-slate-200 px-4 py-1.5 font-sans text-[11px] uppercase tracking-[0.18em] text-slate-700"
          onClick={() =>
            patchFilters({
              priceBands: [
                ...filters.priceBands,
                {
                  id: `band-${Date.now()}`,
                  label: "New band",
                  min: 0,
                  max: 10000,
                  enabled: true,
                },
              ],
            })
          }
        >
          Add price band
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <p className={fieldLabel}>Sort options</p>
        {filters.sortOptions.map((opt, i) => (
          <div key={opt.value} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3">
            <span className="font-mono text-xs text-slate-400">{opt.value}</span>
            <input
              className="min-w-[10rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={opt.label}
              onChange={(e) => {
                const next = [...filters.sortOptions];
                next[i] = { ...opt, label: e.target.value };
                patchFilters({ sortOptions: next });
              }}
            />
            <label className="flex items-center gap-2 font-sans text-xs text-slate-600">
              <input
                type="checkbox"
                checked={opt.enabled}
                onChange={(e) => {
                  const next = [...filters.sortOptions];
                  next[i] = { ...opt, enabled: e.target.checked };
                  patchFilters({ sortOptions: next });
                }}
              />
              Enabled
            </label>
          </div>
        ))}
      </div>

      <CmsSectionHeading>Page messages</CmsSectionHeading>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className={fieldLabel}>
          Loading message
          <input
            className={fieldInput}
            value={messages.loading}
            onChange={(e) => patchMessages({ loading: e.target.value })}
          />
        </label>
        <label className={fieldLabel}>
          Empty results message
          <input
            className={fieldInput}
            value={messages.empty}
            onChange={(e) => patchMessages({ empty: e.target.value })}
          />
        </label>
        <label className={fieldLabel}>
          Mobile filters button
          <input
            className={fieldInput}
            value={messages.mobileFiltersLabel}
            onChange={(e) => patchMessages({ mobileFiltersLabel: e.target.value })}
          />
        </label>
        <label className={fieldLabel}>
          Mobile drawer title
          <input
            className={fieldInput}
            value={messages.mobileDrawerTitle}
            onChange={(e) => patchMessages({ mobileDrawerTitle: e.target.value })}
          />
        </label>
        <label className={fieldLabel}>
          “All” filter label
          <input
            className={fieldInput}
            value={messages.filterAll}
            onChange={(e) => patchMessages({ filterAll: e.target.value })}
          />
        </label>
        <label className={fieldLabel}>
          In-stock label
          <input
            className={fieldInput}
            value={messages.availabilityInStock}
            onChange={(e) => patchMessages({ availabilityInStock: e.target.value })}
          />
        </label>
      </div>

      </CmsFieldGroup>

      <CmsFieldGroup title="Collection tabs">
        <p className="mt-2 font-sans text-xs text-slate-500">
          Catalog category tabs are synced from{" "}
          <a href={homepageSectionEditUrl("categories")} className="font-medium text-[var(--admin-accent)] underline-offset-2 hover:underline">
            Shop by category
          </a>
          . Edit All / Bestselling below.
        </p>
        <div className="mt-4 space-y-5">
          {cp.categories
            .filter((cat) => cat.type === "all" || cat.type === "bestselling" || cat.type === "newIn")
            .sort((a, b) => a.order - b.order)
            .map((cat) => (
              <div key={cat.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                    {cat.type === "all" ? "All products tab" : "Bestselling tab"}
                  </span>
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={cat.enabled}
                      onChange={(e) =>
                        updateCollectionsCategory(cat.id, { enabled: e.target.checked })
                      }
                    />
                    Enabled
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Label"
                    value={cat.label}
                    onChange={(e) => updateCollectionsCategory(cat.id, { label: e.target.value })}
                  />
                  <input
                    type="number"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={cat.order}
                    onChange={(e) =>
                      updateCollectionsCategory(cat.id, { order: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            ))}
        </div>
        {cp.categories.filter((c) => c.type === "category").length > 0 ? (
          <ul className="mt-5 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Synced catalog tabs
            </p>
            {cp.categories
              .filter((c) => c.type === "category")
              .sort((a, b) => a.order - b.order)
              .map((c) => (
                <li key={c.id} className="flex justify-between gap-2 font-sans text-sm text-slate-700">
                  <span>{c.label}</span>
                  <span className="font-mono text-xs text-slate-400">{c.value}</span>
                </li>
              ))}
          </ul>
        ) : null}
      </CmsFieldGroup>
    </CmsPageEditorShell>
  );
}

export function ContentEditorOurStoryPanel({ embedded = false }: { embedded?: boolean }) {
  const { hp, setHp, token } = useHomepageEditor();
  if (!hp) return null;
  return (
    <section
      id="admin-section-our-story"
      className={embedded ? "space-y-8 p-6 sm:p-8" : "admin-surface-elevated space-y-8 p-6 sm:p-8"}
    >
            <header>
              <h2 className="font-sans text-xl font-semibold tracking-tight text-[var(--admin-ink)] sm:text-2xl">Our Story page</h2>
              <p className="mt-2 font-sans text-sm text-[var(--admin-muted)]">
                Control hero content, cinematic sections, manifesto quote, CTA, and section order/visibility.
              </p>
            </header>
            <CmsStorePagePublishToggle
              route="/our-story"
              checked={hp.ourStoryPage.enabled !== false}
              onChange={(enabled) =>
                setHp({
                  ...hp,
                  ourStoryPage: { ...hp.ourStoryPage, enabled },
                })
              }
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <AdminField label="Hero title">
                <AdminInput
                  value={hp.ourStoryPage.title}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      ourStoryPage: { ...hp.ourStoryPage, title: e.target.value },
                    })
                  }
                />
              </AdminField>
              <CmsImageUrlField
                label="Hero image URL"
                token={token}
                value={hp.ourStoryPage.heroImage}
                onChange={(heroImage) =>
                  setHp({
                    ...hp,
                    ourStoryPage: { ...hp.ourStoryPage, heroImage },
                  })
                }
              />
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Hero subtitle
                <textarea
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.ourStoryPage.subtitle}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      ourStoryPage: { ...hp.ourStoryPage, subtitle: e.target.value },
                    })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                CTA label
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.ourStoryPage.ctaLabel}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      ourStoryPage: { ...hp.ourStoryPage, ctaLabel: e.target.value },
                    })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                CTA URL
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.ourStoryPage.ctaHref}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      ourStoryPage: { ...hp.ourStoryPage, ctaHref: e.target.value },
                    })
                  }
                />
              </label>
            </div>
    
            <div className="mt-8 space-y-5">
              {hp.ourStoryPage.sections
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div key={section.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                        {section.id}
                      </span>
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={(e) =>
                            setHp({
                              ...hp,
                              ourStoryPage: {
                                ...hp.ourStoryPage,
                                sections: hp.ourStoryPage.sections.map((s) =>
                                  s.id === section.id ? { ...s, enabled: e.target.checked } : s,
                                ),
                              },
                            })
                          }
                        />
                        Enabled
                      </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Heading"
                        value={section.heading}
                        onChange={(e) =>
                          setHp({
                            ...hp,
                            ourStoryPage: {
                              ...hp.ourStoryPage,
                              sections: hp.ourStoryPage.sections.map((s) =>
                                s.id === section.id ? { ...s, heading: e.target.value } : s,
                              ),
                            },
                          })
                        }
                      />
                      <input
                        type="number"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Order"
                        value={section.order}
                        onChange={(e) =>
                          setHp({
                            ...hp,
                            ourStoryPage: {
                              ...hp.ourStoryPage,
                              sections: hp.ourStoryPage.sections.map((s) =>
                                s.id === section.id ? { ...s, order: Number(e.target.value) || 0 } : s,
                              ),
                            },
                          })
                        }
                      />
                      <textarea
                        rows={3}
                        className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Body"
                        value={section.body}
                        onChange={(e) =>
                          setHp({
                            ...hp,
                            ourStoryPage: {
                              ...hp.ourStoryPage,
                              sections: hp.ourStoryPage.sections.map((s) =>
                                s.id === section.id ? { ...s, body: e.target.value } : s,
                              ),
                            },
                          })
                        }
                      />
                      <textarea
                        rows={2}
                        className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Secondary body"
                        value={section.secondaryBody ?? ""}
                        onChange={(e) =>
                          setHp({
                            ...hp,
                            ourStoryPage: {
                              ...hp.ourStoryPage,
                              sections: hp.ourStoryPage.sections.map((s) =>
                                s.id === section.id ? { ...s, secondaryBody: e.target.value } : s,
                              ),
                            },
                          })
                        }
                      />
                      <CmsImageUrlField
                        label="Section image URL"
                        token={token}
                        value={section.image ?? ""}
                        onChange={(image) =>
                          setHp({
                            ...hp,
                            ourStoryPage: {
                              ...hp.ourStoryPage,
                              sections: hp.ourStoryPage.sections.map((s) =>
                                s.id === section.id ? { ...s, image } : s,
                              ),
                            },
                          })
                        }
                      />
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Image alt"
                        value={section.imageAlt ?? ""}
                        onChange={(e) =>
                          setHp({
                            ...hp,
                            ourStoryPage: {
                              ...hp.ourStoryPage,
                              sections: hp.ourStoryPage.sections.map((s) =>
                                s.id === section.id ? { ...s, imageAlt: e.target.value } : s,
                              ),
                            },
                          })
                        }
                      />
                      <input
                        className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Quote (manifesto)"
                        value={section.quote ?? ""}
                        onChange={(e) =>
                          setHp({
                            ...hp,
                            ourStoryPage: {
                              ...hp.ourStoryPage,
                              sections: hp.ourStoryPage.sections.map((s) =>
                                s.id === section.id ? { ...s, quote: e.target.value } : s,
                              ),
                            },
                          })
                        }
                      />
                      <textarea
                        rows={2}
                        className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Gallery image URLs (comma separated)"
                        value={(section.gallery ?? []).join(",")}
                        onChange={(e) =>
                          setHp({
                            ...hp,
                            ourStoryPage: {
                              ...hp.ourStoryPage,
                              sections: hp.ourStoryPage.sections.map((s) =>
                                s.id === section.id
                                  ? {
                                      ...s,
                                      gallery: e.target.value
                                        .split(",")
                                        .map((x) => x.trim())
                                        .filter(Boolean),
                                    }
                                  : s,
                              ),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
            </div>
            <div className="border-t border-[var(--admin-border)] pt-5">
              <CmsEditorSaveActions compact />
            </div>
          </section>
  );
}

export function ContentEditorFooterPanel() {
  const { hp, setHp, token } = useHomepageEditor();
  if (!hp) return null;
  return (
    <section id="admin-section-footer" className="admin-surface-elevated p-6 sm:p-8">
            <h2 className="font-sans text-xl font-semibold tracking-tight text-[var(--admin-ink)] sm:text-2xl">Footer</h2>
            <p className="mt-2 font-sans text-sm text-slate-500">
              Manage luxury footer content: brand text, legal links, contact, socials, and CTA links.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <CmsImageUrlField
                label="Logo URL"
                token={token}
                value={hp.footer.logoUrl ?? ""}
                onChange={(logoUrl) => setHp({ ...hp, footer: { ...hp.footer, logoUrl } })}
              />
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Logo alt
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.footer.logoAlt}
                  onChange={(e) => setHp({ ...hp, footer: { ...hp.footer, logoAlt: e.target.value } })}
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Brand description
                <textarea
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.footer.brandDescription}
                  onChange={(e) =>
                    setHp({ ...hp, footer: { ...hp.footer, brandDescription: e.target.value } })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Supporting text
                <textarea
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.footer.supportingText}
                  onChange={(e) =>
                    setHp({ ...hp, footer: { ...hp.footer, supportingText: e.target.value } })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Contact title
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.footer.contactTitle}
                  onChange={(e) => setHp({ ...hp, footer: { ...hp.footer, contactTitle: e.target.value } })}
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Legal title
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.footer.legalTitle}
                  onChange={(e) => setHp({ ...hp, footer: { ...hp.footer, legalTitle: e.target.value } })}
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Email
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.footer.email}
                  onChange={(e) => setHp({ ...hp, footer: { ...hp.footer, email: e.target.value } })}
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Phone
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.footer.phone}
                  onChange={(e) => setHp({ ...hp, footer: { ...hp.footer, phone: e.target.value } })}
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Location
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.footer.location}
                  onChange={(e) => setHp({ ...hp, footer: { ...hp.footer, location: e.target.value } })}
                />
              </label>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <p className="font-sans text-sm text-slate-500 md:col-span-2">
                Policy links in the footer are managed in{" "}
                <a href="/admin/website/legal-pages" className="font-medium text-[var(--admin-accent)] underline-offset-2 hover:underline">
                  Website → Legal pages
                </a>
                . The field below is a fallback only when no legal pages exist in the database.
              </p>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Legal links fallback (label|href|enabled|order per line)
                <textarea
                  rows={6}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
                  value={hp.footer.legalLinks
                    .map((l) => `${l.label}|${l.href}|${l.enabled ? "1" : "0"}|${l.order}`)
                    .join("\n")}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      footer: {
                        ...hp.footer,
                        legalLinks: e.target.value
                          .split("\n")
                          .map((row, idx) => row.trim())
                          .filter(Boolean)
                          .map((row, idx) => {
                            const [label = "", href = "", enabled = "1", order = String(idx)] = row.split("|");
                            return {
                              label: label.trim(),
                              href: href.trim(),
                              enabled: enabled.trim() !== "0",
                              order: Number(order) || idx,
                            };
                          }),
                      },
                    })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Social links (platform|href|enabled|order per line)
                <textarea
                  rows={6}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
                  value={hp.footer.socialLinks
                    .map((l) => `${l.platform}|${l.href}|${l.enabled ? "1" : "0"}|${l.order}`)
                    .join("\n")}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      footer: {
                        ...hp.footer,
                        socialLinks: e.target.value
                          .split("\n")
                          .map((row) => row.trim())
                          .filter(Boolean)
                          .map((row, idx) => {
                            const [platform = "instagram", href = "", enabled = "1", order = String(idx)] = row.split("|");
                            return {
                              platform:
                                platform.trim() === "pinterest" || platform.trim() === "facebook"
                                  ? (platform.trim() as "pinterest" | "facebook")
                                  : "instagram",
                              href: href.trim(),
                              enabled: enabled.trim() !== "0",
                              order: Number(order) || idx,
                            };
                          }),
                      },
                    })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Footer CTA links (label|href|enabled|order per line)
                <textarea
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
                  value={hp.footer.ctaLinks
                    .map((l) => `${l.label}|${l.href}|${l.enabled ? "1" : "0"}|${l.order}`)
                    .join("\n")}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      footer: {
                        ...hp.footer,
                        ctaLinks: e.target.value
                          .split("\n")
                          .map((row) => row.trim())
                          .filter(Boolean)
                          .map((row, idx) => {
                            const [label = "", href = "", enabled = "1", order = String(idx)] = row.split("|");
                            return {
                              label: label.trim(),
                              href: href.trim(),
                              enabled: enabled.trim() !== "0",
                              order: Number(order) || idx,
                            };
                          }),
                      },
                    })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Copyright text
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.footer.copyrightText}
                  onChange={(e) =>
                    setHp({ ...hp, footer: { ...hp.footer, copyrightText: e.target.value } })
                  }
                />
              </label>
            </div>
            <div className="border-t border-[var(--admin-border)] pt-5">
              <CmsEditorSaveActions compact />
            </div>
          </section>
  );
}

export function ContentEditorNewsletterPanel() {
  const { hp, setHp } = useHomepageEditor();
  if (!hp) return null;

  const contentTab = (
    <>
            <label className="flex items-center gap-2 font-sans text-sm text-slate-600">
              <input
                type="checkbox"
                checked={hp.newsletter.enabled !== false}
                onChange={(e) =>
                  setHp({
                    ...hp,
                    newsletter: { ...hp.newsletter, enabled: e.target.checked },
                  })
                }
              />
              Visible on homepage
            </label>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Heading
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.newsletter.title}
                  onChange={(e) =>
                    setHp({ ...hp, newsletter: { ...hp.newsletter, title: e.target.value } })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Description
                <textarea
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  rows={2}
                  value={hp.newsletter.description}
                  onChange={(e) =>
                    setHp({ ...hp, newsletter: { ...hp.newsletter, description: e.target.value } })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Placeholder
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.newsletter.placeholder}
                  onChange={(e) =>
                    setHp({ ...hp, newsletter: { ...hp.newsletter, placeholder: e.target.value } })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Button label
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.newsletter.buttonLabel}
                  onChange={(e) =>
                    setHp({ ...hp, newsletter: { ...hp.newsletter, buttonLabel: e.target.value } })
                  }
                />
              </label>
            </div>
    </>
  );

  return (
    <CmsSectionEditorShell
      sectionId="admin-section-newsletter"
      title="Newsletter"
      description="Email capture and secondary CTA on the homepage."
      previewHref="/admin/content/preview/newsletter"
      tabs={[
        { id: "content", content: contentTab },
        {
          id: "design",
          content: (
            <div className="space-y-8">
              <SectionDesignFields
                value={hp.newsletter.styles}
                onChange={(styles) => setHp({ ...hp, newsletter: { ...hp.newsletter, styles } })}
                showTypography
              />
              <SectionTypographyFields section="newsletter" />
            </div>
          ),
        },
        { id: "layout", content: <CmsLayoutTabLink /> },
        { id: "seo", disabled: true, content: null },
        { id: "responsive", disabled: true, content: null },
        { id: "advanced", disabled: true, content: null },
      ]}
    />
  );
}
