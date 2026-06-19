import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { customerService } from "../services/customer.service.js";
import { handleValidationErrors } from "../validators/index.js";

export function createUsersRouter(secret: string) {
  const r = Router();

  // GET /wishlist
  r.get("/wishlist", requireAuth(secret), asyncHandler(async (req, res) => {
    const products = await customerService.getWishlist(String(req.user!._id));
    res.json({ products });
  }));

  // PATCH /wishlist — toggle item
  r.patch(
    "/wishlist",
    requireAuth(secret),
    body("productId").notEmpty(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const wishlist = await customerService.toggleWishlistItem(
        String(req.user!._id),
        req.body.productId,
      );
      res.json({ wishlist });
    }),
  );

  // PUT /addresses — replace all addresses
  r.put(
    "/addresses",
    requireAuth(secret),
    body("addresses").isArray({ max: 10 }),
    body("addresses.*.line1").trim().notEmpty().isLength({ max: 200 }),
    body("addresses.*.line2").optional({ values: "falsy" }).trim().isLength({ max: 200 }),
    body("addresses.*.city").trim().notEmpty().isLength({ max: 100 }),
    body("addresses.*.state").trim().notEmpty().isLength({ max: 100 }),
    body("addresses.*.postalCode").trim().notEmpty().isLength({ max: 20 }),
    body("addresses.*.country").trim().notEmpty().isLength({ max: 100 }),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const addresses = await customerService.updateAddresses(
        String(req.user!._id),
        req.body.addresses,
      );
      res.json({ addresses });
    }),
  );

  // --- Cart Sync (cross-device cart for authenticated users) ---

  // GET /cart — Load server-side cart
  r.get("/cart", requireAuth(secret), asyncHandler(async (req, res) => {
    const cart = await customerService.getCart(String(req.user!._id));
    res.json({ cart });
  }));

  // PUT /cart — Save/replace cart (full sync from client)
  r.put(
    "/cart",
    requireAuth(secret),
    body("lines").isArray({ max: 50 }),
    body("lines.*.productId").notEmpty(),
    body("lines.*.sku").notEmpty(),
    body("lines.*.quantity").isInt({ min: 1, max: 50 }),
    body("lines.*.name").trim().notEmpty(),
    body("lines.*.slug").trim().notEmpty(),
    body("lines.*.price").isNumeric(),
    body("lines.*.size").optional().isString(),
    body("lines.*.color").optional().isString(),
    body("lines.*.image").optional().isString(),
    body("coupon").optional({ values: "falsy" }).trim().isLength({ max: 50 }),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const { lines, coupon } = req.body;
      const cart = await customerService.saveCart(String(req.user!._id), lines, coupon);
      res.json({ cart });
    }),
  );

  return r;
}
