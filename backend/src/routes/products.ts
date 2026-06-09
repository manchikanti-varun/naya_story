import type { Request, RequestHandler } from "express";
import { Router } from "express";
import { validationResult } from "express-validator";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { verifyAccessToken } from "../lib/accessJwt.js";
import { User } from "../models/User.js";
import { productService, type ProductListQuery } from "../services/product.service.js";
import { createProductRules } from "../validators/product.validator.js";
import { handleValidationErrors } from "../validators/index.js";

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

export function createProductsRouter(secret: string) {
  const r = Router();

  // GET / — List/search products
  r.get("/", asyncHandler(async (req, res) => {
    const isAdmin = await requestIsAdmin(req, secret);
    const result = await productService.listProducts(req.query as ProductListQuery, isAdmin);
    res.json(result);
  }));

  // GET /slug/:slug — Single product by slug
  r.get("/slug/:slug", asyncHandler(async (req, res) => {
    const isAdmin = await requestIsAdmin(req, secret);
    const result = await productService.getProductBySlug(req.params.slug, isAdmin);
    res.json(result);
  }));

  // POST / — Create product (admin)
  r.post(
    "/",
    ...(requireAdmin(secret) as RequestHandler[]),
    ...createProductRules,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const product = await productService.createProduct(req.body as Record<string, unknown>);
      res.status(201).json({ product });
    }),
  );

  // PATCH /:id — Update product (admin)
  r.patch("/:id", ...(requireAdmin(secret) as RequestHandler[]), asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body as Record<string, unknown>);
    res.json({ product });
  }));

  // DELETE /:id — Delete product (admin)
  r.delete("/:id", ...(requireAdmin(secret) as RequestHandler[]), asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id);
    res.json({ ok: true });
  }));

  // POST /sync-categories — Sync all product categories to CMS
  r.post("/sync-categories", ...(requireAdmin(secret) as RequestHandler[]), asyncHandler(async (_req, res) => {
    const { added, total } = await productService.syncAllCategories();
    res.json({ ok: true, message: `Synced ${added} new categories`, total });
  }));

  // POST /sync-homepage-pins — Sync newIn/bestseller pins
  r.post("/sync-homepage-pins", ...(requireAdmin(secret) as RequestHandler[]), asyncHandler(async (_req, res) => {
    const result = await productService.syncAllHomepagePins();
    res.json({ ok: true, ...result });
  }));

  return r;
}
