import type { RequestHandler } from "express";
import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { analyticsService } from "../services/analytics.service.js";

export function createAdminRouter(secret: string) {
  const r = Router();

  r.use(...(requireAdmin(secret) as RequestHandler[]));

  // GET /overview — Dashboard data
  r.get("/overview", asyncHandler(async (_req, res) => {
    const data = await analyticsService.getDashboardOverview();
    res.json(data);
  }));

  // GET /customers — Customer report
  r.get("/customers", asyncHandler(async (_req, res) => {
    const data = await analyticsService.getCustomersReport();
    res.json(data);
  }));

  // GET /products/slug/:slug — Admin product preview (includes hidden)
  r.get("/products/slug/:slug", asyncHandler(async (req, res) => {
    const data = await analyticsService.getAdminProductPreview(req.params.slug);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  }));

  return r;
}
