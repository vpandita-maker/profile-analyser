import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const VISITOR_COOKIE = "ihll_visitor_id";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function todayIST() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function cleanPath(path: unknown) {
  if (typeof path !== "string") return "/";
  if (!path.startsWith("/")) return "/";
  return path.slice(0, 200);
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  const body = await request.json().catch(() => ({}));
  const cookieHeader = request.headers.get("cookie") ?? "";
  const existingVisitorId = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VISITOR_COOKIE}=`))
    ?.split("=")[1];
  const visitorId = existingVisitorId || crypto.randomUUID();
  const now = new Date().toISOString();
  const visitDate = todayIST();
  const path = cleanPath(body.path);

  if (supabase && !path.startsWith("/dashboard")) {
    const insert = await supabase.from("visitor_events").insert({
      visitor_id: visitorId,
      visit_date: visitDate,
      first_seen_at: now,
      last_seen_at: now,
      last_path: path,
    });

    if (insert.error?.code === "23505") {
      await supabase
        .from("visitor_events")
        .update({ last_seen_at: now, last_path: path })
        .eq("visitor_id", visitorId)
        .eq("visit_date", visitDate);
    } else if (insert.error) {
      console.error("Failed to record visitor", insert.error);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });

  return response;
}
