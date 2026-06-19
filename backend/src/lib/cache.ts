/**
 * Caching layer with Upstash Redis support.
 *
 * Provides a simple get/set/invalidate interface backed by:
 *   - Upstash Redis (production) — set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   - In-memory Map (development/fallback) — zero-config, no external dependencies
 *
 * Usage:
 *   import { cache } from "../lib/cache.js";
 *
 *   // Cache a value with TTL
 *   await cache.set("settings:site", data, 300); // 5 min
 *
 *   // Read from cache
 *   const cached = await cache.get<SiteDoc>("settings:site");
 *   if (cached) return cached; // cache hit
 *
 *   // Invalidate on write
 *   await cache.del("settings:site");
 *
 * Upstash Setup:
 *   1. Create a free Redis database at https://console.upstash.com
 *   2. Copy REST URL and token into .env:
 *      UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
 *      UPSTASH_REDIS_REST_TOKEN=your-token
 *   3. That's it — the cache layer auto-detects and connects.
 */
import { logger } from "./logger.js";

export interface CacheStore {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Delete all keys matching a prefix pattern. */
  delPrefix(prefix: string): Promise<void>;
}

// --- In-Memory Implementation (dev/fallback) ---

type MemEntry = { value: unknown; expiresAt: number };

class MemoryCache implements CacheStore {
  private store = new Map<string, MemEntry>();

  constructor() {
    // Periodic cleanup every 60s
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (entry.expiresAt <= now) this.store.delete(key);
      }
    }, 60_000).unref();
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

// --- Upstash Redis Implementation ---

class UpstashCache implements CacheStore {
  private redis: import("@upstash/redis").Redis;

  constructor(redis: import("@upstash/redis").Redis) {
    this.redis = redis;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get<T>(key);
      return raw ?? null;
    } catch (err) {
      logger.warn("cache_get_error", { key, error: String(err) });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
    } catch (err) {
      logger.warn("cache_set_error", { key, error: String(err) });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      logger.warn("cache_del_error", { key, error: String(err) });
    }
  }

  async delPrefix(prefix: string): Promise<void> {
    try {
      // Upstash supports SCAN but for simplicity use pattern delete
      // In production with many keys, use a tag-based invalidation strategy
      const keys = await this.redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      logger.warn("cache_del_prefix_error", { prefix, error: String(err) });
    }
  }
}

// --- Factory ---

async function createCacheStore(): Promise<CacheStore> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (url && token) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({ url, token });
      // Quick connectivity test
      await redis.ping();
      logger.info("cache_connected", { provider: "upstash" });
      return new UpstashCache(redis);
    } catch (err) {
      logger.warn("cache_upstash_failed_fallback_memory", { error: String(err) });
    }
  }

  logger.info("cache_connected", { provider: "memory" });
  return new MemoryCache();
}

// --- Singleton with lazy initialization ---

let _cache: CacheStore | null = null;
let _initPromise: Promise<CacheStore> | null = null;

export async function getCache(): Promise<CacheStore> {
  if (_cache) return _cache;
  if (!_initPromise) {
    _initPromise = createCacheStore().then((store) => {
      _cache = store;
      return store;
    });
  }
  return _initPromise;
}

/**
 * Synchronous cache access — returns the memory fallback if Redis hasn't connected yet.
 * Safe to use in hot paths where you don't want to await initialization.
 */
export const cache: CacheStore = new MemoryCache();

/** Initialize the real cache (call at startup). Replaces the default memory cache. */
export async function initCache(): Promise<void> {
  const store = await getCache();
  // Replace the exported singleton methods
  (cache as { get: CacheStore["get"] }).get = store.get.bind(store);
  (cache as { set: CacheStore["set"] }).set = store.set.bind(store);
  (cache as { del: CacheStore["del"] }).del = store.del.bind(store);
  (cache as { delPrefix: CacheStore["delPrefix"] }).delPrefix = store.delPrefix.bind(store);
}

// --- Common cache key helpers ---

export const CacheKeys = {
  siteSettings: "settings:site",
  siteSettingsAdmin: "settings:site:admin",
  productBySlug: (slug: string) => `product:slug:${slug}`,
  productList: (hash: string) => `products:list:${hash}`,
  PREFIX_PRODUCTS: "product",
  PREFIX_SETTINGS: "settings",
} as const;
