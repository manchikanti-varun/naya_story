import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_GATE_COOKIE = "naya_admin_gate";

/**
 * Verify admin gate cookie HMAC in Edge middleware using Web Crypto API.
 * This is a navigation guard — real auth is enforced by the API via JWT.
 */
async function verifyGateInEdge(value: string | undefined): Promise<boolean> {
  if (!value || !value.includes(".")) return false;
  const [ts, sig] = value.split(".");
  if (!ts || !sig) return false;

  const secret = process.env.ADMIN_GATE_SECRET || process.env.NEXT_PUBLIC_ADMIN_GATE_SECRET || "naya-admin-gate-v2-change-me";

  // Use Web Crypto API (Edge-compatible)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(ts));
  const expected = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);

  // Constant-time comparison (both are 16 hex chars)
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const gate = request.cookies.get(ADMIN_GATE_COOKIE)?.value;
  if (!(await verifyGateInEdge(gate))) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
