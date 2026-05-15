import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getGA4Stats } from "@/lib/ga4";

function extractRoleIndustry(analysisJson: { topFixes?: Array<{ recommended: string }> }) {
  const rec = analysisJson?.topFixes?.[0]?.recommended ?? "";
  const parts = rec.split("|").map((s) => s.trim());
  return { role: parts[0] || "Unknown", industry: parts[1] || "Unknown" };
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

function istHour(iso: string) {
  return Math.floor(((new Date(iso).getTime() + IST_OFFSET_MS) % 86400000) / 3600000);
}

export async function GET() {
  const supabase = getSupabaseAdmin();

  // Today in IST
  const nowIST = new Date(Date.now() + IST_OFFSET_MS);
  const todayISTStr = nowIST.toISOString().slice(0, 10); // "YYYY-MM-DD" in IST
  // Convert IST midnight back to UTC for Supabase filter
  const todayStartUTC = new Date(new Date(`${todayISTStr}T00:00:00.000Z`).getTime() - IST_OFFSET_MS).toISOString();

  const [ga4, supabaseResult] = await Promise.all([
    getGA4Stats(),
    supabase
      ? Promise.all([
          supabase.from("analyses").select("id,created_at,is_unlocked,invites_fulfilled,analysis_json")
            .gte("created_at", todayStartUTC)
            .order("created_at", { ascending: false }),
          supabase.from("invites").select("analysis_id,status,created_at")
            .gte("created_at", todayStartUTC)
            .order("created_at", { ascending: false }),
        ])
      : Promise.resolve([{ data: [] }, { data: [] }] as const),
  ]);

  const analyses = (supabaseResult[0]?.data ?? []) as Array<{
    id: string; created_at: string; is_unlocked: boolean; invites_fulfilled: number;
    analysis_json: { overallScore: number; topFixes: Array<{ recommended: string }> };
  }>;
  const invites = (supabaseResult[1]?.data ?? []) as Array<{ analysis_id: string; status: string; created_at: string }>;

  const uniqueInviters = new Set(invites.map((i) => i.analysis_id)).size;
  const inviteRate = analyses.length > 0 ? Math.round((uniqueInviters / analyses.length) * 100) : 0;
  const viralCoeff = analyses.length > 0 ? parseFloat((invites.length / analyses.length).toFixed(2)) : 0;

  // Hourly breakdown in IST
  const currentISTHour = Math.floor(((Date.now() + IST_OFFSET_MS) % 86400000) / 3600000);
  const hours = Array.from({ length: currentISTHour + 1 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    count: analyses.filter((a) => istHour(a.created_at) === h).length,
  }));

  const recent = analyses.slice(0, 10).map((a) => {
    const { role, industry } = extractRoleIndustry(a.analysis_json);
    const diff = Date.now() - new Date(a.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    const timeAgo = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
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
    analyses: analyses.length,
    inviteRate,
    viralCoeff,
    invitesSent: invites.length,
    unlocked: analyses.filter((a) => a.is_unlocked).length,
    visitorsToday: ga4?.visitorsToday ?? null,
    funnel: [
      { label: "Analyses", value: analyses.length },
      { label: "Got Fixes", value: analyses.filter((a) => a.analysis_json?.topFixes?.length > 0).length },
      { label: "Invited", value: uniqueInviters },
      { label: "Unlocked", value: analyses.filter((a) => a.is_unlocked).length },
    ],
    hours,
    recent,
    topRoles,
    topIndustries,
    date: todayISTStr,
    updatedAt: new Date().toISOString(),
  });
}
