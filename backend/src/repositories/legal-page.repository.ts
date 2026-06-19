/**
 * Legal page repository — focused data access for legal/policy pages.
 * Split from the monolithic settingsRepository for single-responsibility.
 */
import { LegalPage } from "../models/LegalPage.js";

export const legalPageRepository = {
  async findAll(filter: Record<string, unknown>) {
    return LegalPage.find(filter).sort({ order: 1, title: 1 }).lean();
  },

  async findBySlug(slug: string) {
    return LegalPage.findOne({ slug }).lean();
  },

  async findById(id: string) {
    return LegalPage.findById(id).lean();
  },

  async create(data: Record<string, unknown>) {
    return LegalPage.create(data);
  },

  async updateById(id: string, data: Record<string, unknown>) {
    return LegalPage.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },

  async deleteById(id: string) {
    return LegalPage.findByIdAndDelete(id);
  },

  async maxOrder() {
    const doc = await LegalPage.findOne().sort({ order: -1 }).select("order").lean();
    return (doc as { order?: number } | null)?.order ?? -1;
  },

  async slugExists(slug: string, excludeId?: string) {
    const filter: Record<string, unknown> = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    const exists = await LegalPage.findOne(filter).select("_id").lean();
    return Boolean(exists);
  },
};
