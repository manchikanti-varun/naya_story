/**
 * Rate limit store backed by Upstash Redis.
 *
 * When UPSTASH_REDIS_REST_URL is configured, rate limiting state is shared across
 * all server instances. This prevents bypass by hitting different pods/processes.
 *
 * Without Redis, falls back to the default in-memory store (fine for single-instance).
 *
 * Usage in express-rate-limit:
 *   import { createRateLimitStore } from "../lib/rate-limit-store.js";
 *   rateLimit({ ..., store: await createRateLimitStore("global") });
 */
import type { Store, IncrementResponse } from "express-rate-limit";
import { logger } from "./logger.js";

/**
 * Creates an Upstash-compatible rate limit store.
 * Returns undefined if Redis is not configured (use default memory store).
 */
export async function createRateLimitStore(prefix = "rl"): Promise<Store | undefined> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) return undefined;

  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    await redis.ping();

    logger.info("rate_limit_store_connected", { provider: "upstash", prefix });

    return {
      async increment(key: string): Promise<IncrementResponse> {
        const redisKey = `${prefix}:${key}`;
        try {
          const totalHits = await redis.incr(redisKey);
          // Set TTL on first hit (60s window by default; express-rate-limit manages windows)
          if (totalHits === 1) {
            await redis.expire(redisKey, 120); // 2 min TTL as safety net
          }
          return { totalHits, resetTime: undefined };
        } catch {
          // Fallback: allow request through on Redis failure
          return { totalHits: 0, resetTime: undefined };
        }
      },

      async decrement(key: string): Promise<void> {
        try {
          await redis.decr(`${prefix}:${key}`);
        } catch {
          // Non-critical
        }
      },

      async resetKey(key: string): Promise<void> {
        try {
          await redis.del(`${prefix}:${key}`);
        } catch {
          // Non-critical
        }
      },

      async resetAll(): Promise<void> {
        try {
          const keys = await redis.keys(`${prefix}:*`);
          if (keys.length > 0) await redis.del(...keys);
        } catch {
          // Non-critical
        }
      },
    } satisfies Store;
  } catch (err) {
    logger.warn("rate_limit_store_fallback_memory", { error: String(err) });
    return undefined;
  }
}
