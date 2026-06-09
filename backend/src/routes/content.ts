import type { RequestHandler } from "express";
import { Router } from "express";
import { isAdminRequest, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { cmsService } from "../services/cms.service.js";

export function createContentRouter(secret: string) {
  const r = Router();

  // GET /site — Public or admin site settings
  r.get("/site", asyncHandler(async (req, res) => {
    const isAdmin = await isAdminRequest(req, secret);
    try {
      const settings = await cmsService.getSiteSettings(isAdmin);
      res.json({ settings });
    } catch (e) {
      console.error("[CONTENT /site] Error:", (e as Error).message, (e as Error).stack);
      throw e;
    }
  }));

  // GET /home — Public homepage data
  r.get("/home", asyncHandler(async (_req, res) => {
    const data = await cmsService.getHomepage();
    res.json(data);
  }));

  // GET /site/revisions — Revision history (admin)
  r.get(
    "/site/revisions",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (_req, res) => {
      const revisions = await cmsService.getRevisions();
      res.json({ revisions });
    }),
  );

  // PATCH /site — Update draft (admin)
  r.patch(
    "/site",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (req, res) => {
      const settings = await cmsService.updateSite(req.body);
      res.json({ settings });
    }),
  );

  // POST /site/publish — Publish draft (admin)
  r.post(
    "/site/publish",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (req, res) => {
      const settings = await cmsService.publish(req.user?._id ?? null);
      res.json({ settings });
    }),
  );

  // POST /site/rollback/:version — Rollback to version (admin)
  r.post(
    "/site/rollback/:version",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (req, res) => {
      const version = Number(req.params.version);
      const settings = await cmsService.rollback(version, req.user?._id ?? null);
      res.json({ settings });
    }),
  );

  return r;
}
