import type { RequestHandler } from "express";
import { Router } from "express";
import { body, validationResult } from "express-validator";
import { MediaAsset } from "../models/MediaAsset.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { HttpError } from "../middleware/httpError.js";
import { isCloudinaryConfigured, uploadImageBuffer } from "../lib/cloudinary.js";
import { mediaUploadMulter, multerErrorMessage } from "../lib/media-upload-multer.js";

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

export function createMediaRouter(secret: string) {
  const r = Router();
  r.use(...(requireAdmin(secret) as RequestHandler[]));

  r.get("/upload-config", (_req, res) => {
    res.json({
      configured: isCloudinaryConfigured(),
      maxBytes: 10 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
    });
  });

  const runUpload: RequestHandler = (req, res, next) => {
    mediaUploadMulter.single("file")(req, res, (err) => {
      if (err) {
        res.status(400).json({ message: multerErrorMessage(err) });
        return;
      }
      next();
    });
  };

  r.post(
    "/upload",
    runUpload,
    asyncHandler(async (req, res) => {
      if (!req.file?.buffer?.length) {
        throw new HttpError(400, "Missing image file (field name: file)");
      }

      const category =
        typeof req.body?.category === "string" && req.body.category.trim()
          ? req.body.category.trim()
          : "general";
      const nameFromBody =
        typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const name =
        nameFromBody ||
        req.file.originalname?.replace(/\.[^.]+$/, "") ||
        "Uploaded image";
      const tagsRaw = req.body?.tags;
      const tags = Array.isArray(tagsRaw)
        ? tagsRaw.map(String)
        : typeof tagsRaw === "string"
          ? tagsRaw
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];
      const saveToLibrary = req.body?.saveToLibrary !== "false" && req.body?.saveToLibrary !== false;

      let uploaded;
      try {
        uploaded = await uploadImageBuffer(req.file.buffer, {
          folder: category,
          mimetype: req.file.mimetype,
        });
      } catch (e) {
        if (e instanceof HttpError) throw e;
        throw new HttpError(502, multerErrorMessage(e));
      }

      assertSecureMediaUrl(uploaded.url);

      let item = null;
      if (saveToLibrary) {
        item = await MediaAsset.create({
          url: uploaded.url,
          name,
          tags,
          category,
        });
      }

      res.status(201).json({
        url: uploaded.url,
        publicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
        item,
      });
    }),
  );

  r.get("/", async (req, res) => {
    const { q, category, limit } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (q?.trim()) filter.$text = { $search: q.trim() };
    const lim = Math.min(Number(limit) || 100, 500);
    const items = await MediaAsset.find(filter).sort({ createdAt: -1 }).limit(lim).lean();
    res.json({ items });
  });

  r.post(
    "/",
    body("url").isURL({ require_tld: false }),
    body("name").notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      try {
        const url = String(req.body.url ?? "");
        assertSecureMediaUrl(url);
        const doc = await MediaAsset.create({
          url: req.body.url,
          name: req.body.name,
          tags: Array.isArray(req.body.tags) ? req.body.tags : [],
          category: typeof req.body.category === "string" ? req.body.category : "general",
        });
        res.status(201).json({ item: doc });
      } catch (e) {
        if (e instanceof HttpError) return res.status(e.status).json({ message: e.message });
        res.status(400).json({ message: (e as Error).message });
      }
    },
  );

  r.patch("/:id", async (req, res) => {
    const doc = await MediaAsset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ item: doc });
  });

  r.delete("/:id", async (req, res) => {
    await MediaAsset.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });

  return r;
}
