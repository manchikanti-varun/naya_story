/**
 * Atomic inventory operations.
 * Uses MongoDB findOneAndUpdate with conditions to prevent overselling.
 */
import mongoose from "mongoose";
import { Product } from "../models/Product.js";

export type StockReservationItem = {
  productId: string;
  sku: string;
  quantity: number;
};

export type ReservedItem = {
  productId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  image: string;
};

export type ReservationResult =
  | { success: true; items: ReservedItem[]; subtotal: number }
  | { success: false; error: string; productName?: string; sku?: string };

/**
 * Atomically reserve stock for all items in an order.
 * Uses findOneAndUpdate with $gte condition so stock can never go negative.
 *
 * If any item fails, previously decremented items are rolled back.
 */
export async function reserveStock(items: StockReservationItem[]): Promise<ReservationResult> {
  const reserved: ReservedItem[] = [];
  const decremented: { productId: string; sku: string; quantity: number }[] = [];
  let subtotal = 0;

  for (const line of items) {
    if (!mongoose.Types.ObjectId.isValid(line.productId)) {
      await rollbackDecrements(decremented);
      return { success: false, error: "Invalid product ID", sku: line.sku };
    }

    // Atomic decrement: only succeeds if stock >= requested quantity.
    //
    // IMPORTANT: `{ new: false }` returns the PRE-UPDATE document intentionally.
    // We need the original product data (name, price, images) to build the order line items.
    // DO NOT change to `{ new: true }` — that would return post-decrement stock values
    // and break the product info extraction below.
    const updated = await Product.findOneAndUpdate(
      {
        _id: line.productId,
        "variants.sku": line.sku,
        "variants.stock": { $gte: line.quantity },
      },
      {
        $inc: { "variants.$.stock": -line.quantity },
      },
      { new: false },
    ).lean();

    if (!updated) {
      // Determine reason: product not found, variant not found, or insufficient stock
      const product = await Product.findById(line.productId)
        .select("name variants")
        .lean() as { name?: string; variants?: { sku: string; stock: number }[] } | null;

      if (!product) {
        await rollbackDecrements(decremented);
        return { success: false, error: "Product not found", sku: line.sku };
      }

      const variant = product.variants?.find(
        (v: { sku: string }) => v.sku === line.sku,
      );
      if (!variant) {
        await rollbackDecrements(decremented);
        return {
          success: false,
          error: "Variant not found",
          productName: product.name,
          sku: line.sku,
        };
      }

      // Stock is insufficient
      await rollbackDecrements(decremented);
      return {
        success: false,
        error: `Insufficient stock for ${product.name} (${variant.sku}). Available: ${variant.stock}, requested: ${line.quantity}`,
        productName: product.name,
        sku: line.sku,
      };
    }

    // Extract product info from the pre-update document
    const prod = updated as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      price: number;
      images: string[];
      variants: { sku: string; size: string; color: string; stock: number }[];
    };

    const variant = prod.variants.find((v) => v.sku === line.sku)!;
    const unitPrice = prod.price;
    subtotal += unitPrice * line.quantity;

    reserved.push({
      productId: prod._id,
      name: prod.name,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: line.quantity,
      unitPrice,
      image: prod.images[0] ?? "",
    });

    decremented.push({
      productId: line.productId,
      sku: line.sku,
      quantity: line.quantity,
    });
  }

  return { success: true, items: reserved, subtotal };
}

/**
 * Release previously reserved stock (rollback on partial failure or order cancellation).
 */
export async function releaseStock(
  items: { productId: string; sku: string; quantity: number }[],
): Promise<void> {
  await rollbackDecrements(items);
}

/**
 * Internal: atomically increment stock back for each decremented item.
 */
async function rollbackDecrements(
  decremented: { productId: string; sku: string; quantity: number }[],
): Promise<void> {
  for (const item of decremented) {
    await Product.findOneAndUpdate(
      { _id: item.productId, "variants.sku": item.sku },
      { $inc: { "variants.$.stock": item.quantity } },
    );
  }
}
