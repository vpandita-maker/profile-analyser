import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: "/dashboard/:path*",
};
