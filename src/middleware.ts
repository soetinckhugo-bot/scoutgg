import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;

  // Si pas de mot de passe configuré, on ne bloque pas
  if (!sitePassword) {
    return NextResponse.next();
  }

  // Routes exemptées
  const pathname = request.nextUrl.pathname;
  if (
    pathname === "/password" ||
    pathname.startsWith("/api/password") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Vérifie le cookie
  const cookie = request.cookies.get("site_access");
  if (cookie?.value === sitePassword) {
    return NextResponse.next();
  }

  // Redirige vers la page de mot de passe
  const url = request.nextUrl.clone();
  url.pathname = "/password";
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
