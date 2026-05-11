import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const goal = searchParams.get("goal") || "Job Search";
  const industry = searchParams.get("industry") || "";
  const linkedinId = searchParams.get("linkedinId") || "";

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ entries: [], userRank: null, total: 0 });
  }

  const industryFilter = industry && industry !== "Other" ? industry : null;

  let entriesQuery = supabase
    .from("leaderboard")
    .select("linkedin_id, name, headline, profile_photo_url, overall_score")
    .eq("is_public", true)
    .eq("goal", goal)
    .order("overall_score", { ascending: false })
    .limit(20);

  if (industryFilter) entriesQuery = entriesQuery.eq("industry", industryFilter);

  const { data: entries } = await entriesQuery;

  let totalQuery = supabase
    .from("leaderboard")
    .select("*", { count: "exact", head: true })
    .eq("is_public", true)
    .eq("goal", goal);

  if (industryFilter) totalQuery = totalQuery.eq("industry", industryFilter);

  const { count: total } = await totalQuery;

  let userRank: number | null = null;

  if (linkedinId) {
    const { data: userEntry } = await supabase
      .from("leaderboard")
      .select("overall_score")
      .eq("linkedin_id", linkedinId)
      .maybeSingle();

    if (userEntry) {
      let rankQuery = supabase
        .from("leaderboard")
        .select("*", { count: "exact", head: true })
        .eq("is_public", true)
        .eq("goal", goal)
        .gt("overall_score", userEntry.overall_score);

      if (industryFilter) rankQuery = rankQuery.eq("industry", industryFilter);

      const { count: rankCount } = await rankQuery;
      userRank = (rankCount ?? 0) + 1;
    }
  }

  return NextResponse.json({ entries: entries || [], userRank, total: total ?? 0 });
}
