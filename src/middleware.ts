import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("bapenda_session")?.value;

  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".");

  // If not logged in and accessing protected route -> redirect to /login
  if (!sessionCookie && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and accessing /login -> redirect to home /
  if (sessionCookie && pathname === "/login") {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
