import type { RequestHandler } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { verifyAccessToken } from "../lib/accessJwt.js";
import { orderService } from "../services/order.service.js";
import { createOrderRules, updateStatusRules } from "../validators/order.validator.js";
import { handleValidationErrors } from "../validators/index.js";
import type { OrderStatus } from "../lib/order-status.js";

export function createOrdersRouter(secret: string) {
  const r = Router();

  const orderCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many orders. Please try again later." },
  });

  // POST / — Create order
  r.post(
    "/",
    orderCreateLimiter,
    ...createOrderRules,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const { items, shippingAddress, couponCode, guestEmail, idempotencyKey, paymentProvider, stripePaymentIntentId, razorpayPaymentId } = req.body;

      // Extract optional user ID from auth header
      let userId: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const payload = verifyAccessToken(authHeader.slice(7), secret);
          userId = payload.sub;
        } catch { /* guest checkout */ }
      }

      const result = await orderService.createOrder({
        items, shippingAddress, couponCode, guestEmail,
        idempotencyKey, paymentProvider, stripePaymentIntentId, razorpayPaymentId, userId,
      });

      res.status(201).json({ order: result.order, ...(result.duplicate ? { duplicate: true } : {}) });
    }),
  );

  // GET /mine — User's orders
  r.get("/mine", requireAuth(secret), asyncHandler(async (req, res) => {
    const orders = await orderService.getOrdersByUser(String(req.user!._id));
    res.json({ orders });
  }));

  // GET /:id — Single order (user or admin)
  r.get("/:id", requireAuth(secret), asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(
      req.params.id,
      String(req.user!._id),
      req.user!.role,
    );
    res.json({ order });
  }));

  // GET / — All orders (admin) with pagination and filters
  r.get("/", ...(requireAdmin(secret) as RequestHandler[]), asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 200);
    const status = req.query.status as string | undefined;
    const paymentStatus = req.query.paymentStatus as string | undefined;
    const q = req.query.q as string | undefined;
    const orders = await orderService.getAllOrdersPaginated({ page, limit, status, paymentStatus, q });
    res.json(orders);
  }));

  // PATCH /:id/status — Admin status transition
  r.patch(
    "/:id/status",
    ...(requireAdmin(secret) as RequestHandler[]),
    ...updateStatusRules,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const { status, trackingNumber, shippingCarrier } = req.body as { status: OrderStatus; trackingNumber?: string; shippingCarrier?: string };
      const order = await orderService.transitionStatus(req.params.id, status, trackingNumber, shippingCarrier);
      res.json({ order });
    }),
  );

  // POST /:id/return — Customer requests a return
  r.post(
    "/:id/return",
    requireAuth(secret),
    asyncHandler(async (req, res) => {
      const { reason } = req.body as { reason?: string };
      if (!reason?.trim()) {
        return res.status(400).json({ message: "Return reason is required." });
      }
      const order = await orderService.requestReturn(
        req.params.id,
        String(req.user!._id),
        reason.trim(),
      );
      res.json({ order });
    }),
  );

  // POST /admin/release-stale — Admin: release stock from stale unpaid orders
  r.post(
    "/admin/release-stale",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (req, res) => {
      const timeoutMinutes = Number(req.body?.timeoutMinutes) || 30;
      const result = await orderService.releaseStaleOrders(timeoutMinutes);
      res.json({ ...result, message: `Released ${result.released} stale orders.` });
    }),
  );

  return r;
}
