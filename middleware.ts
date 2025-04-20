import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of public paths that don't require authentication
const publicPaths = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/check-email",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is a public path or starts with a public path
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`) || pathname.startsWith("/api/auth/reset-password/"),
  )

  // Allow access to public paths without authentication
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for authentication token - FIXED: using "auth-token" to match what's set in login route
  const authToken = request.cookies.get("auth-token")?.value

  // If no token and trying to access a protected route, redirect to login
  if (!authToken) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.nextUrl.pathname))
    return NextResponse.redirect(url)
  }

  // Allow authenticated users to proceed
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (authentication API routes)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     * 5. /images/* (public images)
     */
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
}
