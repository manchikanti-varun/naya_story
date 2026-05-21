import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_GATE_COOKIE } from "@/lib/admin-gate";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const gate = request.cookies.get(ADMIN_GATE_COOKIE)?.value;
  if (gate !== "1") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
