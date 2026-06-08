import type { Request, RequestHandler } from "express";
import { Router } from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import type { LeanProduct } from "../lean.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { requireAdmin } from "../middleware/auth.js";
import { verifyAccessToken } from "../lib/accessJwt.js";
import { removeProductFromHomepagePins } from "../lib/homepage-product-pins.js";
import { sanitizeProductMedia } from "../lib/strip-unsplash.js";
import { mergeHomepageConfig } from "../lib/homepage-defaults.js";
import { loadPdpSuggestedProducts } from "../lib/pdp-suggestions.js";
import { mergeStorefrontSettings } from "../lib/storefront-settings.js";
import { SiteSettings } from "../models/SiteSettings.js";
import { escapeRegex } from "../lib/sanitize-input.js";
import {
  getGlobalCategories,
  applyGlobalCategories,
  slugifyCategoryName,
  hrefFromCategorySlug,
} from "../lib/global-categories.js";

/**
 * Auto-sync: when a product is created/updated, ensure its category exists
 * in the global categories list so it shows on homepage + collections page.
 */
async function ensureCategoryExists(categoryName: string): Promise<void> {
  if (!categoryName?.trim()) return;
  const slug = slugifyCategoryName(categoryName);
  if (!slug) return;

  const doc = await SiteSettings.findOne().lean() as { homepage?: Record<string, unknown> } | null;
  const hp = mergeHomepageConfig((doc?.homepage ?? {}) as Parameters<typeof mergeHomepageConfig>[0]);
  const globals = getGlobalCategories(hp);

  // Already exists — nothing to do
  if (globals.some((g) => g.slug === slug)) return;

  // Add new category
  const maxOrder = globals.length > 0 ? Math.max(...globals.map((g) => g.order)) : -1;
  const newCat = {
    id: `cat-${slug}`,
    name: categoryName.trim(),
    slug,
    image: "",
    href: hrefFromCategorySlug(slug),
    enabled: true,
    order: maxOrder + 1,
    homepage: true,
    collections: true,
  };

  const updated = applyGlobalCategories(hp, [...globals, newCat]);

  await SiteSettings.updateOne(
    {},
    {
      $set: {
        "homepage.globalCategories": updated.globalCategories,
        "homepage.categories": updated.categories,
        "homepage.collectionsPage.categories": updated.collectionsPage?.categories,
      },
    },
    { upsert: true },
  );
}

/**
 * Auto-sync: when a product is marked newIn or bestseller, ensure its ID
 * is pinned to the homepage rail so it shows up without manual CMS work.
 */
async function ensureHomepagePins(
  productId: string,
  flags: { newIn?: boolean; bestseller?: boolean },
): Promise<void> {
  if (!productId) return;
  const id = String(productId);

  const doc = await SiteSettings.findOne().lean() as { homepage?: Record<string, unknown> } | null;
  const hp = mergeHomepageConfig((doc?.homepage ?? {}) as Parameters<typeof mergeHomepageConfig>[0]);

  const updates: Record<string, unknown> = {};

  // Auto-pin to New In rail
  if (flags.newIn === true) {
    const existing = hp.newIn?.productIds ?? [];
    if (!existing.includes(id)) {
      updates["homepage.newIn.productIds"] = [...existing, id];
    }
  } else if (flags.newIn === false) {
    const existing = hp.newIn?.productIds ?? [];
    if (existing.includes(id)) {
      updates["homepage.newIn.productIds"] = existing.filter((x: string) => x !== id);
    }
  }

  // Auto-pin to Bestsellers rail
  if (flags.bestseller === true) {
    const existing = hp.bestsellers?.productIds ?? [];
    if (!existing.includes(id)) {
      updates["homepage.bestsellers.productIds"] = [...existing, id];
    }
  } else if (flags.bestseller === false) {
    const existing = hp.bestsellers?.productIds ?? [];
    if (existing.includes(id)) {
      updates["homepage.bestsellers.productIds"] = existing.filter((x: string) => x !== id);
    }
  }

  if (Object.keys(updates).length === 0) return;

  await SiteSettings.updateOne({}, { $set: updates }, { upsert: true });
}

async function requestIsAdmin(req: Request, secret: string): Promise<boolean> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return false;
  try {
    const payload = verifyAccessToken(header.slice(7), secret);
    const user = await User.findById(payload.sub).select("role").lean();
    const role = user && !Array.isArray(user) && "role" in user ? (user as { role?: string }).role : undefined;
    return role === "admin";
  } catch {
    return false;
  }
}

/** Hidden products use storefrontVisible: false */
function mergeStorefrontVisibility(
  filter: Record<string, unknown>,
  admin: boolean,
): Record<string, unknown> {
  if (admin) return filter;
  return { ...filter, storefrontVisible: { $ne: false } };
}

