"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

interface DashboardData {
  analyses: number;
  inviteRate: number;
  viralCoeff: number;
  invitesSent: number;
  unlocked: number;
  uniqueViewersToday: number | null;
  funnel: Array<{ label: string; value: number }>;
  recent: Array<{ name: string; role: string; industry: string; sourcePlatform: string; score: number; unlocked: boolean; timeIST: string }>;
  topRoles: Array<[string, number]>;
  topIndustries: Array<[string, number]>;
  topVisitorPlaces: Array<[string, number]>;
  topVisitorPlatforms: Array<[string, number]>;
  date: string;
  isToday: boolean;
  updatedAt: string;
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

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// Today in IST as YYYY-MM-DD
function todayIST() {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayIST);
  const [lastUpdated, setLastUpdated] = useState("");
  const [pulse, setPulse] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  async function fetchData(date: string) {
    try {
      const res = await fetch(`/api/dashboard?date=${date}`);
      if (!res.ok) return;
      const json: DashboardData = await res.json();
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    } catch { /* silent */ }
  }

  useEffect(() => {
    void fetchData(selectedDate);
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Only auto-refresh when viewing today
    if (selectedDate === todayIST()) {
      intervalRef.current = setInterval(() => void fetchData(selectedDate), 5 * 60_000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selectedDate]);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) {
      setSelectedDate(e.target.value);
      setShowPicker(false);
    }
  }

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

  const isToday = selectedDate === todayIST();

  return (
    <main className="min-h-screen w-full bg-[#0f172a] px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 lg:mb-8">
        <div>
          <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">iHeartLinkedIn</h1>
          <p className="mt-0.5 text-xs text-slate-500">{formatDisplayDate(data.date)}</p>
        </div>
        <div className="flex items-center gap-3">
          {isToday && (
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full bg-teal-500 transition-all duration-300 ${pulse ? "scale-150 opacity-100" : "opacity-60"}`} />
              <span className="text-[11px] text-slate-500">{lastUpdated}</span>
            </div>
          )}

          {/* Date picker */}
          <div className="relative">
            <button
              onClick={() => { setShowPicker((v) => !v); setTimeout(() => pickerRef.current?.showPicker?.(), 50); }}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-teal-500/50 hover:text-white"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {isToday ? "Today" : data.date}
            </button>
            <input
              ref={pickerRef}
              type="date"
              value={selectedDate}
              max={todayIST()}
              onChange={handleDateChange}
              className="absolute right-0 top-8 opacity-0 pointer-events-none"
              style={{ width: 1, height: 1 }}
            />
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:mb-6 lg:grid-cols-4 lg:gap-4">
        <Stat label="Analyses" value={data.analyses} />
        <Stat label="Invites Sent" value={data.invitesSent} sub={<span className="text-[11px] text-slate-500">{pct(data.invitesSent, data.analyses)} of users</span>} />
        <Stat label="Unlocked" value={data.unlocked} sub={<span className="text-[11px] text-slate-500">{pct(data.unlocked, data.analyses)} of users</span>} />
        <Stat
          label={isToday ? "Unique Viewers Today" : "Unique Viewers"}
          value={data.uniqueViewersToday !== null ? data.uniqueViewersToday : "—"}
          sub={data.uniqueViewersToday === null ? <span className="text-[11px] text-slate-600">Connect analytics</span> : undefined}
        />
      </div>

      {/* Funnel */}
      <div className={`${CARD} mb-4 p-4 lg:mb-6 lg:p-5`}>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Funnel</p>

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

      {/* Analyses list — full width */}
      <div className={`${CARD} mb-4 p-4 lg:mb-6 lg:p-5`}>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">
          Analyses{" "}
          {data.analyses > 0 && <span className="text-teal-500">{data.analyses}</span>}
        </p>
        {data.recent.length === 0 ? (
          <p className="text-xs text-slate-600">No analyses on this date</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.recent.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-800">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-black text-teal-400">
                  {r.score}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-100">{r.name}</p>
                  <p className="truncate text-[10px] font-medium text-slate-400">{r.role}</p>
                  <p className="truncate text-[10px] text-slate-600">{r.industry} · {r.sourcePlatform}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-semibold text-slate-400">{r.timeIST}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${r.unlocked ? "bg-teal-500/10 text-teal-400" : "bg-slate-800 text-slate-600"}`}>
                    {r.unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bar Charts */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Top Roles</p>
          {data.topRoles.length > 0
            ? data.topRoles.map(([role, count]) => <BarRow key={role} label={role} value={count} max={data.topRoles[0][1]} />)
            : <p className="text-xs text-slate-600">No data</p>}
        </div>
        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Top Industries</p>
          {data.topIndustries.length > 0
            ? data.topIndustries.map(([ind, count]) => <BarRow key={ind} label={ind} value={count} max={data.topIndustries[0][1]} />)
            : <p className="text-xs text-slate-600">No data</p>}
        </div>
        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Top Unique Visitor Platforms</p>
          {data.topVisitorPlatforms.length > 0
            ? data.topVisitorPlatforms.map(([platform, count]) => <BarRow key={platform} label={platform} value={count} max={data.topVisitorPlatforms[0][1]} />)
            : <p className="text-xs text-slate-600">No source data yet</p>}
        </div>
        <div className={`${CARD} p-4 lg:p-5`}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:text-xs">Top Visitor Places</p>
          {data.topVisitorPlaces.length > 0
            ? data.topVisitorPlaces.map(([place, count]) => <BarRow key={place} label={place} value={count} max={data.topVisitorPlaces[0][1]} />)
            : <p className="text-xs text-slate-600">No GA4 location data</p>}
        </div>
      </div>

      <p className="mt-6 text-center text-[10px] text-slate-700">
        {isToday ? "Auto-refreshes every 5 min · " : ""}All times in IST
      </p>
    </main>
  );
}
