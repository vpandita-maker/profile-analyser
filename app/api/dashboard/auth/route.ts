import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const correct = process.env.DASHBOARD_PASSWORD;

  if (!correct || password !== correct) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = Buffer.from(correct).toString("base64");
  const response = NextResponse.json({ ok: true });
  response.cookies.set("dashboard_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return response;
}
