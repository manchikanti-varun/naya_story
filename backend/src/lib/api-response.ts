/**
 * Standardized API response helpers.
 * Provides consistent response format across all endpoints.
 */
import type { Response } from "express";

export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
};

/**
 * Send a successful response.
 */
export function sendSuccess<T>(res: Response, data: T, status = 200, meta?: Record<string, unknown>): void {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  res.status(status).json(body);
}

/**
 * Send a created (201) response.
 */
export function sendCreated<T>(res: Response, data: T, meta?: Record<string, unknown>): void {
  sendSuccess(res, data, 201, meta);
}

/**
 * Send an error response.
 */
export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message },
  };
  if (details !== undefined) body.error.details = details;
  const requestId = (res.req as { requestId?: string } | undefined)?.requestId;
  if (requestId) body.requestId = requestId;
  res.status(status).json(body);
}

/** Common error codes */
export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  PAYMENT_ERROR: "PAYMENT_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;
