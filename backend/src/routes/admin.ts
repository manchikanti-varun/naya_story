import type { RequestHandler } from "express";
import { Router } from "express";
import { param } from "express-validator";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/httpError.js";
import { analyticsService } from "../services/analytics.service.js";
import { userRepository } from "../repositories/user.repository.js";
import { handleValidationErrors } from "../validators/index.js";

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

  // DELETE /customers/:id — Delete a customer account
  r.delete(
    "/customers/:id",
    param("id").notEmpty(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const user = await userRepository.findById(req.params.id);
      if (!user) throw new HttpError(404, "Customer not found");
      if (user.role === "admin") throw new HttpError(403, "Cannot delete admin accounts from here");
      await userRepository.deleteById(req.params.id);
      res.json({ ok: true, message: `Customer ${user.email} deleted.` });
    }),
  );

  return r;
}
