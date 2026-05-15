import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/admin", "/tontines", "/membres", "/cotisations", "/retards", "/votes", "/projets/soumettre", "/notifications", "/profil"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("fasotontine_token")?.value;
  const role = request.cookies.get("fasotontine_role")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "administrateur_plateforme") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/tontines/:path*", "/membres/:path*", "/cotisations/:path*", "/retards/:path*", "/votes/:path*", "/projets/soumettre/:path*", "/notifications/:path*", "/profil/:path*"],
};
