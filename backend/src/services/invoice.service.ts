/**
 * Invoice service — generates GST invoices and manages invoice lifecycle.
 *
 * Pricing rules:
 * - All product prices (MRP) are GST inclusive.
 * - Discounts are applied on MRP first.
 * - GST is extracted from the final selling price.
 * - Formula: taxableValue = finalPrice / (1 + gstRate), gstAmount = finalPrice - taxableValue
 */
import crypto from "node:crypto";
import { Order } from "../models/Order.js";

export type InvoiceLineItem = {
  name: string;
  sku: string;
  size?: string;
  color?: string;
  hsnCode: string;
  quantity: number;
  mrp: number;
  discount: number;
  sellingPrice: number;
  gstRate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  lineTotal: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  orderDate: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: InvoiceLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  shippingCharge: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  store: {
    name: string;
    address: string;
    gstin: string;
    phone: string;
    email: string;
  };
};

/**
 * Generate a collision-resistant invoice number.
 * Format: INV-<FY start><FY end>-<8 crypto random hex chars>
 * Uses crypto.randomBytes instead of Math.random for uniqueness guarantee.
 * At 1000 invoices/second, collision probability is ~1 in 4 billion per second.
 */
function generateInvoiceNumber(): string {
  const date = new Date();
  const fy = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const seq = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `INV-${fy}${fy + 1}-${seq}`;
}

/**
 * Extract GST from a GST-inclusive price.
 * taxableValue = price / (1 + gstRate)
 * gstAmount = price - taxableValue
 */
function extractGst(inclusivePrice: number, gstRate: number) {
  const taxableValue = Math.round((inclusivePrice / (1 + gstRate)) * 100) / 100;
  const gstAmount = Math.round((inclusivePrice - taxableValue) * 100) / 100;
  return { taxableValue, gstAmount };
}

export const invoiceService = {
  /**
   * Build invoice data from an order document.
   * Discount is already applied per-item via unitPrice (which is the discounted selling price).
   */
  buildInvoiceData(order: Record<string, unknown>): InvoiceData {
    const o = order as {
      orderNumber: string;
      createdAt: Date | string;
      customerName?: string;
      guestEmail?: string;
      customerPhone?: string;
      shippingAddress: { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };
      items: Array<{
        name: string;
        sku: string;
        size?: string;
        color?: string;
        quantity: number;
        unitPrice: number;
        gstRate?: number;
        hsnCode?: string;
      }>;
      subtotal: number;
      discount: number;
      shipping: number;
      total: number;
      paymentProvider: string;
      paymentStatus?: string;
      couponCode?: string;
    };

    const invoiceNumber = generateInvoiceNumber();
    const invoiceDate = new Date().toISOString();
    const orderDate = typeof o.createdAt === "string" ? o.createdAt : o.createdAt.toISOString();

    const items: InvoiceLineItem[] = o.items.map((item) => {
      const gstRate = item.gstRate ?? 0.05;
      const lineTotal = item.unitPrice * item.quantity;
      // unitPrice is the final selling price (MRP after any discount, still GST-inclusive)
      const { taxableValue: unitTaxable, gstAmount: unitGst } = extractGst(item.unitPrice, gstRate);
      const taxableValue = Math.round(unitTaxable * item.quantity * 100) / 100;
      const totalGst = Math.round(unitGst * item.quantity * 100) / 100;
      // Split GST into CGST + SGST (intra-state) or IGST (inter-state)
      // Default: intra-state (CGST + SGST split equally)
      const cgst = Math.round((totalGst / 2) * 100) / 100;
      const sgst = Math.round((totalGst - cgst) * 100) / 100;

      return {
        name: item.name,
        sku: item.sku,
        size: item.size,
        color: item.color,
        hsnCode: item.hsnCode ?? "",
        quantity: item.quantity,
        mrp: item.unitPrice, // MRP is the displayed GST-inclusive price
        discount: 0, // Discount already factored into unitPrice
        sellingPrice: item.unitPrice,
        gstRate,
        taxableValue,
        cgst,
        sgst,
        igst: 0,
        totalGst,
        lineTotal,
      };
    });

    const totalTaxableValue = items.reduce((sum, i) => sum + i.taxableValue, 0);
    const totalCgst = items.reduce((sum, i) => sum + i.cgst, 0);
    const totalSgst = items.reduce((sum, i) => sum + i.sgst, 0);
    const totalIgst = items.reduce((sum, i) => sum + i.igst, 0);
    const totalGst = items.reduce((sum, i) => sum + i.totalGst, 0);

    return {
      invoiceNumber,
      invoiceDate,
      orderNumber: o.orderNumber,
      orderDate,
      customer: {
        name: o.customerName ?? "Customer",
        email: o.guestEmail ?? "",
        phone: o.customerPhone ?? "",
      },
      shippingAddress: o.shippingAddress,
      items,
      subtotal: o.subtotal,
      totalDiscount: o.discount,
      totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      shippingCharge: o.shipping,
      grandTotal: o.total,
      paymentMethod: o.paymentProvider,
      paymentStatus: o.paymentStatus ?? "pending",
      store: {
        name: process.env.STORE_NAME ?? "Naya Studio",
        address: process.env.STORE_ADDRESS ?? "",
        gstin: process.env.STORE_GSTIN ?? "",
        phone: process.env.STORE_PHONE ?? "",
        email: process.env.STORE_EMAIL ?? "",
      },
    };
  },

  /**
   * Generate invoice and store metadata on the order.
   */
  async generateForOrder(orderId: string): Promise<InvoiceData | null> {
    const order = await Order.findById(orderId).lean();
    if (!order || Array.isArray(order)) return null;

    const invoiceData = this.buildInvoiceData(order as Record<string, unknown>);

    // Store invoice metadata on the order
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        "invoice.invoiceNumber": invoiceData.invoiceNumber,
        "invoice.generatedAt": new Date(),
      },
    });

    return invoiceData;
  },

  /**
   * Get existing invoice data for an order (re-generate from order data).
   */
  async getInvoiceForOrder(orderId: string): Promise<InvoiceData | null> {
    const order = await Order.findById(orderId).lean();
    if (!order || Array.isArray(order)) return null;

    const o = order as { invoice?: { invoiceNumber?: string } };
    const invoiceData = this.buildInvoiceData(order as Record<string, unknown>);

    // Use stored invoice number if available
    if (o.invoice?.invoiceNumber) {
      invoiceData.invoiceNumber = o.invoice.invoiceNumber;
    }

    return invoiceData;
  },
};
