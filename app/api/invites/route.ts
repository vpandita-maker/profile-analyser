import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isEmail } from "@/lib/utils";

const inviteSchema = z.object({
  analysisId: z.string().min(1),
  friendEmail: z.string().email()
});

export async function POST(request: Request) {
  const body = inviteSchema.parse(await request.json());
  const inviteId = crypto.randomUUID();
  const inviteToken = crypto.randomUUID();
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

    await supabase.from("analyses").update({ invites_fulfilled: 1, is_unlocked: true }).eq("id", body.analysisId);
    return NextResponse.json({ inviteId: data.id, status: "sent" });
  }

  return NextResponse.json({ inviteId, status: "sent" });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const email = (session?.user.email || searchParams.get("email") || "").toLowerCase();
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
