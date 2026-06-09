/**
 * Review service — handles review CRUD and moderation.
 */
import { reviewRepository } from "../repositories/review.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { HttpError } from "../middleware/httpError.js";

export const reviewService = {
  async createReview(data: { productId: string; userId: string; rating: number; body: string }) {
    // Verify product exists
    const product = await productRepository.findByIdLean(data.productId);
    if (!product) throw new HttpError(404, "Product not found");

    // Check if user already reviewed this product
    const existing = await reviewRepository.findByUserAndProduct(data.userId, data.productId);
    if (existing) throw new HttpError(409, "You have already reviewed this product");

    const review = await reviewRepository.create({
      product: data.productId,
      user: data.userId,
      rating: data.rating,
      body: data.body,
    });

    return review.toObject();
  },

  async getProductReviews(productId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const { reviews, total } = await reviewRepository.findByProduct(productId, "approved", skip, limit);
    const { average, count } = await reviewRepository.getAggregateRating(productId);

    return {
      reviews,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      averageRating: average,
      totalCount: count,
    };
  },

  async getProductRating(productId: string) {
    return reviewRepository.getAggregateRating(productId);
  },

  /** Admin: list all reviews with optional status filter */
  async listAllReviews(status?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const { reviews, total } = await reviewRepository.findAllPaginated(status, skip, limit);
    return {
      reviews,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
  },

  /** Admin: approve or reject a review */
  async moderateReview(reviewId: string, status: "approved" | "rejected") {
    const review = await reviewRepository.updateStatus(reviewId, status);
    if (!review) throw new HttpError(404, "Review not found");
    return review;
  },

  /** Admin: delete a review */
  async deleteReview(reviewId: string) {
    await reviewRepository.deleteById(reviewId);
  },
};
