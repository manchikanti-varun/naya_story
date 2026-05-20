import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";

/** Typed API errors with stable JSON shape. */
export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = "HttpError";
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const rid = req.requestId ?? "";
  if (err instanceof HttpError) {
    if (rid) console.warn(JSON.stringify({ level: "warn", msg: err.message, status: err.status, requestId: rid }));
    res.status(err.status).json({
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
      ...(rid ? { requestId: rid } : {}),
    });
    return;
  }
  console.error(JSON.stringify({ level: "error", msg: "unhandled", requestId: rid }), err);
  res.status(500).json({ message: "Internal server error", ...(rid ? { requestId: rid } : {}) });
};

/** Wrap async route handlers so rejections reach `errorHandler`. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
