import multer from "multer";
import { HttpError } from "../middleware/httpError.js";
import { assertAllowedImageMime } from "./cloudinary.js";

/**
 * Maximum file size for single uploads (10MB).
 *
 * SCALABILITY NOTE: Files are held in memory (multer.memoryStorage) while streaming
 * to Cloudinary. At 10MB × 3 concurrent bulk uploads = ~300MB peak RAM.
 * For high-traffic deployments, consider:
 *   1. Reduce MAX_BYTES to 5MB (covers 99% of product photos)
 *   2. Use Cloudinary's direct browser upload (signed URL) to bypass server entirely
 *   3. Use disk storage with temp file cleanup for very large files
 */
const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 10 * 1024 * 1024;
const MAX_BULK_FILES = 10;

export const mediaUploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    try {
      assertAllowedImageMime(file.mimetype);
      cb(null, true);
    } catch (e) {
      cb(e instanceof HttpError ? new Error(e.message) : (e as Error));
    }
  },
});

/** Multer instance for bulk upload — up to 10 files at once. */
export const mediaBulkUploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: MAX_BULK_FILES },
  fileFilter: (_req, file, cb) => {
    try {
      assertAllowedImageMime(file.mimetype);
      cb(null, true);
    } catch (e) {
      cb(e instanceof HttpError ? new Error(e.message) : (e as Error));
    }
  },
});

export { MAX_BULK_FILES };

export function multerErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code);
    if (code === "LIMIT_FILE_SIZE") {
      return `Image must be ${MAX_BYTES / (1024 * 1024)}MB or smaller`;
    }
    if (code === "LIMIT_FILE_COUNT") {
      return `Maximum ${MAX_BULK_FILES} files per upload`;
    }
  }
  return err instanceof Error ? err.message : "Upload failed";
}
