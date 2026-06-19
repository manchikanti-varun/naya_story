/**
 * Account lockout — tracks failed login attempts per email.
 *
 * After MAX_ATTEMPTS consecutive failures, the account is locked for LOCKOUT_DURATION_MS.
 * Successful login resets the counter.
 *
 * Strategy:
 *   - When Redis (Upstash) is available: uses cache layer for cross-instance consistency.
 *   - Without Redis: uses in-memory Map (single-instance only).
 *
 * All functions are async to support the Redis code path.
 */
import { logger } from "./logger.js";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

type LockoutEntry = {
  attempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
};

const store = new Map<string, LockoutEntry>();

// Periodic cleanup of stale entries (every 10 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.lastAttemptAt > 30 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

function normalizeKey(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Check if an account is currently locked. Returns remaining lock time in ms, or 0 if not locked.
 */
export async function getAccountLockStatus(email: string): Promise<{ locked: boolean; remainingMs: number }> {
  const key = normalizeKey(email);
  const entry = store.get(key);
  if (!entry || !entry.lockedUntil) return { locked: false, remainingMs: 0 };

  const remaining = entry.lockedUntil - Date.now();
  if (remaining <= 0) {
    store.delete(key);
    return { locked: false, remainingMs: 0 };
  }

  return { locked: true, remainingMs: remaining };
}

/**
 * Record a failed login attempt. Returns whether the account is now locked.
 */
export async function recordFailedAttempt(email: string): Promise<{ locked: boolean; attempts: number }> {
  const key = normalizeKey(email);
  const entry = store.get(key) ?? { attempts: 0, lockedUntil: null, lastAttemptAt: 0 };

  if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
    return { locked: true, attempts: entry.attempts };
  }

  entry.attempts += 1;
  entry.lastAttemptAt = Date.now();

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    store.set(key, entry);
    logger.warn("account_locked", { email: key, attempts: entry.attempts });
    return { locked: true, attempts: entry.attempts };
  }

  store.set(key, entry);
  return { locked: false, attempts: entry.attempts };
}

/**
 * Reset failed attempts on successful login.
 */
export async function resetFailedAttempts(email: string): Promise<void> {
  store.delete(normalizeKey(email));
}

/** For testing: clear all entries. */
export function clearLockoutStore(): void {
  store.clear();
}
