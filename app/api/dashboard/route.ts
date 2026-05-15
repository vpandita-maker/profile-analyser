import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getGA4Stats } from "@/lib/ga4";

function extractRoleIndustry(analysisJson: { topFixes?: Array<{ recommended: string }> }) {
  const rec = analysisJson?.topFixes?.[0]?.recommended ?? "";
  const parts = rec.split("|").map((s) => s.trim());
  return { role: parts[0] || "Unknown", industry: parts[1] || "Unknown" };
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toISTTimeStr(iso: string) {
  const istMs = new Date(iso).getTime() + IST_OFFSET_MS;
  const d = new Date(istMs);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Accept ?date=YYYY-MM-DD (IST date). Defaults to today in IST.
  const nowIST = new Date(Date.now() + IST_OFFSET_MS);
  const todayISTStr = nowIST.toISOString().slice(0, 10);
  const selectedDate = searchParams.get("date") || todayISTStr;
  const isToday = selectedDate === todayISTStr;

  // Convert IST date boundaries to UTC for Supabase
  const dayStartUTC = new Date(new Date(`${selectedDate}T00:00:00.000Z`).getTime() - IST_OFFSET_MS).toISOString();
  const dayEndUTC = new Date(new Date(`${selectedDate}T23:59:59.999Z`).getTime() - IST_OFFSET_MS).toISOString();

  const supabase = getSupabaseAdmin();

  const [ga4, supabaseResult] = await Promise.all([
    isToday ? getGA4Stats() : Promise.resolve(null),
    supabase
      ? Promise.all([
          supabase.from("analyses").select("id,created_at,is_unlocked,invites_fulfilled,analysis_json")
            .gte("created_at", dayStartUTC)
            .lte("created_at", dayEndUTC)
            .order("created_at", { ascending: false }),
          supabase.from("invites").select("analysis_id,status,created_at")
            .gte("created_at", dayStartUTC)
            .lte("created_at", dayEndUTC)
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

  const recent = analyses.map((a) => {
    const { role, industry } = extractRoleIndustry(a.analysis_json);
    return {
      role,
      industry,
      score: a.analysis_json?.overallScore ?? 0,
      unlocked: a.is_unlocked,
      timeIST: toISTTimeStr(a.created_at),
    };
  });

  const roleCounts: Record<string, number> = {};
  const industryCounts: Record<string, number> = {};
  for (const a of analyses) {
    const { role, industry } = extractRoleIndustry(a.analysis_json);
    if (role && role !== "Unknown") roleCounts[role] = (roleCounts[role] ?? 0) + 1;
    if (industry && industry !== "Unknown") industryCounts[industry] = (industryCounts[industry] ?? 0) + 1;
  }

  return NextResponse.json({
    analyses: analyses.length,
    inviteRate,
    viralCoeff,
    invitesSent: invites.length,
    unlocked: analyses.filter((a) => a.is_unlocked).length,
    uniqueViewersToday: isToday ? (ga4?.uniqueViewersToday ?? null) : null,
    funnel: [
      { label: "Analyses", value: analyses.length },
      { label: "Got Fixes", value: analyses.filter((a) => a.analysis_json?.topFixes?.length > 0).length },
      { label: "Invited", value: uniqueInviters },
      { label: "Unlocked", value: analyses.filter((a) => a.is_unlocked).length },
    ],
    recent,
    topRoles: Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 6),
    topIndustries: Object.entries(industryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6),
    date: selectedDate,
    isToday,
    updatedAt: new Date().toISOString(),
  });
}
