"use client";

import { ProductIdListField } from "@/components/admin/ProductIdListField";
import { sortSlides, sortSections, useHomepageEditor } from "@/components/admin/homepage-editor/context";

export function ContentEditorHeroPanel() {
  const { hp, setHp, token, moveSlide, updateSlide } = useHomepageEditor();
  if (!hp) return null;
  const slides = sortSlides(hp.carousel.slides);
  return (
    <section id="admin-section-hero" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">Hero carousel</h2>
            <label className="mt-6 block font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
              Autoplay (ms)
              <input
                type="number"
                min={4000}
                step={500}
                className="mt-2 w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={hp.carousel.autoplayMs}
                onChange={(e) =>
                  setHp({
                    ...hp,
                    carousel: { ...hp.carousel, autoplayMs: Number(e.target.value) || 9000 },
                  })
                }
              />
            </label>
            <div className="mt-8 space-y-8">
              {slides.map((slide, i) => (
                <div
                  key={slide.id}
                  className="grid gap-4 rounded-2xl border border-slate-100 p-6 md:grid-cols-2"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-xs uppercase tracking-[0.2em] text-slate-400">
                        Slide {i + 1}
                      </span>
                      <label className="flex items-center gap-2 font-sans text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={slide.enabled}
                          onChange={(e) => updateSlide(slide.id, { enabled: e.target.checked })}
                        />
                        Enabled
                      </label>
                    </div>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Heading"
                      value={slide.heading}
                      onChange={(e) => updateSlide(slide.id, { heading: e.target.value })}
                    />
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Subheading"
                      value={slide.subheading ?? ""}
                      onChange={(e) => updateSlide(slide.id, { subheading: e.target.value })}
                    />
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="CTA label"
                      value={slide.ctaLabel ?? ""}
                      onChange={(e) => updateSlide(slide.id, { ctaLabel: e.target.value })}
                    />
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="CTA link (e.g. /collections)"
                      value={slide.ctaHref}
                      onChange={(e) => updateSlide(slide.id, { ctaHref: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Desktop image URL"
                      value={slide.desktopImage}
                      onChange={(e) => updateSlide(slide.id, { desktopImage: e.target.value })}
                    />
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Mobile image URL (optional)"
                      value={slide.mobileImage ?? ""}
                      onChange={(e) => updateSlide(slide.id, { mobileImage: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs uppercase tracking-wide text-slate-600"
                        onClick={() => moveSlide(i, -1)}
                        disabled={i === 0}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs uppercase tracking-wide text-slate-600"
                        onClick={() => moveSlide(i, 1)}
                        disabled={i === slides.length - 1}
                      >
                        Down
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
  );
}

export function ContentEditorHomeLayoutPanel() {
  const { hp, setHp, moveSection } = useHomepageEditor();
  if (!hp) return null;
  const sections = sortSections(hp.sectionsOrder);
  return (
    <section id="admin-section-home-order" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">Section order & visibility</h2>
            <p className="mt-2 font-sans text-sm text-slate-500">
              Reorder blocks as they appear on the storefront (below the hero).
            </p>
            <ul className="mt-6 space-y-3">
              {sections.map((s, i) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 font-sans text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={s.enabled}
                        onChange={(e) => {
                          const next = hp.sectionsOrder.map((x) =>
                            x.id === s.id ? { ...x, enabled: e.target.checked } : x,
                          );
                          setHp({ ...hp, sectionsOrder: next });
                        }}
                      />
                      <span className="capitalize">
                        {s.id === "newIn"
                          ? "New in"
                          : s.id === "bestsellers"
                            ? "Our bestsellers"
                            : s.id === "categories"
                              ? "Shop by category"
                              : "Newsletter"}
                      </span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => moveSection(i, -1)}
                      disabled={i === 0}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                      onClick={() => moveSection(i, 1)}
                      disabled={i === sections.length - 1}
                    >
                      Down
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
  );
}

export function ContentEditorBestsellersPanel() {
  const { hp, setHp, token } = useHomepageEditor();
  if (!hp) return null;
  return (
    <section id="admin-section-bestsellers" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">Our bestsellers</h2>
            <label className="mt-4 flex items-center gap-2 font-sans text-sm text-slate-600">
              <input
                type="checkbox"
                checked={hp.bestsellers.enabled !== false}
                onChange={(e) =>
                  setHp({
                    ...hp,
                    bestsellers: { ...hp.bestsellers, enabled: e.target.checked },
                  })
                }
              />
              Visible on homepage
            </label>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Title
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.bestsellers.title}
                  onChange={(e) =>
                    setHp({ ...hp, bestsellers: { ...hp.bestsellers, title: e.target.value } })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Subtitle
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.bestsellers.subtitle}
                  onChange={(e) =>
                    setHp({ ...hp, bestsellers: { ...hp.bestsellers, subtitle: e.target.value } })
                  }
                />
              </label>
              {token ? (
                <ProductIdListField
                  token={token}
                  label="Bestseller rail — products"
                  hint="Choose up to 8 pieces from the catalog. Order = homepage rail order. Already selected items are hidden from the list."
                  maxItems={8}
                  value={hp.bestsellers.productIds}
                  onChange={(productIds) =>
                    setHp({
                      ...hp,
                      bestsellers: { ...hp.bestsellers, productIds },
                    })
                  }
                />
              ) : null}
            </div>
          </section>
  );
}

export function ContentEditorNewInHomePanel() {
  const { hp, setHp, token } = useHomepageEditor();
  if (!hp) return null;
  return (
    <section id="admin-section-newin-home" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">New in (homepage rail)</h2>
            <label className="mt-4 flex items-center gap-2 font-sans text-sm text-slate-600">
              <input
                type="checkbox"
                checked={hp.newIn.enabled !== false}
                onChange={(e) =>
                  setHp({ ...hp, newIn: { ...hp.newIn, enabled: e.target.checked } })
                }
              />
              Visible on homepage
            </label>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Title
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.newIn.title}
                  onChange={(e) => setHp({ ...hp, newIn: { ...hp.newIn, title: e.target.value } })}
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Subtitle
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.newIn.subtitle}
                  onChange={(e) => setHp({ ...hp, newIn: { ...hp.newIn, subtitle: e.target.value } })}
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                CTA label
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.newIn.ctaLabel}
                  onChange={(e) => setHp({ ...hp, newIn: { ...hp.newIn, ctaLabel: e.target.value } })}
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                CTA URL
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.newIn.ctaHref}
                  onChange={(e) => setHp({ ...hp, newIn: { ...hp.newIn, ctaHref: e.target.value } })}
                />
              </label>
              {token ? (
                <ProductIdListField
                  token={token}
                  label="New In rail — featured picks (optional)"
                  hint="If set, these appear in the homepage New In rail (up to 8). The full New In page can still show the wider catalog."
                  maxItems={8}
                  value={hp.newIn.productIds}
                  onChange={(productIds) =>
                    setHp({
                      ...hp,
                      newIn: { ...hp.newIn, productIds },
                    })
                  }
                />
              ) : null}
            </div>
          </section>
  );
}

export function ContentEditorNewInPagePanel() {
  const { hp, setHp, token } = useHomepageEditor();
  if (!hp) return null;
  return (
    <section id="admin-section-newin-page" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">New In page (/new-in)</h2>
            <p className="mt-2 font-sans text-sm text-slate-500">
              Turn on curated mode to control exactly which products appear and in which order on the public New In
              page. When off, the page lists every catalog item flagged as New In (same as before).
            </p>
            <label className="mt-4 flex items-center gap-2 font-sans text-sm text-slate-600">
              <input
                type="checkbox"
                checked={hp.newInPage?.useCuratedOrder === true}
                onChange={(e) =>
                  setHp({
                    ...hp,
                    newInPage: {
                      useCuratedOrder: e.target.checked,
                      heading: hp.newInPage?.heading ?? "New In",
                      subheading: hp.newInPage?.subheading ?? "",
                      productIds: hp.newInPage?.productIds ?? [],
                    },
                  })
                }
              />
              Curated grid (fixed products & order)
            </label>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Page heading
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.newInPage?.heading ?? "New In"}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      newInPage: {
                        useCuratedOrder: hp.newInPage?.useCuratedOrder ?? false,
                        heading: e.target.value,
                        subheading: hp.newInPage?.subheading ?? "",
                        productIds: hp.newInPage?.productIds ?? [],
                      },
                    })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Page subheading (optional)
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.newInPage?.subheading ?? ""}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      newInPage: {
                        useCuratedOrder: hp.newInPage?.useCuratedOrder ?? false,
                        heading: hp.newInPage?.heading ?? "New In",
                        subheading: e.target.value,
                        productIds: hp.newInPage?.productIds ?? [],
                      },
                    })
                  }
                />
              </label>
            </div>
            {token ? (
              <ProductIdListField
                token={token}
                label="Curated products"
                hint="Up to 60 items. Order matches storefront masonry."
                maxItems={60}
                value={hp.newInPage?.productIds ?? []}
                onChange={(productIds) =>
                  setHp({
                    ...hp,
                    newInPage: {
                      useCuratedOrder: hp.newInPage?.useCuratedOrder ?? false,
                      heading: hp.newInPage?.heading ?? "New In",
                      subheading: hp.newInPage?.subheading ?? "",
                      productIds,
                    },
                  })
                }
              />
            ) : null}
          </section>
  );
}

