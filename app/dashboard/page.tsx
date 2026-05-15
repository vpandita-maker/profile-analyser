import { getSupabaseAdmin } from "@/lib/supabase";
import { TrendingDown, TrendingUp } from "lucide-react";

interface AnalysisRow {
  id: string;
  created_at: string;
  is_unlocked: boolean;
  invites_fulfilled: number;
  analysis_json: {
    overallScore: number;
    topFixes: Array<{ recommended: string }>;
  };
}

interface InviteRow {
  analysis_id: string;
  status: string;
  created_at: string;
}

function extractRoleIndustry(row: AnalysisRow) {
  const rec = row.analysis_json?.topFixes?.[0]?.recommended ?? "";
  const parts = rec.split("|").map((s) => s.trim());
  return { role: parts[0] || "Unknown", industry: parts[1] || "Unknown" };
}

function toLocalDate(iso: string) {
  return iso.slice(0, 10);
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function SparkLine({ data, max }: { data: number[]; max: number }) {
  const W = 320;
  const H = 64;
  const pad = 6;
  const effective = Math.max(max, 1);
  const pts = data.map((v, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2);
    const y = H - pad - (v / effective) * (H - pad * 2);
    return [x, y] as [number, number];
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" L ");
  const area = `M ${pts[0][0]},${pts[0][1]} L ${line.slice(line.indexOf(",") + 1).slice(line.split(",")[0].length)} L ${pts[pts.length - 1][0]},${H - pad} L ${pts[0][0]},${H - pad} Z`;
  const linePath = `M ${line}`;
  const areaPath = `M ${pts.map(([x, y]) => `${x},${y}`).join(" L ")} L ${pts[pts.length - 1][0]},${H - pad} L ${pts[0][0]},${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 64 }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#lg)" />
      <path d={linePath} fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) =>
        data[i] > 0 ? <circle key={i} cx={x} cy={y} r="2.5" fill="#14b8a6" /> : null
      )}
    </svg>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-40 shrink-0 truncate text-xs text-slate-400">{label}</span>
      <div className="flex-1 rounded-full bg-slate-800 h-2 overflow-hidden">
        <div className="h-2 rounded-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-bold text-slate-300">{value}</span>
    </div>
  );
}

function Delta({ today, yesterday }: { today: number; yesterday: number }) {
  if (yesterday === 0 && today === 0) return <span className="text-xs text-slate-500">No data yesterday</span>;
  const diff = today - yesterday;
  const pct = yesterday > 0 ? Math.round(Math.abs(diff / yesterday) * 100) : null;
  const label = pct !== null ? `${pct}% vs yesterday` : `+${today} today`;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400"><TrendingUp className="h-3 w-3" />{label}</span>;
  if (diff < 0) return <span className="flex items-center gap-0.5 text-xs font-semibold text-red-400"><TrendingDown className="h-3 w-3" />{label}</span>;
  return <span className="text-xs text-slate-500">Same as yesterday</span>;
}

export default async function DashboardPage() {
  const supabase = getSupabaseAdmin();

  let analyses: AnalysisRow[] = [];
  let invites: InviteRow[] = [];

  if (supabase) {
    const [{ data: a }, { data: inv }] = await Promise.all([
      supabase.from("analyses").select("id,created_at,is_unlocked,invites_fulfilled,analysis_json").order("created_at", { ascending: false }),
      supabase.from("invites").select("analysis_id,status,created_at").order("created_at", { ascending: false }),
    ]);
    analyses = (a ?? []) as AnalysisRow[];
    invites = (inv ?? []) as InviteRow[];
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const analysesToday = analyses.filter((a) => toLocalDate(a.created_at) === todayStr).length;
  const analysesYesterday = analyses.filter((a) => toLocalDate(a.created_at) === yesterdayStr).length;

  const uniqueInviters = new Set(invites.map((i) => i.analysis_id)).size;
  const inviteRate = analyses.length > 0 ? Math.round((uniqueInviters / analyses.length) * 100) : 0;
  const inviteRateYday = (() => {
    const byYday = analyses.filter((a) => toLocalDate(a.created_at) <= yesterdayStr);
    const invYday = new Set(invites.filter((i) => toLocalDate(i.created_at) <= yesterdayStr).map((i) => i.analysis_id)).size;
    return byYday.length > 0 ? Math.round((invYday / byYday.length) * 100) : 0;
  })();

  const viralCoeff = analyses.length > 0 ? (invites.length / analyses.length).toFixed(2) : "0.00";
  const viralCoeffYday = (() => {
    const analysesYdayTotal = analyses.filter((a) => toLocalDate(a.created_at) <= yesterdayStr).length;
    const invitesYdayTotal = invites.filter((i) => toLocalDate(i.created_at) <= yesterdayStr).length;
    return analysesYdayTotal > 0 ? (invitesYdayTotal / analysesYdayTotal).toFixed(2) : "0.00";
  })();
  const invitesToday = invites.filter((i) => toLocalDate(i.created_at) === todayStr).length;
  const invitesYesterday = invites.filter((i) => toLocalDate(i.created_at) === yesterdayStr).length;

  // Daily analyses last 14 days
  const days: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ date: d, count: analyses.filter((a) => toLocalDate(a.created_at) === d).length });
  }
  const maxDayCount = Math.max(...days.map((d) => d.count), 1);

  // Recent 8 analyses
  const recent = analyses.slice(0, 8).map((a) => {
    const { role, industry } = extractRoleIndustry(a);
    const timeAgo = (() => {
      const diff = Date.now() - new Date(a.created_at).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    })();
    return { role, industry, score: a.analysis_json?.overallScore ?? 0, unlocked: a.is_unlocked, timeAgo };
  });

  // Top roles and industries
  const roleCounts: Record<string, number> = {};
  const industryCounts: Record<string, number> = {};
  for (const a of analyses) {
    const { role, industry } = extractRoleIndustry(a);
    if (role && role !== "Unknown") roleCounts[role] = (roleCounts[role] ?? 0) + 1;
    if (industry && industry !== "Unknown") industryCounts[industry] = (industryCounts[industry] ?? 0) + 1;
  }
  const topRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topIndustries = Object.entries(industryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxRole = topRoles[0]?.[1] ?? 1;
  const maxIndustry = topIndustries[0]?.[1] ?? 1;

  // Funnel (Supabase-derived only)
  const funnelSteps = [
    { label: "Analyses Run", value: analyses.length },
    { label: "Reached Fixes", value: analyses.filter((a) => a.analysis_json?.topFixes?.length > 0).length },
    { label: "Sent Invite", value: uniqueInviters },
    { label: "Fully Unlocked", value: analyses.filter((a) => a.is_unlocked).length },
  ];

  const scoreAvg = analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + (a.analysis_json?.overallScore ?? 0), 0) / analyses.length) : 0;

  return (
    <main className="min-h-screen bg-[#0f172a] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">iHeartLinkedIn</h1>
            <p className="mt-0.5 text-xs text-slate-500">Founder Dashboard · Live data</p>
          </div>
          <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 ring-1 ring-teal-500/20">
            {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        {/* KPI Row */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total Analyses", value: analyses.length, sub: <Delta today={analysesToday} yesterday={analysesYesterday} /> },
            { label: "Invite Send Rate", value: `${inviteRate}%`, sub: <Delta today={inviteRate} yesterday={inviteRateYday} /> },
            { label: "Viral Coefficient", value: viralCoeff, sub: <Delta today={parseFloat(viralCoeff)} yesterday={parseFloat(viralCoeffYday)} /> },
            { label: "Avg Score", value: scoreAvg, sub: <span className="text-xs text-slate-500">out of 100</span> },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="mt-1.5 text-3xl font-black tracking-tight text-white">{value}</p>
              <div className="mt-1">{sub}</div>
            </div>
          ))}
        </div>

        {/* Funnel */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Conversion Funnel</p>
          <div className="flex items-center gap-2">
            {funnelSteps.map((step, i) => {
              const prev = i > 0 ? funnelSteps[i - 1].value : step.value;
              const convPct = prev > 0 ? Math.round((step.value / prev) * 100) : 100;
              const widthPct = funnelSteps[0].value > 0 ? Math.round((step.value / funnelSteps[0].value) * 100) : 0;
              return (
                <div key={step.label} className="flex flex-1 items-center gap-2">
                  {i > 0 && (
                    <div className="shrink-0 text-center">
                      <p className="text-[10px] font-bold text-slate-500">{convPct}%</p>
                      <p className="text-slate-700">→</p>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col items-center">
                    <div
                      className="mb-2 flex w-full items-center justify-center rounded-md bg-teal-500/10 ring-1 ring-teal-500/20 transition-all"
                      style={{ height: `${Math.max(32, widthPct * 0.64)}px` }}
                    >
                      <span className="text-sm font-black text-teal-400">{step.value}</span>
                    </div>
                    <p className="text-center text-[10px] leading-tight text-slate-500">{step.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart + Table Row */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">

          {/* Line chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Daily Analyses — Last 14 Days</p>
            <div className="mt-4">
              <SparkLine data={days.map((d) => d.count)} max={maxDayCount} />
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-[10px] text-slate-600">{dayLabel(days[0].date)}</span>
              <span className="text-[10px] text-slate-600">{dayLabel(days[days.length - 1].date)}</span>
            </div>
          </div>

          {/* Recent table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Recent Analyses</p>
            <div className="space-y-2">
              {recent.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-black text-teal-400">
                    {r.score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-200">{r.role}</p>
                    <p className="text-[10px] text-slate-500">{r.industry} · {r.timeAgo}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${r.unlocked ? "bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20" : "bg-slate-800 text-slate-500"}`}>
                    {r.unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Top Target Roles</p>
            {topRoles.length > 0
              ? topRoles.map(([role, count]) => <BarRow key={role} label={role} value={count} max={maxRole} />)
              : <p className="text-xs text-slate-600">No data yet</p>
            }
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Top Industries</p>
            {topIndustries.length > 0
              ? topIndustries.map(([ind, count]) => <BarRow key={ind} label={ind} value={count} max={maxIndustry} />)
              : <p className="text-xs text-slate-600">No data yet</p>
            }
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-700">
          Visitor data via GA4 · Analyses & invites via Supabase · Refreshes on page load
        </p>
      </div>
    </main>
  );
}
