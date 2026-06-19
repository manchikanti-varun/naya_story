import crypto from "node:crypto";
import { Router } from "express";
import { body, validationResult } from "express-validator";
import { razorpay } from "../lib/razorpay.js";
import { Order } from "../models/Order.js";
import { reserveStock, releaseStock } from "../lib/inventory.js";
import { resolveCoupon } from "../lib/coupon-utils.js";
import { couponRepository } from "../repositories/coupon.repository.js";
import { verifyAccessToken } from "../lib/accessJwt.js";
import { logger } from "../lib/logger.js";
import { emailService } from "../services/email.service.js";
import { asyncHandler } from "../middleware/httpError.js";

/**
 * Generate a collision-resistant order number.
 * Format: NS-<timestamp_base36>-<6 crypto random hex chars>
 */
function generateOrderNumber(): string {
  const timePart = Date.now().toString(36).toUpperCase();
  const randPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `NS-${timePart}-${randPart}`;
}

export function createPaymentRouter(jwtSecret: string) {
  const r = Router();

  /**
   * POST /create-order
   * Creates a Razorpay order after validating the cart, reserving stock,
   * and creating a pending order in MongoDB.
   *
   * Body: { items, shippingAddress, couponCode?, guestEmail?, customerName?, customerPhone? }
   */
  r.post(
    "/create-order",
    body("items").isArray({ min: 1, max: 50 }),
    body("items.*.productId").notEmpty(),
    body("items.*.sku").notEmpty(),
    body("items.*.quantity").isInt({ min: 1, max: 50 }),
    body("shippingAddress").isObject(),
    body("shippingAddress.fullName").trim().notEmpty().isLength({ max: 200 }),
    body("shippingAddress.phone").trim().notEmpty().matches(/^[6-9]\d{9}$/),
    body("shippingAddress.email").trim().isEmail(),
    body("shippingAddress.addressLine1").trim().notEmpty().isLength({ max: 300 }),
    body("shippingAddress.city").trim().notEmpty().isLength({ max: 100 }),
    body("shippingAddress.state").trim().notEmpty().isLength({ max: 100 }),
    body("shippingAddress.pincode").trim().notEmpty().matches(/^[1-9][0-9]{5}$/),
    body("couponCode").optional().trim().isLength({ max: 50 }),
    body("guestEmail").optional().isEmail().normalizeEmail(),
    body("customerName").optional().trim().isLength({ max: 200 }),
    body("customerPhone").optional().trim().isLength({ max: 15 }),
    asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      }

      if (!razorpay) {
        return res.status(503).json({ message: "Payment gateway not configured." });
      }

      const { items, shippingAddress, couponCode, guestEmail, customerName, customerPhone } = req.body;

      // Extract optional user ID from auth header
      let userId: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const payload = verifyAccessToken(authHeader.slice(7), jwtSecret);
          userId = payload.sub;
        } catch { /* guest checkout */ }
      }

      // Reserve stock atomically
      const reservation = await reserveStock(items);
      if (!reservation.success) {
        return res.status(409).json({ message: reservation.error });
      }

      const { items: reservedItems, subtotal } = reservation;

      // Shipping calculation
      const shipping = subtotal >= 15000 ? 0 : 299;

      // Coupon resolution
      const { discount, couponCode: appliedCoupon, coupon } = await resolveCoupon(couponCode, subtotal);
      const total = Math.max(0, subtotal + shipping - discount);
      const totalInPaise = Math.round(total * 100);

      // Create Razorpay order
      const receipt = `ns_${Date.now()}`;
      let razorpayOrder;
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: totalInPaise,
          currency: "INR",
          receipt,
          notes: {
            customerId: userId ?? "guest",
            customerEmail: shippingAddress.email || guestEmail || "",
          },
        });
      } catch (err) {
        // Release reserved stock on payment gateway failure
        await releaseStock(items.map((i: { productId: string; sku: string; quantity: number }) => ({
          productId: i.productId, sku: i.sku, quantity: i.quantity,
        })));
        logger.error("razorpay_create_order_failed", { error: String(err) });
        return res.status(502).json({ message: "Payment gateway error. Please try again." });
      }

      // Create pending order in MongoDB
      const orderNumber = generateOrderNumber();
      const orderDoc = await Order.create({
        orderNumber,
        user: userId,
        guestEmail: guestEmail || shippingAddress.email,
        customerName: customerName || shippingAddress.fullName,
        customerPhone: customerPhone || shippingAddress.phone,
        items: reservedItems,
        subtotal,
        shipping,
        discount,
        total,
        couponCode: appliedCoupon,
        shippingAddress: {
          line1: shippingAddress.addressLine1,
          line2: shippingAddress.addressLine2 || "",
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.pincode,
          country: "India",
        },
        timeline: [{ status: "pending", at: new Date() }],
        paymentProvider: "razorpay",
        paymentStatus: "pending",
        status: "pending",
        razorpayPaymentId: razorpayOrder.id, // Store Razorpay order ID for correlation
      });

      // Increment coupon usage
      if (coupon) {
        await couponRepository.incrementUsage(coupon._id);
      }

      logger.info("payment_order_created", {
        orderId: String(orderDoc._id),
        orderNumber,
        razorpayOrderId: razorpayOrder.id,
        amount: totalInPaise,
      });

      return res.status(201).json({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        orderNumber,
        internalOrderId: String(orderDoc._id),
      });
    }),
  );

  /**
   * POST /verify
   * Verifies Razorpay payment signature after checkout completion.
   *
   * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   */
  r.post(
    "/verify",
    body("razorpay_order_id").trim().notEmpty(),
    body("razorpay_payment_id").trim().notEmpty(),
    body("razorpay_signature").trim().notEmpty(),
    asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const secret = process.env.RAZORPAY_KEY_SECRET;

      if (!secret) {
        return res.status(503).json({ message: "Payment gateway not configured." });
      }

      // Verify HMAC-SHA256 signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      // Timing-safe comparison
      const isValid =
        expectedSignature.length === razorpay_signature.length &&
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature, "utf8"),
          Buffer.from(razorpay_signature, "utf8"),
        );

      if (!isValid) {
        logger.warn("payment_verify_signature_invalid", {
          razorpay_order_id,
          razorpay_payment_id,
        });
        return res.status(400).json({ error: "Payment verification failed" });
      }

      // Find the order by Razorpay order ID (stored in razorpayPaymentId field during creation)
      const order = await Order.findOne({ razorpayPaymentId: razorpay_order_id });
      if (!order) {
        logger.warn("payment_verify_order_not_found", { razorpay_order_id });
        return res.status(404).json({ error: "Order not found" });
      }

      // Update order to confirmed
      if (order.status === "pending") {
        order.status = "confirmed";
        order.paymentStatus = "paid";
        order.paymentReference = razorpay_payment_id;
        order.razorpayPaymentId = razorpay_payment_id; // Now store actual payment ID
        order.timeline!.push({ status: "confirmed", at: new Date() });
        await order.save();
      }

      logger.info("payment_verified", {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        razorpay_payment_id,
      });

      // Send order confirmation email (async — don't block response)
      const customerEmail = order.guestEmail || "";
      const customerName = order.customerName || "Customer";
      if (customerEmail) {
        const orderItems = (order.items ?? []).map((item: { name: string; quantity: number; unitPrice: number }) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));
        void emailService.sendOrderConfirmation(
          customerEmail,
          customerName,
          order.orderNumber,
          order.total,
          orderItems,
        ).catch((err) => logger.error("order_confirmation_email_failed", { error: String(err) }));
      }

      return res.json({
        success: true,
        orderNumber: order.orderNumber,
        orderId: String(order._id),
      });
    }),
  );

  return r;
}
