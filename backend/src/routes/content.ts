import type { RequestHandler } from "express";
import { Router } from "express";
import { mergeHomepageConfig } from "../lib/homepage-defaults.js";
import { SiteSettings } from "../models/SiteSettings.js";
import { requireAdmin } from "../middleware/auth.js";
import type { HomepageConfig } from "../types/homepage.js";

type SiteDoc = {
  homepage?: unknown;
  banners?: unknown;
  [key: string]: unknown;
};

export function createContentRouter(secret: string) {
  const r = Router();

  r.get("/site", async (_req, res) => {
    let doc = (await SiteSettings.findOne().lean()) as SiteDoc | null;
    if (!doc) {
      const created = await SiteSettings.create({
        homepage: {},
        banners: [],
      });
      doc = created.toObject() as SiteDoc;
    }
    const merged = {
      ...doc,
      homepage: mergeHomepageConfig(doc.homepage as Partial<HomepageConfig>),
    };
    res.json({ settings: merged });
  });

  r.patch(
    "/site",
    ...(requireAdmin(secret) as RequestHandler[]),
    async (req, res) => {
      const body = req.body as { homepage?: unknown; banners?: unknown };
      const patch: Record<string, unknown> = {};
      if (body.homepage !== undefined) {
        patch.homepage = mergeHomepageConfig(
          body.homepage as Partial<HomepageConfig>,
        );
      }
      if (body.banners !== undefined) patch.banners = body.banners;
      const doc = (await SiteSettings.findOneAndUpdate(
        {},
        { $set: patch },
        { new: true, upsert: true },
      ).lean()) as SiteDoc | null;
      if (!doc) return res.status(500).json({ message: "Update failed" });
      res.json({
        settings: {
          ...doc,
          homepage: mergeHomepageConfig(
            doc.homepage as Partial<HomepageConfig>,
          ),
        },
      });
    },
  );

  return r;
}
