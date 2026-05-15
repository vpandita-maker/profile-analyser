"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface DashboardData {
  totalAnalyses: number;
  analysesToday: number;
  analysesYesterday: number;
  inviteRate: number;
  inviteRateYday: number;
  viralCoeff: number;
  viralCoeffYday: number;
  visitorsToday: number | null;
  visitorsYesterday: number | null;
  funnel: Array<{ label: string; value: number }>;
  days: Array<{ date: string; count: number }>;
  recent: Array<{ role: string; industry: string; score: number; unlocked: boolean; timeAgo: string }>;
  topRoles: Array<[string, number]>;
  topIndustries: Array<[string, number]>;
  updatedAt: string;
}

function SparkLine({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const W = 400; const H = 72; const pad = 6;
  const pts = data.map((v, i) => [
    pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2),
    H - pad - (v / max) * (H - pad * 2),
  ] as [number, number]);
  const linePath = `M ${pts.map(([x, y]) => `${x},${y}`).join(" L ")}`;
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]},${H - pad} L ${pts[0][0]},${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72 }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#lg)" />
      <path d={linePath} fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => data[i] > 0 ? <circle key={i} cx={x} cy={y} r="2.5" fill="#14b8a6" /> : null)}
    </svg>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 shrink-0 truncate text-xs text-slate-400 sm:w-40">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-slate-800" style={{ height: 6 }}>
        <div className="h-full rounded-full bg-teal-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 shrink-0 text-right text-xs font-bold text-slate-300">{value}</span>
    </div>
  );
}

function Delta({ today, yesterday }: { today: number; yesterday: number }) {
  if (yesterday === 0 && today === 0) return <span className="text-[11px] text-slate-600">No data yet</span>;
  const diff = today - yesterday;
  const pct = yesterday > 0 ? Math.round(Math.abs(diff / yesterday) * 100) : null;
  const label = pct !== null ? `${pct}% vs yesterday` : `+${today} today`;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400"><TrendingUp className="h-3 w-3" />{label}</span>;
  if (diff < 0) return <span className="flex items-center gap-0.5 text-[11px] font-semibold text-red-400"><TrendingDown className="h-3 w-3" />{label}</span>;
  return <span className="text-[11px] text-slate-600">Same as yesterday</span>;
}

const CARD = "rounded-xl border border-slate-800 bg-slate-900 transition-transform duration-200 hover:scale-[1.02] cursor-default";
const REFRESH_MS = 30_000;

function dayLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [pulse, setPulse] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) return;
      const json: DashboardData = await res.json();
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    } catch { /* silent */ }
  }

  useEffect(() => {
    void fetchData();
    intervalRef.current = setInterval(() => void fetchData(), REFRESH_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-teal-500" />
          <p className="text-xs text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Total Analyses", value: data.totalAnalyses, sub: <Delta today={data.analysesToday} yesterday={data.analysesYesterday} /> },
    { label: "Invite Send Rate", value: `${data.inviteRate}%`, sub: <Delta today={data.inviteRate} yesterday={data.inviteRateYday} /> },
    { label: "Viral Coefficient", value: data.viralCoeff.toFixed(2), sub: <Delta today={data.viralCoeff} yesterday={data.viralCoeffYday} /> },
    {
      label: "Visitors Today",
      value: data.visitorsToday !== null ? data.visitorsToday : "—",
      sub: data.visitorsToday !== null
        ? <Delta today={data.visitorsToday} yesterday={data.visitorsYesterday ?? 0} />
        : <span className="text-[11px] text-slate-600">Connect GA4</span>,
    },
  ];

  return (
    <main className="min-h-screen w-full bg-[#0f172a] px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 lg:mb-8">
        <div>
          <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">iHeartLinkedIn</h1>
          <p className="mt-0.5 text-xs text-slate-500">Founder Dashboard · Live data</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full bg-teal-500 transition-all duration-300 ${pulse ? "scale-150 opacity-100" : "opacity-60"}`} />
            <span className="text-[11px] text-slate-500">
              {lastUpdated ? `Updated ${lastUpdated}` : "Updating..."}
            </span>
          </div>
          <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 ring-1 ring-teal-500/20">
            {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:mb-6 lg:grid-cols-4 lg:gap-4">
        {kpis.map(({ label, value, sub }) => (
          <div key={label} className={`${CARD} p-3 sm:p-4`}>
            <p className="text-[11px] font-medium text-slate-500 sm:text-xs">{label}</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-white sm:mt-1.5 sm:text-3xl">{value}</p>
            <div className="mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className={`${CARD} mb-4 p-4 lg:mb-6 lg:p-5`}>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Conversion Funnel</p>

        {/* Mobile: vertical */}
        <div className="flex flex-col gap-2 md:hidden">
          {data.funnel.map((step, i) => {
            const prev = i > 0 ? data.funnel[i - 1].value : step.value;
            const convPct = prev > 0 ? Math.round((step.value / prev) * 100) : 100;
            const widthPct = data.funnel[0].value > 0 ? Math.round((step.value / data.funnel[0].value) * 100) : 0;
            return (
              <div key={step.label}>
                {i > 0 && <p className="mb-1 pl-4 text-[10px] font-bold text-slate-600">{convPct}% continued</p>}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 ring-1 ring-teal-500/20">
                    <span className="text-sm font-black text-teal-400">{step.value}</span>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">{step.label}</span>
                      <span className="text-[10px] text-slate-500">{widthPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-teal-500/60 transition-all duration-500" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: horizontal */}
        <div className="hidden items-end gap-2 md:flex">
          {data.funnel.map((step, i) => {
            const prev = i > 0 ? data.funnel[i - 1].value : step.value;
            const convPct = prev > 0 ? Math.round((step.value / prev) * 100) : 100;
            const widthPct = data.funnel[0].value > 0 ? Math.round((step.value / data.funnel[0].value) * 100) : 0;
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
                    className="mb-2 flex w-full items-center justify-center rounded-md bg-teal-500/10 ring-1 ring-teal-500/20 transition-all duration-500"
                    style={{ height: `${Math.max(32, widthPct * 0.72)}px` }}
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

      {/* Chart + Table */}
      <div className="mb-4 grid gap-4 lg:mb-6 lg:grid-cols-2">
        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Daily Analyses — Last 14 Days</p>
          <SparkLine data={data.days.map((d) => d.count)} />
          <div className="mt-2 flex justify-between">
            <span className="text-[10px] text-slate-600">{data.days[0] ? dayLabel(data.days[0].date) : ""}</span>
            <span className="text-[10px] text-slate-600">{data.days[data.days.length - 1] ? dayLabel(data.days[data.days.length - 1].date) : ""}</span>
          </div>
        </div>

        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Recent Analyses</p>
          <div className="space-y-2.5">
            {data.recent.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-1.5 transition-colors duration-150 hover:bg-slate-800">
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

      {/* Bar Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Top Target Roles</p>
          {data.topRoles.length > 0
            ? data.topRoles.map(([role, count]) => <BarRow key={role} label={role} value={count} max={data.topRoles[0][1]} />)
            : <p className="text-xs text-slate-600">No data yet</p>}
        </div>
        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Top Industries</p>
          {data.topIndustries.length > 0
            ? data.topIndustries.map(([ind, count]) => <BarRow key={ind} label={ind} value={count} max={data.topIndustries[0][1]} />)
            : <p className="text-xs text-slate-600">No data yet</p>}
        </div>
      </div>

      <p className="mt-6 text-center text-[10px] text-slate-700">
        Auto-refreshes every 30s · Visitor data via GA4 · Analyses &amp; invites via Supabase
      </p>
    </main>
  );
}
