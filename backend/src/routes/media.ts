import type { RequestHandler } from "express";
import { Router } from "express";
import { body } from "express-validator";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { HttpError } from "../middleware/httpError.js";
import { mediaService } from "../services/media.service.js";
import { mediaUploadMulter, mediaBulkUploadMulter, multerErrorMessage, MAX_BULK_FILES } from "../lib/media-upload-multer.js";
import { handleValidationErrors } from "../validators/index.js";

export function createMediaRouter(secret: string) {
  const r = Router();
  r.use(...(requireAdmin(secret) as RequestHandler[]));

  // GET /upload-config
  r.get("/upload-config", (_req, res) => {
    res.json(mediaService.getUploadConfig());
  });

  // POST /upload — Single file upload
  const runUpload: RequestHandler = (req, res, next) => {
    mediaUploadMulter.single("file")(req, res, (err) => {
      if (err) { res.status(400).json({ message: multerErrorMessage(err) }); return; }
      next();
    });
  };

  r.post("/upload", runUpload, asyncHandler(async (req, res) => {
    if (!req.file?.buffer?.length) throw new HttpError(400, "Missing image file (field name: file)");

    const tagsRaw = req.body?.tags;
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw.map(String)
      : typeof tagsRaw === "string"
        ? tagsRaw.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

    const result = await mediaService.uploadSingle(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname ?? "image",
      {
        category: req.body?.category,
        name: req.body?.name,
        tags,
        saveToLibrary: req.body?.saveToLibrary !== "false" && req.body?.saveToLibrary !== false,
      },
    );
    res.status(201).json(result);
  }));

  // POST /upload-bulk — Bulk file upload
  const runBulkUpload: RequestHandler = (req, res, next) => {
    mediaBulkUploadMulter.array("files", MAX_BULK_FILES)(req, res, (err) => {
      if (err) { res.status(400).json({ message: multerErrorMessage(err) }); return; }
      next();
    });
  };

  r.post("/upload-bulk", runBulkUpload, asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw new HttpError(400, "No image files provided (field name: files)");

    const result = await mediaService.uploadBulk(files, {
      category: req.body?.category,
      saveToLibrary: req.body?.saveToLibrary !== "false" && req.body?.saveToLibrary !== false,
    });
    res.status(result.failCount === result.total ? 502 : 201).json(result);
  }));

  // GET / — List media assets
  r.get("/", asyncHandler(async (req, res) => {
    const items = await mediaService.listAssets(req.query as Record<string, string>);
    res.json({ items });
  }));

  // POST / — Create asset from URL
  r.post(
    "/",
    body("url").isURL({ require_tld: false }),
    body("name").notEmpty(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const item = await mediaService.createAsset(
        req.body.url,
        req.body.name,
        Array.isArray(req.body.tags) ? req.body.tags : [],
        typeof req.body.category === "string" ? req.body.category : "general",
      );
      res.status(201).json({ item });
    }),
  );

  // PATCH /:id — Update asset
  r.patch("/:id", asyncHandler(async (req, res) => {
    const item = await mediaService.updateAsset(req.params.id, req.body);
    res.json({ item });
  }));

  // DELETE /:id — Delete asset
  r.delete("/:id", asyncHandler(async (req, res) => {
    await mediaService.deleteAsset(req.params.id);
    res.json({ ok: true });
  }));

  return r;
}
