/**
 * Structured logger for the Naya backend.
 * Uses pino for high-performance JSON logging.
 *
 * If pino is not installed, falls back to a lightweight console-based
 * structured logger with the same interface.
 */

export type LogContext = Record<string, unknown>;

export interface Logger {
  info(msg: string, ctx?: LogContext): void;
  warn(msg: string, ctx?: LogContext): void;
  error(msg: string, ctx?: LogContext): void;
  debug(msg: string, ctx?: LogContext): void;
  child(ctx: LogContext): Logger;
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

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  info(msg: string, ctx?: LogContext): void {
    console.log(formatLog("info", msg, { ...this.context, ...ctx }));
  }

  warn(msg: string, ctx?: LogContext): void {
    console.warn(formatLog("warn", msg, { ...this.context, ...ctx }));
  }

  error(msg: string, ctx?: LogContext): void {
    console.error(formatLog("error", msg, { ...this.context, ...ctx }));
  }

  debug(msg: string, ctx?: LogContext): void {
    if (process.env.LOG_LEVEL === "debug") {
      console.log(formatLog("debug", msg, { ...this.context, ...ctx }));
    }
  }

  child(ctx: LogContext): Logger {
    return new ConsoleLogger({ ...this.context, ...ctx });
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
