/**
 * Media service — handles image uploads and media library management.
 */
import { mediaRepository } from "../repositories/media.repository.js";
import { getCloudinaryPublicStatus, uploadImageBuffer } from "../lib/cloudinary.js";
import { HttpError } from "../middleware/httpError.js";

function assertSecureMediaUrl(url: string): void {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new HttpError(400, "Invalid media URL");
  }
  if (process.env.NODE_ENV === "production" && u.protocol !== "https:") {
    throw new HttpError(400, "Media URLs must use https in production");
  }
  const host = u.hostname.toLowerCase();
  if (process.env.NODE_ENV === "production" && (host === "localhost" || host === "127.0.0.1")) {
    throw new HttpError(400, "Localhost media URLs are not allowed in production");
  }
}

export const mediaService = {
  getUploadConfig() {
    const status = getCloudinaryPublicStatus();
    return {
      ...status,
      maxBytes: 10 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
    };
  },

  async uploadSingle(
    buffer: Buffer,
    mimetype: string,
    originalName: string,
    options: { category?: string; name?: string; tags?: string[]; saveToLibrary?: boolean },
  ) {
    const category = options.category?.trim() || "general";
    const name = options.name?.trim() || originalName.replace(/\.[^.]+$/, "") || "Uploaded image";
    const tags = options.tags ?? [];
    const saveToLibrary = options.saveToLibrary !== false;

    const uploaded = await uploadImageBuffer(buffer, { folder: category, mimetype });
    assertSecureMediaUrl(uploaded.url);

    let item = null;
    if (saveToLibrary) {
      item = await mediaRepository.create({ url: uploaded.url, name, tags, category });
    }

    return { url: uploaded.url, publicId: uploaded.publicId, width: uploaded.width, height: uploaded.height, item };
  },

  async uploadBulk(
    files: { buffer: Buffer; mimetype: string; originalname: string }[],
    options: { category?: string; saveToLibrary?: boolean },
  ) {
    const category = options.category?.trim() || "general";
    const saveToLibrary = options.saveToLibrary !== false;

    type UploadResult = { url: string; publicId: string; width?: number; height?: number; originalName: string };
    type UploadError = { originalName: string; error: string };

    const results: (UploadResult | UploadError)[] = [];
    const concurrency = 3;

    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(async (file) => {
          const uploaded = await uploadImageBuffer(file.buffer, { folder: category, mimetype: file.mimetype });
          assertSecureMediaUrl(uploaded.url);
          if (saveToLibrary) {
            const name = file.originalname?.replace(/\.[^.]+$/, "") || "Uploaded image";
            await mediaRepository.create({ url: uploaded.url, name, tags: [], category });
          }
          return { url: uploaded.url, publicId: uploaded.publicId, width: uploaded.width, height: uploaded.height, originalName: file.originalname ?? "unknown" } satisfies UploadResult;
        }),
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j]!;
        if (result.status === "fulfilled") results.push(result.value);
        else results.push({ originalName: batch[j]!.originalname ?? "unknown", error: result.reason instanceof Error ? result.reason.message : "Upload failed" });
      }
    }

    const succeeded = results.filter((r): r is UploadResult => !("error" in r && r.error));
    const failed = results.filter((r): r is UploadError => "error" in r && Boolean(r.error));

    return { uploaded: succeeded, failed, total: files.length, successCount: succeeded.length, failCount: failed.length };
  },

  async listAssets(query: { q?: string; category?: string; limit?: string }) {
    const filter: Record<string, unknown> = {};
    if (query.category) filter.category = query.category;
    if (query.q?.trim()) filter.$text = { $search: query.q.trim() };
    const lim = Math.min(Number(query.limit) || 100, 500);
    return mediaRepository.find(filter, lim);
  },

  async createAsset(url: string, name: string, tags: string[], category: string) {
    assertSecureMediaUrl(url);
    return mediaRepository.create({ url, name, tags, category });
  },

  async updateAsset(id: string, rawBody: Record<string, unknown>) {
    const allowedFields = ["url", "name", "tags", "category"];
    const sanitized: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in rawBody) sanitized[key] = rawBody[key];
    }
    if (sanitized.url) assertSecureMediaUrl(String(sanitized.url));
    const doc = await mediaRepository.updateById(id, sanitized);
    if (!doc) throw new HttpError(404, "Not found");
    return doc;
  },

  async deleteAsset(id: string) {
    await mediaRepository.deleteById(id);
  },
};
