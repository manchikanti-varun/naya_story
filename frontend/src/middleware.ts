import crypto from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_GATE_COOKIE } from "@/lib/admin-gate";

/**
 * Verify admin gate cookie HMAC in Edge middleware.
 * This is a navigation guard — real auth is enforced by the API via JWT.
 */
function verifyGateInEdge(value: string | undefined): boolean {
  if (!value || !value.includes(".")) return false;
  const [ts, sig] = value.split(".");
  if (!ts || !sig) return false;

  const secret = process.env.NEXT_PUBLIC_API_URL || "naya-admin-gate";
  const expected = crypto.createHmac("sha256", secret).update(ts).digest("hex").slice(0, 16);

  if (expected.length !== sig.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"));
  } catch {
    return false;
  }
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
  if (!verifyGateInEdge(gate)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
