/**
 * Homepage revision repository — focused data access for CMS version history.
 * Split from the monolithic settingsRepository for single-responsibility.
 */
import { HomepageRevision } from "../models/HomepageRevision.js";
import type mongoose from "mongoose";

export const revisionRepository = {
  async create(data: {
    cmsVersion: number;
    homepage: unknown;
    action: "publish" | "rollback";
    actorId: mongoose.Types.ObjectId | null;
  }) {
    return HomepageRevision.create(data);
  },

  async findRecent(limit = 50) {
    return HomepageRevision.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("cmsVersion action actorId createdAt")
      .lean();
  },

  async findByVersion(version: number) {
    const rev = await HomepageRevision.findOne({ cmsVersion: version }).lean();
    if (!rev || Array.isArray(rev)) return null;
    return rev as unknown as { homepage?: unknown; cmsVersion: number };
  },
};
