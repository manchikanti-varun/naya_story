import type { RequestHandler } from "express";
import { Router } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import type { LeanOrder, LeanProduct } from "../lean.js";
import { Coupon } from "../models/Coupon.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

function orderNumber() {
  const n = Math.floor(Math.random() * 90000 + 10000);
  return `NS-${Date.now().toString(36).toUpperCase()}-${n}`;
}

async function resolveCoupon(code: string | undefined, subtotal: number) {
  if (!code?.trim())
    return {
      discount: 0,
      couponCode: undefined as string | undefined,
      coupon: null as InstanceType<typeof Coupon> | null,
    };

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    active: true,
  });
  if (!coupon)
    return { discount: 0, couponCode: undefined, coupon: null };
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    return { discount: 0, couponCode: undefined, coupon: null };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
    return { discount: 0, couponCode: undefined, coupon: null };

  let discount = 0;
  if (coupon.type === "percent") discount = Math.round((subtotal * coupon.value) / 100);
  else discount = Math.min(coupon.value, subtotal);

  return { discount, couponCode: coupon.code, coupon };
}

export function createOrdersRouter(secret: string) {
  const r = Router();

  r.post(
    "/",
    body("items").isArray({ min: 1 }),
    body("shippingAddress").isObject(),
    body("items.*.productId").notEmpty(),
    body("items.*.sku").notEmpty(),
    body("items.*.quantity").isInt({ min: 1 }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });

      const { items, shippingAddress, couponCode, guestEmail } = req.body as {
        items: { productId: string; sku: string; quantity: number }[];
        shippingAddress: Record<string, string>;
        couponCode?: string;
        guestEmail?: string;
      };

      let subtotal = 0;
      const resolved = [];

      for (const line of items) {
        const rawProduct = await Product.findById(line.productId).lean();
        if (!rawProduct || Array.isArray(rawProduct))
          return res.status(400).json({ message: "Unknown product" });
        const product = rawProduct as unknown as LeanProduct;
        const variant = product.variants.find(
          (v: { sku: string; stock: number; size: string; color: string }) =>
            v.sku === line.sku,
        );
        if (!variant) return res.status(400).json({ message: "Unknown variant" });
        if (variant.stock < line.quantity)
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

        const unitPrice = product.price;
        subtotal += unitPrice * line.quantity;
        resolved.push({
          productId: product._id,
          name: product.name,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          quantity: line.quantity,
          unitPrice,
          image: product.images[0],
        });
      }

      const shipping = subtotal >= 15000 ? 0 : 299;
      const { discount, couponCode: appliedCoupon, coupon } = await resolveCoupon(
        couponCode,
        subtotal,
      );
      const total = Math.max(0, subtotal + shipping - discount);

      for (let i = 0; i < items.length; i++) {
        const line = items[i];
        const product = await Product.findById(line.productId);
        if (!product) continue;
        const variant = product.variants.find(
          (v: { sku: string; stock: number }) => v.sku === line.sku,
        );
        if (!variant) continue;
        variant.stock -= line.quantity;
        await product.save();
      }

      const authHeader = req.headers.authorization;
      let userId: string | undefined;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const payload = jwt.verify(authHeader.slice(7), secret) as { sub: string };
          userId = payload.sub;
        } catch {
          /* guest checkout */
        }
      }

      const doc = await Order.create({
        orderNumber: orderNumber(),
        user: userId,
        guestEmail,
        items: resolved,
        subtotal,
        shipping,
        discount,
        total,
        couponCode: appliedCoupon,
        shippingAddress,
        timeline: [{ status: "pending", at: new Date() }],
        paymentProvider: "stripe",
        paymentReference: undefined,
        status: "pending",
      });

      if (coupon) {
        coupon.usedCount += 1;
        await coupon.save();
      }

      res.status(201).json({ order: doc });
    },
  );

  r.get("/mine", requireAuth(secret), async (req, res) => {
    const list = await Order.find({ user: req.user!._id }).sort({ createdAt: -1 }).lean();
    res.json({ orders: list });
  });

  r.get("/:id", requireAuth(secret), async (req, res) => {
    const rawOrder = await Order.findById(req.params.id).lean();
    if (!rawOrder || Array.isArray(rawOrder))
      return res.status(404).json({ message: "Not found" });
    const acl = rawOrder as unknown as LeanOrder;
    const uid = String(req.user!._id);
    if (acl.user && String(acl.user) !== uid && req.user!.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    res.json({ order: rawOrder });
  });

  r.get("/", ...(requireAdmin(secret) as RequestHandler[]), async (_req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json({ orders });
  });

  r.patch(
    "/:id/status",
    ...(requireAdmin(secret) as RequestHandler[]),
    body("status").notEmpty(),
    async (req, res) => {
      const { status, trackingNumber } = req.body as {
        status: string;
        trackingNumber?: string;
      };
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: "Not found" });
      order.status = status;
      if (trackingNumber) order.trackingNumber = trackingNumber;
      order.timeline!.push({ status, at: new Date() });
      await order.save();
      res.json({ order });
    },
  );

  return r;
}
