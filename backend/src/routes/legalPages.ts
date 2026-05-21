import type { RequestHandler } from "express";
import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { slugify } from "../lib/slugify.js";
import { LegalPage } from "../models/LegalPage.js";
import { isAdminRequest, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { HttpError } from "../middleware/httpError.js";

type LeanLegalPage = {
  _id: unknown;
  title: string;
  slug: string;
  body?: string;
  published: boolean;
  order: number;
  updatedAt?: Date;
};

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base) || "page";
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const filter: Record<string, unknown> = { slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };
    const exists = await LegalPage.findOne(filter).select("_id").lean();
    if (!exists) return candidate;
    n += 1;
  }
}

function serializeList(page: LeanLegalPage) {
  return {
    id: String(page._id),
    title: page.title,
    slug: page.slug,
    body: page.body ?? "",
    published: page.published,
    order: page.order,
    updatedAt: page.updatedAt?.toISOString?.() ?? null,
  };
}

export function createLegalPagesRouter(secret: string) {
  const r = Router();

  r.get(
    "/",
    asyncHandler(async (req, res) => {
      const admin = await isAdminRequest(req, secret);
      const filter = admin ? {} : { published: true };
      const pages = (await LegalPage.find(filter).sort({ order: 1, title: 1 }).lean()) as unknown as LeanLegalPage[];
      res.json({ pages: pages.map(serializeList) });
    }),
  );

  r.get(
    "/:slug",
    asyncHandler(async (req, res) => {
      const admin = await isAdminRequest(req, secret);
      const slug = String(req.params.slug).trim().toLowerCase();
      const page = (await LegalPage.findOne({ slug }).lean()) as unknown as LeanLegalPage | null;
      if (!page) throw new HttpError(404, "Page not found");
      if (!page.published && !admin) throw new HttpError(404, "Page not found");
      res.json({ page: serializeList(page) });
    }),
  );

  r.post(
    "/",
    ...(requireAdmin(secret) as RequestHandler[]),
    body("title").trim().notEmpty(),
    body("body").optional().isString(),
    body("slug").optional().isString(),
    body("published").optional().isBoolean(),
    body("order").optional().isNumeric(),
    asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpError(400, "Validation failed", { errors: errors.array() });
      }
      const { title, body: pageBody, slug, published, order } = req.body as {
        title: string;
        body?: string;
        slug?: string;
        published?: boolean;
        order?: number;
      };
      const nextSlug = await uniqueSlug(slug?.trim() || title);
      const maxOrder = (await LegalPage.findOne().sort({ order: -1 }).select("order").lean()) as unknown as {
        order: number;
      } | null;
      const doc = await LegalPage.create({
        title: title.trim(),
        slug: nextSlug,
        body: pageBody?.trim() ?? "",
        published: published ?? true,
        order: order ?? (maxOrder?.order ?? -1) + 1,
      });
      res.status(201).json({ page: serializeList(doc.toObject()) });
    }),
  );

  r.patch(
    "/:id",
    ...(requireAdmin(secret) as RequestHandler[]),
    param("id").notEmpty(),
    body("title").optional().trim().notEmpty(),
    body("body").optional().isString(),
    body("slug").optional().isString(),
    body("published").optional().isBoolean(),
    body("order").optional().isNumeric(),
    asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpError(400, "Validation failed", { errors: errors.array() });
      }
      const { title, body: pageBody, slug, published, order } = req.body as {
        title?: string;
        body?: string;
        slug?: string;
        published?: boolean;
        order?: number;
      };
      const patch: Record<string, unknown> = {};
      if (title !== undefined) patch.title = title.trim();
      if (pageBody !== undefined) patch.body = pageBody;
      if (published !== undefined) patch.published = published;
      if (order !== undefined) patch.order = Number(order);
      if (slug !== undefined) patch.slug = await uniqueSlug(slug.trim() || title || "page", req.params.id);
      else if (title !== undefined) {
        const current = await LegalPage.findById(req.params.id).lean();
        if (current && !slug) {
          /* keep slug unless title-only edit — optional auto slug on title change: skip for UX */
        }
      }

      const doc = (await LegalPage.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true }).lean()) as unknown as
        | LeanLegalPage
        | null;
      if (!doc) throw new HttpError(404, "Page not found");
      res.json({ page: serializeList(doc) });
    }),
  );

  r.delete(
    "/:id",
    ...(requireAdmin(secret) as RequestHandler[]),
    param("id").notEmpty(),
    asyncHandler(async (req, res) => {
      const doc = await LegalPage.findByIdAndDelete(req.params.id);
      if (!doc) throw new HttpError(404, "Page not found");
      res.json({ ok: true });
    }),
  );

  return r;
}
