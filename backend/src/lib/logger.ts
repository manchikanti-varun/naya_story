/**
 * Structured logger for the Naya backend.
 *
 * Provides a consistent JSON logging interface used across all modules.
 * In production, only info/warn/error are emitted. Debug requires LOG_LEVEL=debug.
 *
 * Usage:
 *   import { logger } from "../lib/logger.js";
 *   logger.info("order_created", { orderId, total });
 *   logger.error("payment_failed", { error: err.message });
 *
 *   // Request-scoped:
 *   const log = createRequestLogger(req.requestId, req.method, req.path);
 *   log.info("handler_start");
 */

export type LogContext = Record<string, unknown>;

export interface Logger {
  info(msg: string, ctx?: LogContext): void;
  warn(msg: string, ctx?: LogContext): void;
  error(msg: string, ctx?: LogContext): void;
  debug(msg: string, ctx?: LogContext): void;
  child(ctx: LogContext): Logger;
}

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 } as const;
type LogLevelName = keyof typeof LOG_LEVELS;

function getMinLevel(): number {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase() as LogLevelName;
  return LOG_LEVELS[raw] ?? LOG_LEVELS.info;
}

function formatLog(level: string, msg: string, ctx?: LogContext): string {
  const entry: Record<string, unknown> = {
    level,
    msg,
    timestamp: new Date().toISOString(),
    ...ctx,
  };
  return JSON.stringify(entry);
}

class ConsoleLogger implements Logger {
  private context: LogContext;
  private minLevel: number;

  constructor(context: LogContext = {}, minLevel?: number) {
    this.context = context;
    this.minLevel = minLevel ?? getMinLevel();
  }

  info(msg: string, ctx?: LogContext): void {
    if (this.minLevel > LOG_LEVELS.info) return;
    console.log(formatLog("info", msg, { ...this.context, ...ctx }));
  }

  warn(msg: string, ctx?: LogContext): void {
    if (this.minLevel > LOG_LEVELS.warn) return;
    console.warn(formatLog("warn", msg, { ...this.context, ...ctx }));
  }

  error(msg: string, ctx?: LogContext): void {
    if (this.minLevel > LOG_LEVELS.error) return;
    console.error(formatLog("error", msg, { ...this.context, ...ctx }));
  }

  debug(msg: string, ctx?: LogContext): void {
    if (this.minLevel > LOG_LEVELS.debug) return;
    console.log(formatLog("debug", msg, { ...this.context, ...ctx }));
  }

  child(ctx: LogContext): Logger {
    return new ConsoleLogger({ ...this.context, ...ctx }, this.minLevel);
  }
}

/** Application-wide logger instance. */
export const logger: Logger = new ConsoleLogger();

/**
 * Create a request-scoped logger with requestId, method, and path attached.
 */
export function createRequestLogger(requestId: string, method: string, path: string): Logger {
  return logger.child({ requestId, method, path });
}
