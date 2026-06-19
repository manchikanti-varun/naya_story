/**
 * Account lockout — tracks failed login attempts per email.
 *
 * After MAX_ATTEMPTS consecutive failures, the account is locked for LOCKOUT_DURATION_MS.
 * Successful login resets the counter.
 *
 * Uses an in-memory Map (suitable for single-instance deployments).
 * For multi-instance, replace with Redis INCR + TTL.
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
    // Remove entries that haven't been touched in 30 minutes
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
export function getAccountLockStatus(email: string): { locked: boolean; remainingMs: number } {
  const key = normalizeKey(email);
  const entry = store.get(key);
  if (!entry || !entry.lockedUntil) return { locked: false, remainingMs: 0 };

  const remaining = entry.lockedUntil - Date.now();
  if (remaining <= 0) {
    // Lock expired — reset
    store.delete(key);
    return { locked: false, remainingMs: 0 };
  }

  return { locked: true, remainingMs: remaining };
}

/**
 * Record a failed login attempt. Returns whether the account is now locked.
 */
export function recordFailedAttempt(email: string): { locked: boolean; attempts: number } {
  const key = normalizeKey(email);
  const entry = store.get(key) ?? { attempts: 0, lockedUntil: null, lastAttemptAt: 0 };

  // If already locked, don't increment further
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
export function resetFailedAttempts(email: string): void {
  store.delete(normalizeKey(email));
}

/** For testing: clear all entries. */
export function clearLockoutStore(): void {
  store.clear();
}
