/**
 * Event handlers for product lifecycle events.
 * Registered at app startup — runs async side-effects outside the request cycle.
 */
import { eventBus } from "../lib/event-bus.js";
import { productService } from "../services/product.service.js";
import type { ProductCreatedEvent, ProductUpdatedEvent } from "../lib/event-bus.js";

export function registerProductEventHandlers(): void {
  eventBus.on<ProductCreatedEvent>("product.created", async (payload) => {
    if (payload.category) {
      await productService.ensureCategoryExists(payload.category);
    }
    await productService.syncHomepagePins(payload.productId, {
      newIn: payload.newIn || undefined,
      bestseller: payload.bestseller || undefined,
    });
  });

  eventBus.on<ProductUpdatedEvent>("product.updated", async (payload) => {
    if (payload.category) {
      await productService.ensureCategoryExists(payload.category);
    }
    if (payload.newIn !== undefined || payload.bestseller !== undefined) {
      await productService.syncHomepagePins(payload.productId, {
        newIn: payload.newIn,
        bestseller: payload.bestseller,
      });
    }
  });
}
