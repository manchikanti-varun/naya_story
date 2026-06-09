import { SiteSettings } from "../models/SiteSettings.js";
import { HomepageRevision } from "../models/HomepageRevision.js";
import { LegalPage } from "../models/LegalPage.js";
import type mongoose from "mongoose";

export type SiteDoc = {
  _id?: unknown;
  homepage?: unknown;
  homepageDraft?: unknown | null;
  homepagePublishedAt?: Date | null;
  homepageCmsVersion?: number;
  banners?: unknown;
  storefront?: unknown;
  updatedAt?: Date;
  [key: string]: unknown;
};

export const settingsRepository = {
  async findOne(): Promise<SiteDoc | null> {
    return SiteSettings.findOne().lean() as Promise<SiteDoc | null>;
  },

  async findOrCreate(): Promise<SiteDoc> {
    let doc = await SiteSettings.findOne().lean() as SiteDoc | null;
    if (!doc) {
      const created = await SiteSettings.create({
        homepage: {},
        homepageDraft: null,
        banners: [],
      });
      doc = created.toObject() as SiteDoc;
    }
    return doc;
  },

  async updateOne(filter: Record<string, unknown>, update: Record<string, unknown>) {
    return SiteSettings.findOneAndUpdate(filter, update, { new: true, upsert: true }).lean() as Promise<SiteDoc | null>;
  },

  async upsertFields(fields: Record<string, unknown>) {
    return SiteSettings.findOneAndUpdate(
      {},
      { $set: fields },
      { new: true, upsert: true },
    ).lean() as Promise<SiteDoc | null>;
  },

  // Homepage Revisions
  async createRevision(data: {
    cmsVersion: number;
    homepage: unknown;
    action: "publish" | "rollback";
    actorId: mongoose.Types.ObjectId | null;
  }) {
    return HomepageRevision.create(data);
  },

  async findRevisions(limit = 50) {
    return HomepageRevision.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("cmsVersion action actorId createdAt")
      .lean();
  },

  async findRevisionByVersion(version: number) {
    const rev = await HomepageRevision.findOne({ cmsVersion: version }).lean();
    if (!rev || Array.isArray(rev)) return null;
    return rev as unknown as { homepage?: unknown; cmsVersion: number };
  },

  // Legal Pages
  async findLegalPages(filter: Record<string, unknown>) {
    return LegalPage.find(filter).sort({ order: 1, title: 1 }).lean();
  },

  async findLegalPageBySlug(slug: string) {
    return LegalPage.findOne({ slug }).lean();
  },

  async findLegalPageById(id: string) {
    return LegalPage.findById(id).lean();
  },

  async createLegalPage(data: Record<string, unknown>) {
    return LegalPage.create(data);
  },

  async updateLegalPage(id: string, data: Record<string, unknown>) {
    return LegalPage.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },

  async deleteLegalPage(id: string) {
    return LegalPage.findByIdAndDelete(id);
  },

  async maxLegalPageOrder() {
    const doc = await LegalPage.findOne().sort({ order: -1 }).select("order").lean();
    return (doc as { order?: number } | null)?.order ?? -1;
  },

  async legalPageSlugExists(slug: string, excludeId?: string) {
    const filter: Record<string, unknown> = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    const exists = await LegalPage.findOne(filter).select("_id").lean();
    return Boolean(exists);
  },
};
