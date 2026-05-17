import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const isAuthenticated = request.cookies.get("uade-eats-auth")?.value === "1"
  const { pathname } = request.nextUrl

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
  matcher: [
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
  ],
}
