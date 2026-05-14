import { NextResponse } from "next/server";
import { z } from "zod";
import { sendInviteEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isEmail } from "@/lib/utils";

const rateMap = new Map<string, { count: number; reset: number }>();
function checkRate(ip: string, max: number, windowMs: number) {
  const now = Date.now();
  const rec = rateMap.get(ip);
  if (!rec || now > rec.reset) { rateMap.set(ip, { count: 1, reset: now + windowMs }); return true; }
  if (rec.count >= max) return false;
  rec.count++;
  return true;
}

const inviteSchema = z.object({
  analysisId: z.string().min(1),
  friendEmail: z.string().email(),
  inviterName: z.string().optional(),
  friendName: z.string().optional()
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!checkRate(ip, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  let body: z.infer<typeof inviteSchema>;
  try {
    body = inviteSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  }
  const inviteId = crypto.randomUUID();
  const inviteToken = crypto.randomUUID();
  let savedInviteId = inviteId;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("invites")
      .insert({
        analysis_id: body.analysisId,
        friend_email: body.friendEmail.toLowerCase(),
        invite_token: inviteToken,
        status: "pending"
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }

    savedInviteId = data.id;
    const { error: unlockError } = await supabase.from("analyses").update({ invites_fulfilled: 1, is_unlocked: true }).eq("id", body.analysisId);
    if (unlockError) {
      console.error("Invite unlock failed", unlockError);
    }
  }

  try {
    const email = await sendInviteEmail({ friendEmail: body.friendEmail.toLowerCase(), inviteToken, inviterName: body.inviterName, friendName: body.friendName });
    if (!email.sent) {
      return NextResponse.json({ error: "Invite could not be sent. Please check the email address and try again." }, { status: 502 });
    }
    return NextResponse.json({ inviteId: savedInviteId, status: "sent", unlocked: true });
  } catch (error) {
    console.error("Invite email failed", error);
    return NextResponse.json({ error: "Invite could not be sent. Please try again." }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") || "").toLowerCase();
  const analysisId = searchParams.get("analysisId");

  if (!email || !isEmail(email)) {
    return NextResponse.json({ invitesFulfilled: 0, unlocked: false });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ invitesFulfilled: 1, unlocked: true });
  }

  await supabase
    .from("invites")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("friend_email", email)
    .eq("status", "pending");

  if (!analysisId) {
    return NextResponse.json({ invitesFulfilled: 0, unlocked: false });
  }

  const { data } = await supabase.from("analyses").select("invites_fulfilled,is_unlocked").eq("id", analysisId).single();
  return NextResponse.json({ invitesFulfilled: data?.invites_fulfilled || 0, unlocked: Boolean(data?.is_unlocked) });
}
