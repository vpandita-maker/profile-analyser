import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://iheartlinkedin.app";
}

export async function POST(request: Request) {
  const { analysisId } = (await request.json()) as { analysisId?: string };
  if (!analysisId) return NextResponse.json({ error: "Missing analysisId" }, { status: 400 });

  const inviteToken = crypto.randomUUID();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    await supabase.from("invites").insert({
      analysis_id: analysisId,
      friend_email: `link_${inviteToken}@share`,
      invite_token: inviteToken,
      status: "pending",
    });
    await supabase.from("analyses")
      .update({ invites_fulfilled: 1, is_unlocked: true })
      .eq("id", analysisId);
  }

  const url = `${appUrl()}/?invite=${encodeURIComponent(inviteToken)}`;
  return NextResponse.json({ token: inviteToken, url });
}
