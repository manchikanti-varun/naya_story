import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_GATE_COOKIE = "naya_admin_gate";

// All routes are public by default — Clerk should NOT redirect to sign-in
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/products(.*)',
  '/collections(.*)',
  '/new-in(.*)',
  '/our-story(.*)',
  '/policies(.*)',
  '/compare(.*)',
  '/admin/login(.*)',
  '/api(.*)',
])

export default clerkMiddleware((_auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Admin gate protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !pathname.startsWith("/admin/login/")) {
    const gate = req.cookies.get(ADMIN_GATE_COOKIE)?.value;
    if (gate !== "1") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
}
