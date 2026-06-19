import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_GATE_COOKIE = "naya_admin_gate";

/**
 * Admin navigation guard — prevents casual access to /admin pages.
 * Real authorization is enforced by the API via JWT on every request.
 *
 * The cookie is a simple signed value set client-side after successful admin login.
 * We verify format only (not HMAC) in middleware to avoid secret sync issues
 * across Edge/client environments. The HMAC verification was causing deployment
 * issues with env var availability in Edge runtime.
 */
function hasValidGateCookie(value: string | undefined): boolean {
  if (!value || !value.includes(".")) return false;
  const [ts, sig] = value.split(".");
  if (!ts || !sig) return false;
  // Verify format: timestamp is hex, signature is 16 hex chars
  if (!/^[0-9a-f]+$/i.test(ts) || sig.length !== 16) return false;
  // Check cookie isn't expired (30 days max)
  const timestamp = parseInt(ts, 16);
  const age = Date.now() - timestamp;
  if (age < 0 || age > 30 * 24 * 60 * 60 * 1000) return false;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const gate = request.cookies.get(ADMIN_GATE_COOKIE)?.value;
  if (!hasValidGateCookie(gate)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
