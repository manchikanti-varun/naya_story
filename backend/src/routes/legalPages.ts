import type { RequestHandler } from "express";
import { Router } from "express";
import { body, param } from "express-validator";
import { slugify } from "../lib/slugify.js";
import { sanitizeRichContent } from "../lib/sanitize-html-content.js";
import { isAdminRequest, requireAdmin } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/httpError.js";
import { settingsRepository } from "../repositories/settings.repository.js";
import { handleValidationErrors } from "../validators/index.js";

type LeanLegalPage = {
  _id: unknown;
  title: string;
  slug: string;
  body?: string;
  published: boolean;
  order: number;
  updatedAt?: Date;
};

function serialize(page: LeanLegalPage) {
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

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base) || "page";
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const exists = await settingsRepository.legalPageSlugExists(candidate, excludeId);
    if (!exists) return candidate;
    n += 1;
  }
}

export function createLegalPagesRouter(secret: string) {
  const r = Router();

  // GET / — list pages
  r.get("/", asyncHandler(async (req, res) => {
    const admin = await isAdminRequest(req, secret);
    const filter = admin ? {} : { published: true };
    const pages = await settingsRepository.findLegalPages(filter) as unknown as LeanLegalPage[];
    res.json({ pages: pages.map(serialize) });
  }));

  // GET /:slug — single page
  r.get("/:slug", asyncHandler(async (req, res) => {
    const admin = await isAdminRequest(req, secret);
    const slug = String(req.params.slug).trim().toLowerCase();
    const page = await settingsRepository.findLegalPageBySlug(slug) as unknown as LeanLegalPage | null;
    if (!page) throw new HttpError(404, "Page not found");
    if (!page.published && !admin) throw new HttpError(404, "Page not found");
    res.json({ page: serialize(page) });
  }));

  // POST / — create page (admin)
  r.post(
    "/",
    ...(requireAdmin(secret) as RequestHandler[]),
    body("title").trim().notEmpty(),
    body("body").optional().isString().isLength({ max: 200000 }),
    body("slug").optional().isString(),
    body("published").optional().isBoolean(),
    body("order").optional().isNumeric(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const { title, body: pageBody, slug, published, order } = req.body;
      const nextSlug = await uniqueSlug(slug?.trim() || title);
      const maxOrder = await settingsRepository.maxLegalPageOrder();
      const doc = await settingsRepository.createLegalPage({
        title: title.trim(),
        slug: nextSlug,
        body: sanitizeRichContent(pageBody?.trim() ?? ""),
        published: published ?? true,
        order: order ?? maxOrder + 1,
      });
      const created = (doc as unknown as { toObject?: () => LeanLegalPage }).toObject?.() ?? doc;
      res.status(201).json({ page: serialize(created as unknown as LeanLegalPage) });
    }),
  );

  // PATCH /:id — update page (admin)
  r.patch(
    "/:id",
    ...(requireAdmin(secret) as RequestHandler[]),
    param("id").notEmpty(),
    body("title").optional().trim().notEmpty(),
    body("body").optional().isString().isLength({ max: 200000 }),
    body("slug").optional().isString(),
    body("published").optional().isBoolean(),
    body("order").optional().isNumeric(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const { title, body: pageBody, slug, published, order } = req.body;
      const patch: Record<string, unknown> = {};
      if (title !== undefined) patch.title = title.trim();
      if (pageBody !== undefined) patch.body = sanitizeRichContent(pageBody);
      if (published !== undefined) patch.published = published;
      if (order !== undefined) patch.order = Number(order);
      if (slug !== undefined) patch.slug = await uniqueSlug(slug.trim() || title || "page", req.params.id);

      const doc = await settingsRepository.updateLegalPage(req.params.id, patch) as unknown as LeanLegalPage | null;
      if (!doc) throw new HttpError(404, "Page not found");
      res.json({ page: serialize(doc) });
    }),
  );

  // DELETE /:id — delete page (admin)
  r.delete(
    "/:id",
    ...(requireAdmin(secret) as RequestHandler[]),
    param("id").notEmpty(),
    asyncHandler(async (req, res) => {
      const doc = await settingsRepository.deleteLegalPage(req.params.id);
      if (!doc) throw new HttpError(404, "Page not found");
      res.json({ ok: true });
    }),
  );

  return r;
}
