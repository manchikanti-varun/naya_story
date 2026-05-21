import multer from "multer";
import { HttpError } from "../middleware/httpError.js";
import { assertAllowedImageMime } from "./cloudinary.js";

const MAX_BYTES = 10 * 1024 * 1024;

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

export function multerErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code);
    if (code === "LIMIT_FILE_SIZE") {
      return `Image must be ${MAX_BYTES / (1024 * 1024)}MB or smaller`;
    }
  }
  return err instanceof Error ? err.message : "Upload failed";
}
