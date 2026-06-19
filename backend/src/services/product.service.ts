/**
 * Product service — handles product CRUD, search, and CMS auto-sync.
 */
import mongoose from "mongoose";
import { productRepository } from "../repositories/product.repository.js";
import { settingsRepository } from "../repositories/settings.repository.js";
import { mergeHomepageConfig } from "../lib/homepage-defaults.js";
import { loadPdpSuggestedProducts } from "../lib/pdp-suggestions.js";
import { mergeStorefrontSettings } from "../lib/storefront-settings.js";
import { sanitizeProductMedia } from "../lib/strip-unsplash.js";
import { removeProductFromHomepagePins } from "../lib/homepage-product-pins.js";
import { escapeRegex } from "../lib/sanitize-input.js";
import {
  slugifyCategoryName,
} from "../lib/global-categories.js";
import { HttpError } from "../middleware/httpError.js";
import { eventBus } from "../lib/event-bus.js";
import type { HomepageConfig } from "../types/homepage.js";

// Product field whitelist for admin updates
const ALLOWED_PRODUCT_FIELDS = [
  "name", "slug", "shortDescription", "description", "price", "compareAtPrice",
  "taxRate", "discountPercent", "category", "subcategory", "collection", "tags",
  "images", "imageCaptions", "hoverImage", "variants", "material", "fitType",
  "fabricDetails", "stylingSuggestions", "pdpPrintDisclaimer", "pdpDeliveryRange",
  "pdpFreeShippingNote", "pdpDeliveryAndCare", "featured", "bestseller", "trending",
  "newIn", "newInOrder", "newInHoverImage", "newInVisible", "storefrontVisible",
  "lowStockDisplay", "displayOrder", "gstRate", "hsnCode",
];

function sanitizeProductBody(raw: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key of ALLOWED_PRODUCT_FIELDS) {
    if (key in raw) sanitized[key] = raw[key];
  }
  return sanitizeProductMedia(sanitized);
}

function mergeStorefrontVisibility(filter: Record<string, unknown>, admin: boolean): Record<string, unknown> {
  if (admin) return filter;
  return { ...filter, storefrontVisible: { $ne: false } };
}

export type ProductListQuery = {
  ids?: string;
  q?: string;
  category?: string;
  size?: string;
  color?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  collection?: string;
  tag?: string;
  sort?: string;
  limit?: string;
  bestseller?: string;
  featured?: string;
  newIn?: string;
  visible?: string;
  page?: string;
};

