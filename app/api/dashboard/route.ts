import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getGA4Stats } from "@/lib/ga4";

function toLocalDate(iso: string) {
  return iso.slice(0, 10);
}

function extractRoleIndustry(analysisJson: { topFixes?: Array<{ recommended: string }> }) {
  const rec = analysisJson?.topFixes?.[0]?.recommended ?? "";
  const parts = rec.split("|").map((s) => s.trim());
  return { role: parts[0] || "Unknown", industry: parts[1] || "Unknown" };
}

export async function GET() {
  const supabase = getSupabaseAdmin();

  const [ga4, supabaseResult] = await Promise.all([
    getGA4Stats(),
    supabase
      ? Promise.all([
          supabase.from("analyses").select("id,created_at,is_unlocked,invites_fulfilled,analysis_json").order("created_at", { ascending: false }),
          supabase.from("invites").select("analysis_id,status,created_at").order("created_at", { ascending: false }),
        ])
      : Promise.resolve([{ data: [] }, { data: [] }] as const),
  ]);

  const analyses = (supabaseResult[0]?.data ?? []) as Array<{
    id: string; created_at: string; is_unlocked: boolean; invites_fulfilled: number;
    analysis_json: { overallScore: number; topFixes: Array<{ recommended: string }> };
  }>;
  const invites = (supabaseResult[1]?.data ?? []) as Array<{ analysis_id: string; status: string; created_at: string }>;

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const analysesToday = analyses.filter((a) => toLocalDate(a.created_at) === todayStr).length;
  const analysesYesterday = analyses.filter((a) => toLocalDate(a.created_at) === yesterdayStr).length;

  const uniqueInviters = new Set(invites.map((i) => i.analysis_id)).size;
  const inviteRate = analyses.length > 0 ? Math.round((uniqueInviters / analyses.length) * 100) : 0;
  const inviteRateYday = (() => {
    const byYday = analyses.filter((a) => toLocalDate(a.created_at) <= yesterdayStr).length;
    const invYday = new Set(invites.filter((i) => toLocalDate(i.created_at) <= yesterdayStr).map((i) => i.analysis_id)).size;
    return byYday > 0 ? Math.round((invYday / byYday) * 100) : 0;
  })();

  const viralCoeff = analyses.length > 0 ? parseFloat((invites.length / analyses.length).toFixed(2)) : 0;
  const viralCoeffYday = (() => {
    const at = analyses.filter((a) => toLocalDate(a.created_at) <= yesterdayStr).length;
    const it = invites.filter((i) => toLocalDate(i.created_at) <= yesterdayStr).length;
    return at > 0 ? parseFloat((it / at).toFixed(2)) : 0;
  })();

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
    return { date: d, count: analyses.filter((a) => toLocalDate(a.created_at) === d).length };
  });

  const recent = analyses.slice(0, 8).map((a) => {
    const { role, industry } = extractRoleIndustry(a.analysis_json);
    const diff = Date.now() - new Date(a.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    const timeAgo = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
    return { role, industry, score: a.analysis_json?.overallScore ?? 0, unlocked: a.is_unlocked, timeAgo };
  });

  const roleCounts: Record<string, number> = {};
  const industryCounts: Record<string, number> = {};
  for (const a of analyses) {
    const { role, industry } = extractRoleIndustry(a.analysis_json);
    if (role && role !== "Unknown") roleCounts[role] = (roleCounts[role] ?? 0) + 1;
    if (industry && industry !== "Unknown") industryCounts[industry] = (industryCounts[industry] ?? 0) + 1;
  }
  const topRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topIndustries = Object.entries(industryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return NextResponse.json({
    totalAnalyses: analyses.length,
    analysesToday,
    analysesYesterday,
    inviteRate,
    inviteRateYday,
    viralCoeff,
    viralCoeffYday,
    visitorsToday: ga4?.visitorsToday ?? null,
    visitorsYesterday: ga4?.visitorsYesterday ?? null,
    funnel: [
      { label: "Analyses Run", value: analyses.length },
      { label: "Got Fixes", value: analyses.filter((a) => a.analysis_json?.topFixes?.length > 0).length },
      { label: "Sent Invite", value: uniqueInviters },
      { label: "Unlocked", value: analyses.filter((a) => a.is_unlocked).length },
    ],
    days,
    recent,
    topRoles,
    topIndustries,
    updatedAt: new Date().toISOString(),
  });
}