export function ContentEditorCategoriesPanel() {
  const { hp, setHp, updateCategory } = useHomepageEditor();
  if (!hp) return null;
  return (
    <section id="admin-section-categories" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">Shop by category</h2>
            <label className="mt-4 flex items-center gap-2 font-sans text-sm text-slate-600">
              <input
                type="checkbox"
                checked={hp.categories.enabled !== false}
                onChange={(e) =>
                  setHp({
                    ...hp,
                    categories: { ...hp.categories, enabled: e.target.checked },
                  })
                }
              />
              Visible on homepage
            </label>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Section title
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.categories.title}
                  onChange={(e) =>
                    setHp({ ...hp, categories: { ...hp.categories, title: e.target.value } })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Section subtitle
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.categories.subtitle}
                  onChange={(e) =>
                    setHp({ ...hp, categories: { ...hp.categories, subtitle: e.target.value } })
                  }
                />
              </label>
            </div>
            <div className="mt-8 space-y-6">
              {hp.categories.items
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="rounded-2xl border border-slate-100 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-sans text-xs uppercase text-slate-400">Card</span>
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={cat.enabled}
                          onChange={(e) => updateCategory(cat.id, { enabled: e.target.checked })}
                        />
                        Visible
                      </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Name"
                        value={cat.name}
                        onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                      />
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Link"
                        value={cat.href}
                        onChange={(e) => updateCategory(cat.id, { href: e.target.value })}
                      />
                      <input
                        className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Image URL"
                        value={cat.image}
                        onChange={(e) => updateCategory(cat.id, { image: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </section>
  );
}

export function ContentEditorCollectionsPanel() {
  const { hp, setHp, token, updateCollectionsCategory } = useHomepageEditor();
  if (!hp) return null;
  return (
    <section id="admin-section-collections" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">Collections page</h2>
            <p className="mt-2 font-sans text-sm text-slate-500">
              Manage category tabs, pagination limit, and editorial copy for the collections browse page.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Page title
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.collectionsPage.title}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      collectionsPage: { ...hp.collectionsPage, title: e.target.value },
                    })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Pagination limit
                <input
                  type="number"
                  min={8}
                  max={48}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.collectionsPage.paginationLimit}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      collectionsPage: {
                        ...hp.collectionsPage,
                        paginationLimit: Number(e.target.value) || 16,
                      },
                    })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                Page subtitle
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.collectionsPage.subtitle}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      collectionsPage: { ...hp.collectionsPage, subtitle: e.target.value },
                    })
                  }
                />
              </label>
            </div>
    
            {token ? (
              <div className="mt-8 space-y-4 border-t border-slate-100 pt-8">
                <label className="flex items-center gap-2 font-sans text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={hp.collectionsPage.usePinnedProducts === true}
                    onChange={(e) =>
                      setHp({
                        ...hp,
                        collectionsPage: {
                          ...hp.collectionsPage,
                          usePinnedProducts: e.target.checked,
                        },
                      })
                    }
                  />
                  Pin products on the “All” tab (first page)
                </label>
                <ProductIdListField
                  token={token}
                  label="Pinned products (order = top of grid)"
                  hint="Only when the shopper opens Collections on the All tab, page 1. Remaining slots fill from the catalog."
                  maxItems={24}
                  value={hp.collectionsPage.pinnedProductIds ?? []}
                  onChange={(pinnedProductIds) =>
                    setHp({
                      ...hp,
                      collectionsPage: { ...hp.collectionsPage, pinnedProductIds },
                    })
                  }
                />
              </div>
            ) : null}
    
            <div className="mt-8 space-y-5">
              {hp.collectionsPage.categories
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((cat) => (
                  <div key={cat.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                        Category tab
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
                        onChange={(e) =>
                          updateCollectionsCategory(cat.id, { label: e.target.value })
                        }
                      />
                      <select
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={cat.type}
                        onChange={(e) =>
                          updateCollectionsCategory(cat.id, {
                            type: e.target.value as "all" | "bestselling" | "category",
                          })
                        }
                      >
                        <option value="all">All</option>
                        <option value="bestselling">Bestselling</option>
                        <option value="category">Category</option>
                      </select>
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Category value (for type=category)"
                        value={cat.value ?? ""}
                        onChange={(e) =>
                          updateCollectionsCategory(cat.id, { value: e.target.value })
                        }
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
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="rounded-full border border-red-200 px-4 py-1.5 font-sans text-[11px] uppercase tracking-[0.18em] text-red-600"
                        onClick={() =>
                          setHp({
                            ...hp,
                            collectionsPage: {
                              ...hp.collectionsPage,
                              categories: hp.collectionsPage.categories.filter((x) => x.id !== cat.id),
                            },
                          })
                        }
                      >
                        Remove tab
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            <button
              type="button"
              className="mt-5 rounded-full border border-slate-200 px-5 py-2 font-sans text-xs uppercase tracking-[0.2em] text-slate-700"
              onClick={() =>
                setHp({
                  ...hp,
                  collectionsPage: {
                    ...hp.collectionsPage,
                    categories: [
                      ...hp.collectionsPage.categories,
                      {
                        id: `tab-${Date.now()}`,
                        label: "New Category",
                        type: "category",
                        value: "",
                        enabled: true,
                        order: hp.collectionsPage.categories.length,
                      },
                    ],
                  },
                })
              }
            >
              Add category tab
            </button>
          </section>
  );
}

export function ContentEditorOurStoryPanel() {
  const { hp, setHp } = useHomepageEditor();
  if (!hp) return null;
  return (
    <section id="admin-section-our-story" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">Our Story page</h2>
            <p className="mt-2 font-sans text-sm text-slate-500">
              Control hero content, cinematic sections, manifesto quote, CTA, and section order/visibility.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Hero title
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.ourStoryPage.title}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      ourStoryPage: { ...hp.ourStoryPage, title: e.target.value },
                    })
                  }
                />
              </label>
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Hero image URL
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.ourStoryPage.heroImage}
                  onChange={(e) =>
                    setHp({
                      ...hp,
                      ourStoryPage: { ...hp.ourStoryPage, heroImage: e.target.value },
                    })
                  }
                />
              </label>
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
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Image URL"
                        value={section.image ?? ""}
                        onChange={(e) =>
                          setHp({
                            ...hp,
                            ourStoryPage: {
                              ...hp.ourStoryPage,
                              sections: hp.ourStoryPage.sections.map((s) =>
                                s.id === section.id ? { ...s, image: e.target.value } : s,
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
          </section>
  );
}

export function ContentEditorFooterPanel() {
  const { hp, setHp } = useHomepageEditor();
  if (!hp) return null;
  return (
    <section id="admin-section-footer" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">Footer</h2>
            <p className="mt-2 font-sans text-sm text-slate-500">
              Manage luxury footer content: brand text, legal links, contact, socials, and CTA links.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Logo URL
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={hp.footer.logoUrl}
                  onChange={(e) => setHp({ ...hp, footer: { ...hp.footer, logoUrl: e.target.value } })}
                />
              </label>
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
              <label className="font-sans text-xs uppercase tracking-[0.18em] text-slate-400">
                Legal links (label|href|enabled|order per line)
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
          </section>
  );
}

export function ContentEditorNewsletterPanel() {
  const { hp, setHp } = useHomepageEditor();
  if (!hp) return null;
  return (
    <section id="admin-section-newsletter" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="font-display text-2xl text-slate-900">Newsletter</h2>
            <label className="mt-4 flex items-center gap-2 font-sans text-sm text-slate-600">
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
          </section>
  );
}
