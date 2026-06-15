/**
 * Invoice routes — download invoice data for orders.
 */
import type { RequestHandler } from "express";
import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { invoiceService } from "../services/invoice.service.js";
import { Order } from "../models/Order.js";
import { HttpError } from "../middleware/httpError.js";

export function createInvoicesRouter(secret: string) {
  const r = Router();

  // GET /orders/:orderId/invoice — Get invoice data (customer or admin)
  r.get(
    "/orders/:orderId/invoice",
    requireAuth(secret),
    asyncHandler(async (req, res) => {
      const { orderId } = req.params;
      const userId = String(req.user!._id);
      const role = req.user!.role;

      // ACL check
      const order = await Order.findById(orderId).lean();
      if (!order || Array.isArray(order)) throw new HttpError(404, "Order not found");

      const o = order as { user?: unknown; paymentStatus?: string };
      if (role !== "admin" && String(o.user ?? "") !== userId) {
        throw new HttpError(403, "Forbidden");
      }

      const invoiceData = await invoiceService.getInvoiceForOrder(orderId);
      if (!invoiceData) throw new HttpError(404, "Invoice not found");

      res.json({ invoice: invoiceData });
    }),
  );

  // POST /orders/:orderId/invoice/generate — Admin: force generate invoice
  r.post(
    "/orders/:orderId/invoice/generate",
    ...(requireAdmin(secret) as RequestHandler[]),
    asyncHandler(async (req, res) => {
      const { orderId } = req.params;
      const invoiceData = await invoiceService.generateForOrder(orderId);
      if (!invoiceData) throw new HttpError(404, "Order not found");
      res.json({ invoice: invoiceData });
    }),
  );

  return r;
}
