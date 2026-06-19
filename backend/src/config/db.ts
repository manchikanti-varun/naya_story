import mongoose from "mongoose";
import { logger } from "../lib/logger.js";

export interface DbConnectOptions {
  /** Max connections in the pool. Default: 50 for production workloads. */
  maxPoolSize?: number;
  /** Min connections kept warm. Default: 5. */
  minPoolSize?: number;
}

export async function connectDb(uri: string, options: DbConnectOptions = {}) {
  mongoose.set("strictQuery", true);

  const maxPoolSize = options.maxPoolSize ?? (process.env.NODE_ENV === "production" ? 50 : 10);
  const minPoolSize = options.minPoolSize ?? (process.env.NODE_ENV === "production" ? 5 : 2);

  mongoose.connection.on("error", (err) => {
    logger.error("db_connection_error", { error: err.message });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("db_disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("db_reconnected");
  });

  await mongoose.connect(uri, {
    maxPoolSize,
    minPoolSize,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    // Enable connection pool monitoring in production
    maxIdleTimeMS: 30000,
  });

  logger.info("db_connected", { maxPoolSize, minPoolSize });

  // Log pool statistics periodically in production (every 5 minutes)
  if (process.env.NODE_ENV === "production") {
    setInterval(() => {
      const pool = mongoose.connection.getClient().options;
      const db = mongoose.connection.db;
      if (db) {
        logger.debug("db_pool_stats", {
          readyState: mongoose.connection.readyState,
          maxPoolSize,
        });
      }
    }, 5 * 60 * 1000).unref();
  }
}