export const productService = {
  async listProducts(query: ProductListQuery, isAdmin: boolean) {
    const { ids, q, category, size, color, minPrice, maxPrice, inStock, collection, tag, sort, limit, bestseller, featured, newIn, visible, page } = query;

    // Fetch by IDs (preserves order)
    if (ids?.trim()) {
      const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
      const oids = idList
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (oids.length === 0) return { products: [], total: 0, page: 1, pages: 1 };
      const found = await productRepository.findByIds(oids, isAdmin ? undefined : { storefrontVisible: { $ne: false } });
      const map = new Map(found.map((p) => [String((p as { _id: mongoose.Types.ObjectId })._id), p]));
      const ordered = oids.map((id) => map.get(String(id))).filter(Boolean);
      return { products: ordered.map((p) => sanitizeProductMedia(p as Record<string, unknown>)), total: ordered.length, page: 1, pages: 1 };
    }

    // Build filter
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (collection) filter.tags = collection;
    if (tag === "bestseller") filter.bestseller = true;
    else if (tag) filter.tags = tag;
    if (bestseller === "true") filter.bestseller = true;
    if (featured === "true") filter.featured = true;
    if (newIn === "true") filter.newIn = true;
    if (visible === "true") filter.newInVisible = true;
    if (size) filter["variants.size"] = size;
    if (color) {
      const escapedColor = escapeRegex(color);
      filter["variants.color"] = new RegExp(`^${escapedColor}$`, "i");
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = Number(maxPrice);
    }
    if (inStock === "true") filter["variants.stock"] = { $gt: 0 };

    // Search: try $text first, fall back to regex for partial/prefix matching
    const searchTerm = q?.trim();
    if (searchTerm) {
      filter.$text = { $search: searchTerm };
    }

    // Sort
    let sortSpec: Record<string, 1 | -1> = { displayOrder: 1, featured: -1, createdAt: -1 };
    if (sort === "price_asc") sortSpec = { price: 1 };
    if (sort === "price_desc") sortSpec = { price: -1 };
    if (sort === "newest") sortSpec = { createdAt: -1 };
    if (sort === "popular") sortSpec = { bestseller: -1, featured: -1, createdAt: -1 };
    if (sort === "new_in") sortSpec = { newInOrder: 1, createdAt: -1 };
    if (sort === "manual") sortSpec = { displayOrder: 1, createdAt: -1 };

    const lim = Math.min(Number(limit) || 24, 500);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * lim;
    const queryFilter = mergeStorefrontVisibility(filter, isAdmin);
    let { products, total } = await productRepository.findPaginated(queryFilter, sortSpec, skip, lim);

    // Fallback: if $text returned nothing, try regex-based partial match on name/description/tags
    if (searchTerm && total === 0) {
      const escaped = escapeRegex(searchTerm);
      const regex = new RegExp(escaped, "i");
      const regexFilter = { ...queryFilter } as Record<string, unknown>;
      delete regexFilter.$text;
      regexFilter.$or = [
        { name: regex },
        { description: regex },
        { shortDescription: regex },
        { tags: regex },
        { collection: regex },
        { category: regex },
      ];
      const fallback = await productRepository.findPaginated(regexFilter, sortSpec, skip, lim);
      products = fallback.products;
      total = fallback.total;
    }

    return {
      products: products.map((p) => sanitizeProductMedia(p as Record<string, unknown>)),
      total,
      page: currentPage,
      pages: Math.max(Math.ceil(total / lim), 1),
    };
  },

  async getProductBySlug(slug: string, isAdmin: boolean) {
    const raw = await productRepository.findBySlugLean(slug);
    if (!raw) throw new HttpError(404, "Not found");
    const row = raw as { storefrontVisible?: boolean };
    if (!isAdmin && row.storefrontVisible === false) throw new HttpError(404, "Not found");

    let storefront = mergeStorefrontSettings(undefined);
    let suggested: { mode: string; label: string; products: Record<string, unknown>[] } = {
      mode: "auto",
      label: "Suggested for you",
      products: [],
    };
    try {
      const settingsDoc = await settingsRepository.findOne();
      const homepage = mergeHomepageConfig((settingsDoc?.homepage ?? {}) as Partial<HomepageConfig>);
      storefront = mergeStorefrontSettings(settingsDoc?.storefront);
      suggested = await loadPdpSuggestedProducts(
        raw as unknown as { _id: mongoose.Types.ObjectId; category: string; collection?: string },
        storefront.pdpSuggestedMode ?? "auto",
        homepage,
      );
    } catch {
      // Non-critical: product still loads without suggestions
    }

    return {
      product: sanitizeProductMedia(raw as Record<string, unknown>),
      related: suggested.products.map((p) => sanitizeProductMedia(p)),
      suggested: {
        mode: suggested.mode,
        label: suggested.label,
        products: suggested.products.map((p) => sanitizeProductMedia(p)),
      },
      storefront,
    };
  },

  async createProduct(body: Record<string, unknown>) {
    const sanitized = sanitizeProductMedia(body);
    const doc = await productRepository.create(sanitized);
    const productId = String(doc._id);

    // Fire-and-forget via event bus (non-blocking, errors logged internally)
    eventBus.emit("product.created", {
      productId,
      category: typeof sanitized.category === "string" ? sanitized.category : undefined,
      newIn: sanitized.newIn === true,
      bestseller: sanitized.bestseller === true,
    });

    return sanitizeProductMedia(doc.toObject() as Record<string, unknown>);
  },

  async updateProduct(id: string, rawBody: Record<string, unknown>) {
    const body = sanitizeProductBody(rawBody);
    const doc = await productRepository.updateById(id, body);
    if (!doc) throw new HttpError(404, "Not found");
    const productId = String(doc._id);

    // Fire-and-forget via event bus
    eventBus.emit("product.updated", {
      productId,
      category: typeof body.category === "string" ? body.category : undefined,
      newIn: "newIn" in body ? (body.newIn === true ? true : false) : undefined,
      bestseller: "bestseller" in body ? (body.bestseller === true ? true : false) : undefined,
    });

    return sanitizeProductMedia(doc.toObject() as Record<string, unknown>);
  },

  async deleteProduct(id: string) {
    await productRepository.deleteById(id);
    await removeProductFromHomepagePins(id).catch(() => {});
  },

  async ensureCategoryExists(categoryName: string): Promise<void> {
    if (!categoryName?.trim()) return;
    const slug = slugifyCategoryName(categoryName);
    if (!slug) return;

    try {
      const doc = await settingsRepository.findOne();

      // Read existing global categories directly from the raw doc (bypass mergeHomepageConfig)
      const rawHp = (doc?.homepage ?? {}) as Record<string, unknown>;
      const rawGlobals = Array.isArray(rawHp.globalCategories) ? rawHp.globalCategories as Array<Record<string, unknown>> : [];

      // Check if category already exists
      if (rawGlobals.some((g) => String(g.slug ?? "").toLowerCase() === slug.toLowerCase())) return;

      const maxOrder = rawGlobals.length > 0
        ? Math.max(...rawGlobals.map((g) => typeof g.order === "number" ? g.order : 0))
        : -1;

      const newCat = {
        id: `cat-${slug}`,
        name: categoryName.trim(),
        slug,
        image: "",
        href: `/collections?category=${encodeURIComponent(slug)}`,
        enabled: true,
        order: maxOrder + 1,
        homepage: true,
        collections: true,
      };

      const updatedGlobals = [...rawGlobals, newCat];

      // Build collections tabs: All + Bestselling + New In + category tabs
      const categoryTabs = updatedGlobals
        .filter((g) => g.enabled !== false && g.collections !== false)
        .map((g, i) => ({
          id: String(g.id ?? `cat-${g.slug}`),
          label: String(g.name ?? ""),
          type: "category" as const,
          value: String(g.slug ?? ""),
          enabled: true,
          order: 3 + i,
        }));

      const collectionsCategories = [
        { id: "all", label: "All", type: "all" as const, value: "", enabled: true, order: 0 },
        { id: "bestselling", label: "Bestselling", type: "bestselling" as const, value: "", enabled: true, order: 1 },
        { id: "new-in", label: "New In", type: "newIn" as const, value: "", enabled: true, order: 2 },
        ...categoryTabs,
      ];

      // Build homepage category cards
      const categoryCards = updatedGlobals
        .filter((g) => g.enabled !== false && g.homepage !== false)
        .map((g) => ({
          id: String(g.id ?? `cat-${g.slug}`),
          name: String(g.name ?? ""),
          image: String(g.image ?? ""),
          href: String(g.href ?? `/collections?category=${encodeURIComponent(String(g.slug ?? ""))}`),
          enabled: true,
          order: typeof g.order === "number" ? g.order : 0,
        }));

      await settingsRepository.upsertFields({
        "homepage.globalCategories": updatedGlobals,
        "homepage.categories.items": categoryCards,
        "homepage.collectionsPage.categories": collectionsCategories,
      });
    } catch (e) {
      console.error("[ProductService] ensureCategoryExists failed:", (e as Error).message);
    }
  },

  async syncHomepagePins(
    productId: string,
    flags: { newIn?: boolean; bestseller?: boolean },
  ): Promise<void> {
    if (!productId) return;
    const id = String(productId);
    const doc = await settingsRepository.findOne();
    const hp = mergeHomepageConfig((doc?.homepage ?? {}) as Partial<HomepageConfig>);
    const updates: Record<string, unknown> = {};

    if (flags.newIn === true) {
      const existing = hp.newIn?.productIds ?? [];
      if (!existing.includes(id)) updates["homepage.newIn.productIds"] = [...existing, id];
    } else if (flags.newIn === false) {
      const existing = hp.newIn?.productIds ?? [];
      if (existing.includes(id)) updates["homepage.newIn.productIds"] = existing.filter((x) => x !== id);
    }

    if (flags.bestseller === true) {
      const existing = hp.bestsellers?.productIds ?? [];
      if (!existing.includes(id)) updates["homepage.bestsellers.productIds"] = [...existing, id];
    } else if (flags.bestseller === false) {
      const existing = hp.bestsellers?.productIds ?? [];
      if (existing.includes(id)) updates["homepage.bestsellers.productIds"] = existing.filter((x) => x !== id);
    }

    if (Object.keys(updates).length > 0) {
      await settingsRepository.upsertFields(updates);
    }
  },

  async syncAllCategories() {
    const allCategories = await productRepository.distinctCategories();

    // Single DB read to determine which categories already exist
    const doc = await settingsRepository.findOne();
    const rawHp = (doc?.homepage ?? {}) as Record<string, unknown>;
    const rawGlobals = Array.isArray(rawHp.globalCategories)
      ? (rawHp.globalCategories as Array<Record<string, unknown>>)
      : [];
    const existingSlugs = new Set(
      rawGlobals.map((g) => String(g.slug ?? "").toLowerCase()),
    );

    // Filter to only new categories
    const newCategories = allCategories.filter((cat) => {
      if (!cat?.trim()) return false;
      const slug = slugifyCategoryName(cat);
      if (!slug) return false;
      return !existingSlugs.has(slug.toLowerCase());
    });

    // Sync new categories (each call still does a DB write, but we avoid redundant reads)
    let added = 0;
    for (const cat of newCategories) {
      await this.ensureCategoryExists(cat);
      added++;
    }
    return { added, total: allCategories.length };
  },

  async syncAllHomepagePins() {
    const newInProducts = await productRepository.findByFlags({ newIn: true });
    const bestsellerProducts = await productRepository.findByFlags({ bestseller: true });
    const doc = await settingsRepository.findOne();
    const hp = mergeHomepageConfig((doc?.homepage ?? {}) as Partial<HomepageConfig>);

    const existingNewIn = new Set(hp.newIn?.productIds ?? []);
    const existingBest = new Set(hp.bestsellers?.productIds ?? []);

    const newInIds = newInProducts.map((p) => String((p as { _id: unknown })._id));
    const bestIds = bestsellerProducts.map((p) => String((p as { _id: unknown })._id));

    const mergedNewIn = [...new Set([...existingNewIn, ...newInIds])];
    const mergedBest = [...new Set([...existingBest, ...bestIds])];

    await settingsRepository.upsertFields({
      "homepage.newIn.productIds": mergedNewIn,
      "homepage.bestsellers.productIds": mergedBest,
    });

    return {
      newInAdded: mergedNewIn.length - existingNewIn.size,
      bestsellersAdded: mergedBest.length - existingBest.size,
    };
  },
};
