import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const secretKey = "uade-eats-super-secret-key-for-dev"
const key = new TextEncoder().encode(secretKey)

const AUTH_CHECKED_PATHS = [
  "/",
  "/login",
  "/register",
  "/cart",
  "/orders",
  "/profile",
  "/profile/personal-info",
  "/profile/payment-methods",
  "/profile/notifications-settings",
  "/profile/theme",
  "/profile/help",
  "/profile/report",
  "/checkout",
  "/order-status",
]

export async function proxy(request: NextRequest) {
  const isAuthenticated = request.cookies.get("uade-eats-auth")?.value === "1"
  const { pathname } = request.nextUrl

  // Confine store_owner users to /store-portal
  const session = request.cookies.get("uade-eats-session")?.value
  if (session && pathname !== "/login") {
    try {
      const { payload } = await jwtVerify(session, key, { algorithms: ["HS256"] })
      if (payload.role === "store_owner" && !pathname.startsWith("/store-portal")) {
        return NextResponse.redirect(new URL("/store-portal", request.url))
      }
    } catch {
      // invalid/expired session, fall through to normal auth handling
    }
  }

  if (!AUTH_CHECKED_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  if (pathname === "/login" || pathname === "/register") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
