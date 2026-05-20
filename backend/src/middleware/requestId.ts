import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

/** Propagate or generate a request id for tracing (logs + response header). */
export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const fromHeader = req.headers["x-request-id"];
  const id =
    typeof fromHeader === "string" && fromHeader.trim().length > 0
      ? fromHeader.trim().slice(0, 128)
      : randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
};
