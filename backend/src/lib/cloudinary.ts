import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { HttpError } from "../middleware/httpError.js";

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
};

let configured = false;

export function isCloudinaryConfigured(): boolean {
  if (process.env.CLOUDINARY_URL?.trim()) return true;
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

function ensureConfigured(): void {
  if (!isCloudinaryConfigured()) {
    throw new HttpError(
      503,
      "Cloudinary is not configured. Set CLOUDINARY_URL (recommended) or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET on the API server.",
    );
  }
  if (!configured) {
    if (process.env.CLOUDINARY_URL?.trim()) {
      // SDK reads CLOUDINARY_URL from the environment when no credentials are passed.
      cloudinary.config({ secure: true });
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME!.trim(),
        api_key: process.env.CLOUDINARY_API_KEY!.trim(),
        api_secret: process.env.CLOUDINARY_API_SECRET!.trim(),
        secure: true,
      });
    }
    configured = true;
  }
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export function assertAllowedImageMime(mimetype: string): void {
  if (!ALLOWED_MIME.has(mimetype.toLowerCase())) {
    throw new HttpError(400, "Only JPEG, PNG, WebP, GIF, and AVIF images are allowed");
  }
}

export async function uploadImageBuffer(
  buffer: Buffer,
  options: { folder: string; mimetype: string },
): Promise<CloudinaryUploadResult> {
  ensureConfigured();
  assertAllowedImageMime(options.mimetype);

  const folder = `naya/${options.folder.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "general"}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        unique_filename: true,
        overwrite: false,
        use_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(new HttpError(502, error.message || "Cloudinary upload failed"));
          return;
        }
        if (!result?.secure_url) {
          reject(new HttpError(502, "Cloudinary returned no image URL"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        });
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}
