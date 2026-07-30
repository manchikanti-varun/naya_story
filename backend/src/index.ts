/**
 * Application entry point — bootstraps the server with graceful shutdown.
 *
 * Architecture:
 *   index.ts (entry)  →  server.ts (app factory)  →  routes/  →  services/  →  repositories/
 *   config/env.ts provides typed configuration injected into the app.
 *   events/ registers async side-effect handlers via the event bus.
 */
import "dotenv/config";
import "./lib/cloudinary-env.js";
import type { Server } from "node:http";
import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { loadConfig } from "./config/env.js";
import { assertSafeProductionConfig } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { initCache } from "./lib/cache.js";
import { createApp } from "./server.js";
import { registerProductEventHandlers } from "./events/product-events.js";

async function main() {
  assertSafeProductionConfig();

  const config = loadConfig();
  await connectDb(config.db.mongodbUri);

  // Initialize cache layer (Upstash Redis if configured, otherwise in-memory)
  await initCache();

  // Register async event handlers
  registerProductEventHandlers();

  // Schedule stale order cleanup every 15 minutes
  const STALE_ORDER_INTERVAL_MS = 15 * 60 * 1000;
  const staleOrderTimer = setInterval(async () => {
    try {
      const { orderService } = await import("./services/order.service.js");
      const result = await orderService.releaseStaleOrders(30);
      if (result.released > 0) {
        logger.info("stale_orders_released", { released: result.released, checked: result.checked });
      }
    } catch (err) {
      logger.error("stale_order_cleanup_failed", { error: String(err) });
    }
  }, STALE_ORDER_INTERVAL_MS);
  staleOrderTimer.unref();

  const app = createApp(config);

  const server: Server = app.listen(config.app.port, () => {
    logger.info("server_started", { port: config.app.port, env: config.app.nodeEnv });
  });

  server.on("error", (err) => {
    console.error("[SERVER ERROR]", err);
    logger.error("server_listen_error", { error: String(err), port: config.app.port });
    process.exit(1);
  });

  // --- Graceful shutdown ---
  setupGracefulShutdown(server);
}

function setupGracefulShutdown(server: Server) {
  const SHUTDOWN_TIMEOUT_MS = 10_000;
  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("shutdown_initiated", { signal });

    // Stop accepting new connections
    server.close(() => {
      logger.info("http_server_closed");
    });

    // Wait for in-flight requests to complete (up to timeout)
    const forceExit = setTimeout(() => {
      logger.error("shutdown_timeout", { timeoutMs: SHUTDOWN_TIMEOUT_MS });
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    try {
      await mongoose.connection.close();
      logger.info("db_connection_closed");
    } catch (err) {
      logger.error("db_close_error", { error: String(err) });
    }

    clearTimeout(forceExit);
    process.exit(0);
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  // Handle uncaught errors gracefully
  process.on("unhandledRejection", (reason) => {
    logger.error("unhandled_rejection", { error: String(reason) });
  });

  process.on("uncaughtException", (err) => {
    logger.error("uncaught_exception", { error: err.message, stack: err.stack });
    void shutdown("uncaughtException");
  });
}

main().catch((err) => {
  logger.error("startup_failed", { error: String(err), stack: err?.stack });
  console.error("[STARTUP FATAL]", err);
  process.exit(1);
});
