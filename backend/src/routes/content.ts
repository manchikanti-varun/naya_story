import type { RequestHandler } from "express";
import { Router } from "express";
import type { Request } from "express";
import { mergeHomepageConfig } from "../lib/homepage-defaults.js";
import { SiteSettings } from "../models/SiteSettings.js";
import { HomepageRevision } from "../models/HomepageRevision.js";
import { isAdminRequest, requireAdmin } from "../middleware/auth.js";
import type { HomepageConfig } from "../types/homepage.js";
import { mergeStorefrontSettings } from "../lib/storefront-settings.js";
import { asyncHandler } from "../middleware/httpError.js";
import { HttpError } from "../middleware/httpError.js";

type SiteDoc = {
  homepage?: unknown;
  homepageDraft?: unknown | null;
  homepagePublishedAt?: Date | null;
  homepageCmsVersion?: number;
  banners?: unknown;
  updatedAt?: Date;
  [key: string]: unknown;
};

function stableJson(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return "";
  }
}

export function createContentRouter(secret: string) {
  const r = Router();

  const loadDoc = async (): Promise<SiteDoc> => {
    let doc = (await SiteSettings.findOne().lean()) as SiteDoc | null;
    if (!doc) {
      const created = await SiteSettings.create({
        homepage: {},
        homepageDraft: null,
        banners: [],
      });
      doc = created.toObject() as SiteDoc;
    }
    return doc;
  };

  const publishedHomepage = (doc: SiteDoc): HomepageConfig =>
    mergeHomepageConfig(doc.homepage as Partial<HomepageConfig>);

  const editorHomepage = (doc: SiteDoc): HomepageConfig => {
    const base =
      doc.homepageDraft !== undefined && doc.homepageDraft !== null
        ? doc.homepageDraft
        : doc.homepage;
    return mergeHomepageConfig(base as Partial<HomepageConfig>);
  };

  const buildPublicSettings = (doc: SiteDoc) => ({
    homepage: publishedHomepage(doc),
    banners: doc.banners ?? [],
    storefront: mergeStorefrontSettings(doc.storefront),
    updatedAt: doc.updatedAt,
  });

  const buildAdminSettings = (doc: SiteDoc) => {
    const published = publishedHomepage(doc);
    const draftView = editorHomepage(doc);
    return {
      homepage: draftView,
      banners: doc.banners ?? [],
      storefront: mergeStorefrontSettings(doc.storefront),
      updatedAt: doc.updatedAt,
      cms: {
        publishedAt: doc.homepagePublishedAt?.toISOString() ?? null,
        version: doc.homepageCmsVersion ?? 0,
        hasUnpublishedChanges: stableJson(draftView) !== stableJson(published),
      },
    };
  };

  r.get(
    "/site",
    asyncHandler(async (req, res) => {
      const doc = await loadDoc();
      const admin = await isAdminRequest(req, secret);
      if (admin) {
        res.json({ settings: buildAdminSettings(doc) });
        return;
      }
      res.json({ settings: buildPublicSettings(doc) });
    }),
  );

  r.get(
    "/home",
    asyncHandler(async (_req, res) => {
      const doc = await loadDoc();
      res.json({ homepage: publishedHomepage(doc), settings: buildPublicSettings(doc) });
    }),
  );

  r.get(
    "/site/revisions",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (_req, res) => {
      const list = await HomepageRevision.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select("cmsVersion action actorId createdAt")
        .lean();
      res.json({ revisions: list });
    }),
  );

  r.patch(
    "/site",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (req, res) => {
      const body = req.body as {
        homepage?: unknown;
        banners?: unknown;
        storefront?: unknown;
      };
      const patch: Record<string, unknown> = {};
      if (body.homepage !== undefined) {
        patch.homepageDraft = mergeHomepageConfig(
          body.homepage as Partial<HomepageConfig>,
        );
      }
      if (body.banners !== undefined) patch.banners = body.banners;
      if (body.storefront !== undefined) {
        patch.storefront = mergeStorefrontSettings(body.storefront);
      }
      if (Object.keys(patch).length === 0) {
        throw new HttpError(400, "No valid fields to update (expected homepage, banners, and/or storefront).");
      }
      const doc = (await SiteSettings.findOneAndUpdate(
        {},
        { $set: patch },
        { new: true, upsert: true },
      ).lean()) as SiteDoc | null;
      if (!doc) throw new HttpError(500, "Update failed");
      res.json({ settings: buildAdminSettings(doc) });
    }),
  );

  r.post(
    "/site/publish",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (req: Request, res) => {
      const raw = await loadDoc();
      const merged = editorHomepage(raw);
      const nextVersion = (raw.homepageCmsVersion ?? 0) + 1;
      const doc = (await SiteSettings.findOneAndUpdate(
        {},
        {
          $set: {
            homepage: merged,
            homepageDraft: merged,
            homepagePublishedAt: new Date(),
            homepageCmsVersion: nextVersion,
          },
        },
        { new: true, upsert: true },
      ).lean()) as SiteDoc | null;
      if (!doc) throw new HttpError(500, "Publish failed");
      await HomepageRevision.create({
        cmsVersion: nextVersion,
        homepage: merged,
        action: "publish",
        actorId: req.user?._id ?? null,
      });
      res.json({ settings: buildAdminSettings(doc) });
    }),
  );

  r.post(
    "/site/rollback/:version",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (req: Request, res) => {
      const targetVer = Number(req.params.version);
      if (!Number.isFinite(targetVer) || targetVer < 1) {
        throw new HttpError(400, "Invalid version");
      }
      const rev = await HomepageRevision.findOne({ cmsVersion: targetVer }).lean();
      if (!rev || Array.isArray(rev)) throw new HttpError(404, "Revision not found");
      const merged = mergeHomepageConfig(
        (rev as { homepage?: unknown }).homepage as Partial<HomepageConfig>,
      );
      const current = await loadDoc();
      const nextVersion = (current.homepageCmsVersion ?? 0) + 1;
      const doc = (await SiteSettings.findOneAndUpdate(
        {},
        {
          $set: {
            homepage: merged,
            homepageDraft: merged,
            homepagePublishedAt: new Date(),
            homepageCmsVersion: nextVersion,
          },
        },
        { new: true, upsert: true },
      ).lean()) as SiteDoc | null;
      if (!doc) throw new HttpError(500, "Rollback failed");
      await HomepageRevision.create({
        cmsVersion: nextVersion,
        homepage: merged,
        action: "rollback",
        actorId: req.user?._id ?? null,
      });
      res.json({ settings: buildAdminSettings(doc) });
    }),
  );

  return r;
}
