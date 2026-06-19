import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // Admin gate temporarily disabled — auth enforced by API via JWT
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
