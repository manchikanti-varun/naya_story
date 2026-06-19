/**
 * Lightweight in-process event bus for decoupling async side-effects.
 *
 * Use this to fire-and-forget operations that should NOT block the request cycle:
 *   - Sending emails after order confirmation
 *   - Syncing categories after product creation
 *   - Analytics tracking
 *   - Cache invalidation
 *
 * Events are processed asynchronously — failures are logged but never propagate
 * to the caller. For distributed systems, replace with Redis Pub/Sub or BullMQ.
 *
 * Usage:
 *   // Register handler (at startup):
 *   eventBus.on("order.confirmed", async (payload) => { ... });
 *
 *   // Emit (in service layer):
 *   eventBus.emit("order.confirmed", { orderId, email });
 */
import { logger } from "./logger.js";

export type EventHandler<T = unknown> = (payload: T) => Promise<void> | void;

type EventMap = Record<string, EventHandler[]>;

class EventBus {
  private handlers: EventMap = {};

  /**
   * Register an async handler for an event type.
   * Multiple handlers per event are supported (all run concurrently).
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler as EventHandler);
  }

  /**
   * Remove a specific handler for an event type.
   */
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const list = this.handlers[event];
    if (!list) return;
    this.handlers[event] = list.filter((h) => h !== handler);
  }

  /**
   * Emit an event. All registered handlers run asynchronously.
   * Errors are caught and logged — they never propagate to the emitter.
   */
  emit<T = unknown>(event: string, payload: T): void {
    const list = this.handlers[event];
    if (!list || list.length === 0) return;

    for (const handler of list) {
      // Fire-and-forget: don't await, don't throw
      Promise.resolve()
        .then(() => handler(payload))
        .catch((err) => {
          logger.error("event_bus_handler_error", {
            event,
            error: err instanceof Error ? err.message : String(err),
          });
        });
    }
  }

  /**
   * Remove all handlers (useful in tests).
   */
  clear(): void {
    this.handlers = {};
  }
}

/** Singleton event bus for the application. */
export const eventBus = new EventBus();

// --- Well-known event types (add as needed) ---

export type OrderConfirmedEvent = {
  orderId: string;
  orderNumber: string;
  email?: string;
  total: number;
};

export type ProductCreatedEvent = {
  productId: string;
  category?: string;
  newIn?: boolean;
  bestseller?: boolean;
};

export type ProductUpdatedEvent = {
  productId: string;
  category?: string;
  newIn?: boolean;
  bestseller?: boolean;
};
