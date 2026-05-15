import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

  if (hostname === "www.iheartlinkedin.app") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = "iheartlinkedin.app";
    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (!pathname.startsWith("/dashboard") || pathname === "/dashboard/login") {
    return NextResponse.next();
  }

  const auth = request.cookies.get("dashboard_auth")?.value;
  const expected = Buffer.from(process.env.DASHBOARD_PASSWORD ?? "").toString("base64");

  if (auth !== expected) {
    const loginUrl = new URL("/dashboard/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
