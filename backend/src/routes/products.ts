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
    if (color) filter["variants.color"] = new RegExp(`^${color}$`, "i");

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
    const relatedOr: Record<string, unknown>[] = [{ category: product.category }];
    if (product.collection?.trim()) {
      relatedOr.push({ collection: product.collection.trim() });
    }
    const relatedFilter: Record<string, unknown> = {
      $or: relatedOr,
      _id: { $ne: product._id },
    };
    if (!admin) relatedFilter.storefrontVisible = { $ne: false };
    const related = await Product.find(relatedFilter)
      .sort({ createdAt: -1 })
      .limit(16)
      .lean();
    res.json({
      product: sanitizeProductMedia(product as unknown as Record<string, unknown>),
      related: related.map((p) => sanitizeProductMedia(p as Record<string, unknown>)),
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
        res.status(201).json({ product: sanitizeProductMedia(doc.toObject() as Record<string, unknown>) });
      } catch (e) {
        res.status(400).json({ message: (e as Error).message });
      }
    },
  );

  r.patch("/:id", ...(requireAdmin(secret) as RequestHandler[]), async (req, res) => {
    try {
      const body = sanitizeProductMedia(req.body as Record<string, unknown>);
      const doc = await Product.findByIdAndUpdate(req.params.id, body, {
        new: true,
      });
      if (!doc) return res.status(404).json({ message: "Not found" });
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

  return r;
}
