import type { RequestHandler } from "express";
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { reviewService } from "../services/review.service.js";
import { createReviewRules, moderateReviewRules } from "../validators/review.validator.js";
import { handleValidationErrors } from "../validators/index.js";

export function createReviewsRouter(secret: string) {
  const r = Router();

  // POST /api/reviews/:productId — Submit a review (authenticated users)
  r.post(
    "/:productId",
    requireAuth(secret) as RequestHandler,
    ...createReviewRules,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const review = await reviewService.createReview({
        productId: req.params.productId,
        userId: String(req.user!._id),
        rating: req.body.rating,
        body: req.body.body,
      });
      res.status(201).json({ review });
    }),
  );

  // GET /api/reviews/:productId — Get approved reviews for a product (public)
  r.get(
    "/:productId",
    asyncHandler(async (req, res) => {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const result = await reviewService.getProductReviews(req.params.productId, page, limit);
      res.json(result);
    }),
  );

  // GET /api/reviews/:productId/rating — Get aggregate rating (public)
  r.get(
    "/:productId/rating",
    asyncHandler(async (req, res) => {
      const rating = await reviewService.getProductRating(req.params.productId);
      res.json(rating);
    }),
  );

  // GET /api/reviews/admin/all — List all reviews for moderation (admin)
  r.get(
    "/admin/all",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (req, res) => {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const status = req.query.status as string | undefined;
      const result = await reviewService.listAllReviews(status, page);
      res.json(result);
    }),
  );

  // PATCH /api/reviews/admin/:id — Approve or reject a review (admin)
  r.patch(
    "/admin/:id",
    ...(requireAdmin(secret) as RequestHandler[]),
    ...moderateReviewRules,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const review = await reviewService.moderateReview(req.params.id, req.body.status);
      res.json({ review });
    }),
  );

  // DELETE /api/reviews/admin/:id — Delete a review (admin)
  r.delete(
    "/admin/:id",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (req, res) => {
      await reviewService.deleteReview(req.params.id);
      res.json({ ok: true });
    }),
  );

  return r;
}