export function createProductsRouter(secret: string) {
  const r = Router();

  r.get("/", async (req, res) => {
    const {
      ids,
      q,
      category,
      size,
      color,
      minPrice,
      maxPrice,
      inStock,
      collection,
      tag,
      sort,
      limit,
      bestseller,
      featured,
      newIn,
      visible,
      page,
    } = req.query as Record<string, string | undefined>;

    const admin = await requestIsAdmin(req, secret);

    if (ids?.trim()) {
      const idList = ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const oids = idList
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (oids.length === 0) return res.json({ products: [] });
      const idFilter: Record<string, unknown> = { _id: { $in: oids } };
      const qf = mergeStorefrontVisibility(idFilter, admin);
      const found = await Product.find(qf).lean();
      const map = new Map(
        found.map((p) => {
          const id = String((p as { _id: mongoose.Types.ObjectId })._id);
          return [id, p] as const;
        }),
      );
      const ordered = oids
        .map((id) => map.get(String(id)))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
      return res.json({ products: ordered.map((p) => sanitizeProductMedia(p as Record<string, unknown>)) });
    }

    const filter: Record<string, unknown> = {};

    if (category) filter.category = category;
    if (collection) filter.tags = collection;
    if (tag === "bestseller") filter.bestseller = true;
    else if (tag) filter.tags = tag;
    if (bestseller === "true") filter.bestseller = true;
    if (featured === "true") filter.featured = true;
    if (newIn === "true") filter.newIn = true;
    if (visible === "true") filter.newInVisible = true;

    if (q?.trim()) filter.$text = { $search: q.trim() };

    if (size) filter["variants.size"] = size;
    if (color) {
      // Escape regex special characters to prevent ReDoS attacks
      const escapedColor = escapeRegex(color);
      filter["variants.color"] = new RegExp(`^${escapedColor}$`, "i");
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = Number(maxPrice);
    }

    if (inStock === "true") filter["variants.stock"] = { $gt: 0 };

    let sortSpec: Record<string, 1 | -1> = { featured: -1, createdAt: -1 };
    if (sort === "price_asc") sortSpec = { price: 1 };
    if (sort === "price_desc") sortSpec = { price: -1 };
    if (sort === "newest") sortSpec = { createdAt: -1 };
    if (sort === "popular") sortSpec = { bestseller: -1, featured: -1, createdAt: -1 };
    if (sort === "new_in") sortSpec = { newInOrder: 1, createdAt: -1 };

    const lim = Math.min(Number(limit) || 24, 500);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * lim;

    const queryFilter = mergeStorefrontVisibility(filter, admin);

    const [products, total] = await Promise.all([
      Product.find(queryFilter).sort(sortSpec).skip(skip).limit(lim).lean(),
      Product.countDocuments(queryFilter),
    ]);

    res.json({
      products: products.map((p) => sanitizeProductMedia(p as Record<string, unknown>)),
      total,
      page: currentPage,
      pages: Math.max(Math.ceil(total / lim), 1),
    });
  });

  r.get("/slug/:slug", async (req, res) => {
    const admin = await requestIsAdmin(req, secret);
    const raw = await Product.findOne({ slug: req.params.slug }).lean();
    if (!raw || Array.isArray(raw)) return res.status(404).json({ message: "Not found" });
    const row = raw as { storefrontVisible?: boolean } & typeof raw;
    if (!admin && row.storefrontVisible === false)
      return res.status(404).json({ message: "Not found" });
    const product = raw as unknown as LeanProduct;
    const settingsDoc = (await SiteSettings.findOne().lean()) as {
      homepage?: unknown;
      storefront?: unknown;
    } | null;
    const homepage = mergeHomepageConfig(
      (settingsDoc?.homepage ?? {}) as Parameters<typeof mergeHomepageConfig>[0],
    );
    const storefront = mergeStorefrontSettings(settingsDoc?.storefront);
    const suggested = await loadPdpSuggestedProducts(
      product as Parameters<typeof loadPdpSuggestedProducts>[0],
      storefront.pdpSuggestedMode ?? "auto",
      homepage,
    );
    res.json({
      product: sanitizeProductMedia(product as unknown as Record<string, unknown>),
      related: suggested.products.map((p) => sanitizeProductMedia(p)),
      suggested: {
        mode: suggested.mode,
        label: suggested.label,
        products: suggested.products.map((p) => sanitizeProductMedia(p)),
      },
      storefront,
    });
  });

  r.post(
    "/",
    ...(requireAdmin(secret) as RequestHandler[]),
    body("name").notEmpty(),
    body("slug").notEmpty(),
    body("description").notEmpty(),
    body("price").isNumeric(),
    body("category").notEmpty(),
    body("images").isArray({ min: 1 }),
    body("variants").isArray({ min: 1 }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      try {
        const body = sanitizeProductMedia(req.body as Record<string, unknown>);
        const doc = await Product.create(body);
        const productId = String(doc._id);
        // Auto-add category to global categories if it doesn't exist yet
        if (typeof body.category === "string") {
          await ensureCategoryExists(body.category).catch(() => {});
        }
        // Auto-pin to homepage rails based on flags
        await ensureHomepagePins(productId, {
          newIn: body.newIn === true ? true : undefined,
          bestseller: body.bestseller === true ? true : undefined,
        }).catch(() => {});
        res.status(201).json({ product: sanitizeProductMedia(doc.toObject() as Record<string, unknown>) });
      } catch (e) {
        res.status(400).json({ message: (e as Error).message });
      }
    },
  );

  r.patch("/:id", ...(requireAdmin(secret) as RequestHandler[]), async (req, res) => {
    try {
      // Whitelist allowed fields to prevent MongoDB operator injection
      const allowedFields = [
        "name", "slug", "shortDescription", "description", "price", "compareAtPrice",
        "taxRate", "discountPercent", "category", "subcategory", "collection", "tags",
        "images", "imageCaptions", "hoverImage", "variants", "material", "fitType",
        "fabricDetails", "stylingSuggestions", "pdpPrintDisclaimer", "pdpDeliveryRange",
        "pdpFreeShippingNote", "pdpDeliveryAndCare", "featured", "bestseller", "trending",
        "newIn", "newInOrder", "newInHoverImage", "newInVisible", "storefrontVisible",
      ];
      const rawBody = req.body as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (key in rawBody) sanitized[key] = rawBody[key];
      }
      const body = sanitizeProductMedia(sanitized);
      const doc = await Product.findByIdAndUpdate(req.params.id, body, {
        new: true,
      });
      if (!doc) return res.status(404).json({ message: "Not found" });
      const productId = String(doc._id);
      // Auto-add category to global categories if it doesn't exist yet
      if (typeof body.category === "string") {
        await ensureCategoryExists(body.category).catch(() => {});
      }
      // Auto-pin/unpin from homepage rails based on flags
      if ("newIn" in body || "bestseller" in body) {
        await ensureHomepagePins(productId, {
          newIn: "newIn" in body ? (body.newIn === true ? true : false) : undefined,
          bestseller: "bestseller" in body ? (body.bestseller === true ? true : false) : undefined,
        }).catch(() => {});
      }
      res.json({ product: sanitizeProductMedia(doc.toObject() as Record<string, unknown>) });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  });

  r.delete("/:id", ...(requireAdmin(secret) as RequestHandler[]), async (req, res) => {
    const id = String(req.params.id);
    await Product.findByIdAndDelete(id);
    await removeProductFromHomepagePins(id);
    res.json({ ok: true });
  });

  /**
   * POST /products/sync-categories
   * Scans all products and ensures every unique category value exists in globalCategories.
   * Call this once to fix existing products whose categories weren't auto-synced.
   */
  r.post("/sync-categories", ...(requireAdmin(secret) as RequestHandler[]), async (_req, res) => {
    const allCategories = await Product.distinct("category") as string[];
    let added = 0;
    for (const cat of allCategories) {
      if (!cat?.trim()) continue;
      const slug = slugifyCategoryName(cat);
      if (!slug) continue;
      const doc = await SiteSettings.findOne().lean() as { homepage?: Record<string, unknown> } | null;
      const hp = mergeHomepageConfig((doc?.homepage ?? {}) as Parameters<typeof mergeHomepageConfig>[0]);
      const globals = getGlobalCategories(hp);
      if (globals.some((g) => g.slug === slug)) continue;
      await ensureCategoryExists(cat);
      added++;
    }
    res.json({ ok: true, message: `Synced ${added} new categories`, total: allCategories.length });
  });

  /**
   * POST /products/sync-homepage-pins
   * Scans all products and pins newIn/bestseller products to homepage rails.
   * Call this once to fix existing products that weren't auto-synced.
   */
  r.post("/sync-homepage-pins", ...(requireAdmin(secret) as RequestHandler[]), async (_req, res) => {
    const newInProducts = await Product.find({ newIn: true }).select("_id").lean();
    const bestsellerProducts = await Product.find({ bestseller: true }).select("_id").lean();

    const doc = await SiteSettings.findOne().lean() as { homepage?: Record<string, unknown> } | null;
    const hp = mergeHomepageConfig((doc?.homepage ?? {}) as Parameters<typeof mergeHomepageConfig>[0]);

    const existingNewIn = new Set(hp.newIn?.productIds ?? []);
    const existingBest = new Set(hp.bestsellers?.productIds ?? []);

    const newInIds = newInProducts.map((p) => String((p as { _id: unknown })._id));
    const bestIds = bestsellerProducts.map((p) => String((p as { _id: unknown })._id));

    const mergedNewIn = [...new Set([...existingNewIn, ...newInIds])];
    const mergedBest = [...new Set([...existingBest, ...bestIds])];

    await SiteSettings.updateOne(
      {},
      {
        $set: {
          "homepage.newIn.productIds": mergedNewIn,
          "homepage.bestsellers.productIds": mergedBest,
        },
      },
      { upsert: true },
    );

    res.json({
      ok: true,
      newInAdded: mergedNewIn.length - existingNewIn.size,
      bestsellersAdded: mergedBest.length - existingBest.size,
    });
  });

  return r;
}
