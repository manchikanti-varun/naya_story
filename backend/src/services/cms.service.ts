/**
 * CMS service — handles homepage draft/publish/rollback and site settings.
 */
import type mongoose from "mongoose";
import { settingsRepository, type SiteDoc } from "../repositories/settings.repository.js";
import { mergeHomepageConfig } from "../lib/homepage-defaults.js";
import { mergeStorefrontSettings } from "../lib/storefront-settings.js";
import { HttpError } from "../middleware/httpError.js";
import type { HomepageConfig } from "../types/homepage.js";

function stableJson(obj: unknown): string {
  try { return JSON.stringify(obj); } catch { return ""; }
}

function publishedHomepage(doc: SiteDoc): HomepageConfig {
  try {
    return mergeHomepageConfig(doc.homepage as Partial<HomepageConfig>);
  } catch (e) {
    console.error("[CMS] publishedHomepage merge failed:", (e as Error).message);
    return mergeHomepageConfig(null);
  }
}

function editorHomepage(doc: SiteDoc): HomepageConfig {
  try {
    const base = doc.homepageDraft !== undefined && doc.homepageDraft !== null
      ? doc.homepageDraft
      : doc.homepage;
    return mergeHomepageConfig(base as Partial<HomepageConfig>);
  } catch (e) {
    console.error("[CMS] editorHomepage merge failed:", (e as Error).message);
    return mergeHomepageConfig(null);
  }
}

function buildPublicSettings(doc: SiteDoc) {
  return {
    homepage: publishedHomepage(doc),
    banners: doc.banners ?? [],
    storefront: mergeStorefrontSettings(doc.storefront),
    updatedAt: doc.updatedAt,
  };
}

function buildAdminSettings(doc: SiteDoc) {
  const published = publishedHomepage(doc);
  const draftView = editorHomepage(doc);
  const hasUnpublishedChanges = stableJson(draftView) !== stableJson(published);
  return {
    homepage: draftView,
    banners: doc.banners ?? [],
    storefront: mergeStorefrontSettings(doc.storefront),
    updatedAt: doc.updatedAt,
    cms: {
      publishedAt: doc.homepagePublishedAt?.toISOString?.() ?? null,
      version: doc.homepageCmsVersion ?? 0,
      hasUnpublishedChanges,
    },
  };
}

export const cmsService = {
  async getSiteSettings(isAdmin: boolean) {
    const doc = await settingsRepository.findOrCreate();
    try {
      return isAdmin ? buildAdminSettings(doc) : buildPublicSettings(doc);
    } catch (e) {
      console.error("[CMS] getSiteSettings crash — falling back to defaults:", (e as Error).message, (e as Error).stack);
      // If settings data is corrupted, return safe defaults rather than 500
      const fallbackDoc: SiteDoc = { homepage: {}, banners: [], storefront: {} };
      try {
        return isAdmin ? buildAdminSettings(fallbackDoc) : buildPublicSettings(fallbackDoc);
      } catch {
        throw e; // If even defaults fail, something is fundamentally wrong
      }
    }
  },

  async getHomepage() {
    const doc = await settingsRepository.findOrCreate();
    return { homepage: publishedHomepage(doc), settings: buildPublicSettings(doc) };
  },

  async getRevisions(limit = 50) {
    return settingsRepository.findRevisions(limit);
  },

  async updateSite(body: { homepage?: unknown; banners?: unknown; storefront?: unknown }) {
    const patch: Record<string, unknown> = {};
    if (body.homepage !== undefined) {
      patch.homepageDraft = mergeHomepageConfig(body.homepage as Partial<HomepageConfig>);
    }
    if (body.banners !== undefined) patch.banners = body.banners;
    if (body.storefront !== undefined) {
      patch.storefront = mergeStorefrontSettings(body.storefront);
    }
    if (Object.keys(patch).length === 0) {
      throw new HttpError(400, "No valid fields to update (expected homepage, banners, and/or storefront).");
    }

    const doc = await settingsRepository.upsertFields(patch);
    if (!doc) throw new HttpError(500, "Update failed");
    return buildAdminSettings(doc);
  },

  async publish(actorId: mongoose.Types.ObjectId | null) {
    const raw = await settingsRepository.findOrCreate();
    const merged = editorHomepage(raw);
    const nextVersion = (raw.homepageCmsVersion ?? 0) + 1;

    const doc = await settingsRepository.upsertFields({
      homepage: merged,
      homepageDraft: merged,
      homepagePublishedAt: new Date(),
      homepageCmsVersion: nextVersion,
    });
    if (!doc) throw new HttpError(500, "Publish failed");

    await settingsRepository.createRevision({
      cmsVersion: nextVersion,
      homepage: merged,
      action: "publish",
      actorId,
    });

    return buildAdminSettings(doc);
  },

  async rollback(targetVersion: number, actorId: mongoose.Types.ObjectId | null) {
    if (!Number.isFinite(targetVersion) || targetVersion < 1) {
      throw new HttpError(400, "Invalid version");
    }

    const rev = await settingsRepository.findRevisionByVersion(targetVersion);
    if (!rev) throw new HttpError(404, "Revision not found");

    const merged = mergeHomepageConfig(rev.homepage as Partial<HomepageConfig>);
    const current = await settingsRepository.findOrCreate();
    const nextVersion = (current.homepageCmsVersion ?? 0) + 1;

    const doc = await settingsRepository.upsertFields({
      homepage: merged,
      homepageDraft: merged,
      homepagePublishedAt: new Date(),
      homepageCmsVersion: nextVersion,
    });
    if (!doc) throw new HttpError(500, "Rollback failed");

    await settingsRepository.createRevision({
      cmsVersion: nextVersion,
      homepage: merged,
      action: "rollback",
      actorId,
    });

    return buildAdminSettings(doc);
  },
};
