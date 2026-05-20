import type { Response } from "express";

const REFRESH_COOKIE = "naya_rt";

const REFRESH_MS = 30 * 24 * 60 * 60 * 1000;

export function setRefreshTokenCookie(res: Response, rawToken: string, secure: boolean): void {
  res.cookie(REFRESH_COOKIE, rawToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: REFRESH_MS,
    path: "/api/auth",
  });
}

export function clearRefreshTokenCookie(res: Response, secure: boolean): void {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth", httpOnly: true, secure, sameSite: "lax" });
}

export function readRefreshRaw(req: { cookies?: Record<string, string>; body?: unknown }): string | null {
  const fromCookie = req.cookies?.[REFRESH_COOKIE];
  if (typeof fromCookie === "string" && fromCookie.length > 0) return fromCookie;
  const body = req.body as { refreshToken?: string } | undefined;
  if (body && typeof body.refreshToken === "string" && body.refreshToken.length > 0) {
    return body.refreshToken;
  }
  return null;
}
