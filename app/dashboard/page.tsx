"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface DashboardData {
  analyses: number;
  inviteRate: number;
  viralCoeff: number;
  invitesSent: number;
  unlocked: number;
  visitorsToday: number | null;
  funnel: Array<{ label: string; value: number }>;
  hours: Array<{ hour: string; count: number }>;
  recent: Array<{ role: string; industry: string; score: number; unlocked: boolean; timeAgo: string }>;
  topRoles: Array<[string, number]>;
  topIndustries: Array<[string, number]>;
  date: string;
  updatedAt: string;
}

function HourChart({ hours }: { hours: Array<{ hour: string; count: number }> }) {
  if (!hours.length) return <p className="text-xs text-slate-600">No activity yet today</p>;
  const max = Math.max(...hours.map((h) => h.count), 1);
  const W = 400; const H = 72; const pad = 6;
  const pts = hours.map((h, i) => [
    pad + (i / Math.max(hours.length - 1, 1)) * (W - pad * 2),
    H - pad - (h.count / max) * (H - pad * 2),
  ] as [number, number]);
  const linePath = `M ${pts.map(([x, y]) => `${x},${y}`).join(" L ")}`;
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]},${H - pad} L ${pts[0][0]},${H - pad} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72 }}>
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#hg)" />
        <path d={linePath} fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => hours[i].count > 0 ? <circle key={i} cx={x} cy={y} r="3" fill="#14b8a6" /> : null)}
      </svg>
      <div className="mt-1.5 flex justify-between">
        <span className="text-[10px] text-slate-600">{hours[0].hour}</span>
        <span className="text-[10px] text-slate-600">{hours[hours.length - 1].hour}</span>
      </div>
    </div>
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

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 transition-transform duration-200 hover:scale-[1.02] sm:p-4">
      <p className="text-[11px] font-medium text-slate-500 sm:text-xs">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-white sm:mt-1.5 sm:text-3xl">{value}</p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  );
}

function pct(n: number, d: number) {
  return d > 0 ? `${Math.round((n / d) * 100)}%` : "—";
}

const CARD = "rounded-xl border border-slate-800 bg-slate-900 transition-transform duration-200 hover:scale-[1.02] cursor-default";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
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
    intervalRef.current = setInterval(() => void fetchData(), 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-teal-500" />
          <p className="text-xs text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#0f172a] px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 lg:mb-8">
        <div>
          <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">iHeartLinkedIn</h1>
          <p className="mt-0.5 text-xs text-slate-500">{formatDate(data.date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full bg-teal-500 transition-all duration-300 ${pulse ? "scale-150 opacity-100" : "opacity-60"}`} />
            <span className="text-[11px] text-slate-500">{lastUpdated ? `${lastUpdated}` : "Updating..."}</span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:mb-6 lg:grid-cols-4 lg:gap-4">
        <Stat label="Analyses Today" value={data.analyses} />
        <Stat label="Invites Sent" value={data.invitesSent} sub={<span className="text-[11px] text-slate-500">{pct(data.invitesSent, data.analyses)} of users</span>} />
        <Stat label="Unlocked" value={data.unlocked} sub={<span className="text-[11px] text-slate-500">{pct(data.unlocked, data.analyses)} of users</span>} />
        <Stat
          label="Visitors Today"
          value={data.visitorsToday !== null ? data.visitorsToday : "—"}
          sub={data.visitorsToday === null ? <span className="text-[11px] text-slate-600">Connect GA4</span> : undefined}
        />
      </div>

      {/* Funnel */}
      <div className={`${CARD} mb-4 p-4 lg:mb-6 lg:p-5`}>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Today&apos;s Funnel</p>

        {/* Mobile */}
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

        {/* Desktop */}
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

      {/* Hourly chart + Recent */}
      <div className="mb-4 grid gap-4 lg:mb-6 lg:grid-cols-2">
        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Activity by Hour (IST)</p>
          <HourChart hours={data.hours} />
        </div>

        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">
            Today&apos;s Analyses {data.analyses > 0 && <span className="ml-1 text-teal-500">{data.analyses}</span>}
          </p>
          {data.recent.length === 0 ? (
            <p className="text-xs text-slate-600">No analyses yet today</p>
          ) : (
            <div className="space-y-2.5">
              {data.recent.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-slate-800">
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
          )}
        </div>
      </div>

      {/* Bar Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Roles Today</p>
          {data.topRoles.length > 0
            ? data.topRoles.map(([role, count]) => <BarRow key={role} label={role} value={count} max={data.topRoles[0][1]} />)
            : <p className="text-xs text-slate-600">No data yet</p>}
        </div>
        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Industries Today</p>
          {data.topIndustries.length > 0
            ? data.topIndustries.map(([ind, count]) => <BarRow key={ind} label={ind} value={count} max={data.topIndustries[0][1]} />)
            : <p className="text-xs text-slate-600">No data yet</p>}
        </div>
      </div>

      <p className="mt-6 text-center text-[10px] text-slate-700">
        Auto-refreshes every 30s · Today&apos;s data only
      </p>
    </main>
  );
}
