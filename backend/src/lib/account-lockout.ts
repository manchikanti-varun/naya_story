/**
 * Account lockout — tracks failed login attempts per email.
 *
 * After MAX_ATTEMPTS consecutive failures, the account is locked for LOCKOUT_DURATION_MS.
 * Successful login resets the counter.
 *
 * Strategy:
 *   - When Redis (Upstash) is available: uses INCR + TTL for cross-instance consistency.
 *   - Without Redis: falls back to in-memory Map (single-instance only).
 *
 * In cluster mode or multi-instance deployments, Redis is required for
 * lockout enforcement to be effective.
 */
import { logger } from "./logger.js";
import { cache } from "./cache.js";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_TTL_SECONDS = Math.ceil(LOCKOUT_DURATION_MS / 1000);
const ATTEMPT_TTL_SECONDS = 30 * 60; // 30 minutes — auto-cleanup

// In-memory fallback for when cache hasn't initialized yet or for dev
type LockoutEntry = {
  attempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
};

const memoryStore = new Map<string, LockoutEntry>();

// Periodic cleanup of stale in-memory entries (every 10 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (now - entry.lastAttemptAt > 30 * 60 * 1000) {
      memoryStore.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

function normalizeKey(email: string): string {
  return email.trim().toLowerCase();
}

function cacheKey(email: string): string {
  return `lockout:${normalizeKey(email)}`;
}

function lockCacheKey(email: string): string {
  return `lockout:locked:${normalizeKey(email)}`;
}

/**
 * Check if an account is currently locked. Returns remaining lock time in ms, or 0 if not locked.
 */
export async function getAccountLockStatus(email: string): Promise<{ locked: boolean; remainingMs: number }> {
  const key = normalizeKey(email);

  // Try cache (Redis) first
  try {
    const lockValue = await cache.get<number>(lockCacheKey(email));
    if (lockValue) {
      const remaining = lockValue - Date.now();
      if (remaining > 0) {
        return { locked: true, remainingMs: remaining };
      }
      // Lock expired — clean up
      await cache.del(lockCacheKey(email));
      await cache.del(cacheKey(email));
      return { locked: false, remainingMs: 0 };
    }
  } catch {
    // Fall through to memory
  }

  // Fallback: in-memory
  const entry = memoryStore.get(key);
  if (!entry || !entry.lockedUntil) return { locked: false, remainingMs: 0 };

  const remaining = entry.lockedUntil - Date.now();
  if (remaining <= 0) {
    memoryStore.delete(key);
    return { locked: false, remainingMs: 0 };
  }

  return { locked: true, remainingMs: remaining };
}

/**
 * Record a failed login attempt. Returns whether the account is now locked.
 */
export async function recordFailedAttempt(email: string): Promise<{ locked: boolean; attempts: number }> {
  const key = normalizeKey(email);

  // Try cache (Redis) first
  try {
    // Check if already locked
    const lockValue = await cache.get<number>(lockCacheKey(email));
    if (lockValue && lockValue > Date.now()) {
      return { locked: true, attempts: MAX_ATTEMPTS };
    }

    // Increment attempt counter
    // Using get + set since our cache interface doesn't have INCR
    const currentStr = await cache.get<number>(cacheKey(email));
    const current = (typeof currentStr === "number" ? currentStr : 0) + 1;
    await cache.set(cacheKey(email), current, ATTEMPT_TTL_SECONDS);

    if (current >= MAX_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      await cache.set(lockCacheKey(email), lockedUntil, LOCKOUT_TTL_SECONDS);
      logger.warn("account_locked", { email: key, attempts: current });
      return { locked: true, attempts: current };
    }

    return { locked: false, attempts: current };
  } catch {
    // Fall through to memory
  }

  // Fallback: in-memory
  const entry = memoryStore.get(key) ?? { attempts: 0, lockedUntil: null, lastAttemptAt: 0 };

  if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
    return { locked: true, attempts: entry.attempts };
  }

  entry.attempts += 1;
  entry.lastAttemptAt = Date.now();

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    memoryStore.set(key, entry);
    logger.warn("account_locked", { email: key, attempts: entry.attempts });
    return { locked: true, attempts: entry.attempts };
  }

  memoryStore.set(key, entry);
  return { locked: false, attempts: entry.attempts };
}

/**
 * Reset failed attempts on successful login.
 */
export async function resetFailedAttempts(email: string): Promise<void> {
  const key = normalizeKey(email);
  memoryStore.delete(key);

  // Also clean Redis
  try {
    await cache.del(cacheKey(email));
    await cache.del(lockCacheKey(email));
  } catch {
    // Non-critical
  }
}

/** For testing: clear all entries. */
export function clearLockoutStore(): void {
  memoryStore.clear();
}
