/**
 * Site settings repository — manages the singleton SiteSettings document.
 *
 * Legal pages and homepage revisions have been moved to their own repositories:
 *   - legal-page.repository.ts
 *   - revision.repository.ts
 *
 * For backward-compatibility, this module re-exports delegating methods so
 * existing callers continue to work without changes. Migrate gradually.
 */
import { SiteSettings } from "../models/SiteSettings.js";
import { legalPageRepository } from "./legal-page.repository.js";
import { revisionRepository } from "./revision.repository.js";
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

  // --- Delegating methods (backward-compat) ---

  // Homepage Revisions (delegate to revisionRepository)
  async createRevision(data: {
    cmsVersion: number;
    homepage: unknown;
    action: "publish" | "rollback";
    actorId: mongoose.Types.ObjectId | null;
  }) {
    return revisionRepository.create(data);
  },

  async findRevisions(limit = 50) {
    return revisionRepository.findRecent(limit);
  },

  async findRevisionByVersion(version: number) {
    return revisionRepository.findByVersion(version);
  },

  // Legal Pages (delegate to legalPageRepository)
  async findLegalPages(filter: Record<string, unknown>) {
    return legalPageRepository.findAll(filter);
  },

  async findLegalPageBySlug(slug: string) {
    return legalPageRepository.findBySlug(slug);
  },

  async findLegalPageById(id: string) {
    return legalPageRepository.findById(id);
  },

  async createLegalPage(data: Record<string, unknown>) {
    return legalPageRepository.create(data);
  },

  async updateLegalPage(id: string, data: Record<string, unknown>) {
    return legalPageRepository.updateById(id, data);
  },

  async deleteLegalPage(id: string) {
    return legalPageRepository.deleteById(id);
  },

  async maxLegalPageOrder() {
    return legalPageRepository.maxOrder();
  },

  async legalPageSlugExists(slug: string, excludeId?: string) {
    return legalPageRepository.slugExists(slug, excludeId);
  },
};
