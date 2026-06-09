import { MediaAsset } from "../models/MediaAsset.js";

export const mediaRepository = {
  async find(filter: Record<string, unknown>, limit = 100) {
    return MediaAsset.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  },

  async create(data: { url: string; name: string; tags: string[]; category: string }) {
    return MediaAsset.create(data);
  },

  async updateById(id: string, data: Record<string, unknown>) {
    return MediaAsset.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteById(id: string) {
    return MediaAsset.findByIdAndDelete(id);
  },
};
