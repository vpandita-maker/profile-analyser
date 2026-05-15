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

function cleanText(value: unknown) {
  return typeof value === "string" ? value.slice(0, 500) : "";
}

function sourceFromSearch(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return params.get("utm_source") || params.get("ref") || params.get("source") || "";
}

function platformFromSource(value: string) {
  const source = value.toLowerCase();
  if (!source) return "";
  if (source.includes("linkedin") || source === "li") return "LinkedIn";
  if (source.includes("twitter") || source === "x" || source.includes("t.co")) return "X";
  if (source.includes("instagram")) return "Instagram";
  if (source.includes("facebook") || source === "fb" || source.includes("meta")) return "Facebook";
  if (source.includes("google")) return "Google";
  if (source.includes("bing")) return "Bing";
  if (source.includes("reddit")) return "Reddit";
  if (source.includes("youtube") || source.includes("youtu.be")) return "YouTube";
  if (source.includes("whatsapp") || source === "wa") return "WhatsApp";
  if (source.includes("email") || source.includes("newsletter")) return "Email";
  return value.trim().slice(0, 80) || "";
}

function platformFromReferrer(referrer: string) {
  if (!referrer) return "Direct / Unknown";
  try {
    const hostname = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    if (hostname.includes("iheartlinkedin.app")) return "Internal";
    return platformFromSource(hostname) || hostname;
  } catch {
    return platformFromSource(referrer) || "Direct / Unknown";
  }
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
  const referrer = cleanText(body.referrer);
  const search = cleanText(body.search);
  const sourcePlatform = platformFromSource(sourceFromSearch(search)) || platformFromReferrer(referrer);

  if (supabase && !path.startsWith("/dashboard")) {
    const event = {
      visitor_id: visitorId,
      visit_date: visitDate,
      first_seen_at: now,
      last_seen_at: now,
      last_path: path,
      referrer,
      source_platform: sourcePlatform,
    };

    let insert = await supabase.from("visitor_events").insert(event);

    if (insert.error?.code === "42703") {
      insert = await supabase.from("visitor_events").insert({
        visitor_id: visitorId,
        visit_date: visitDate,
        first_seen_at: now,
        last_seen_at: now,
        last_path: path,
      });
    }

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
