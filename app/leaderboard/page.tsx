"use client";

import Image from "next/image";
import { Trophy, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/Modal";
import { useLeaderboardStore } from "@/lib/store";
import type { LeaderboardEntry } from "@/lib/types";

const filterOptions = {
  goal: ["", "Recruiting", "Fundraising", "Hiring", "Personal Brand", "Job Search"],
  geography: ["", "India", "US", "Other"],
  seniority: ["", "Entry level", "Mid level", "Senior", "Executive", "Student"]
};

export default function LeaderboardPage() {
  const filters = useLeaderboardStore((state) => state.filters);
  const setFilters = useLeaderboardStore((state) => state.setFilters);
  const data = useLeaderboardStore((state) => state.data);
  const setData = useLeaderboardStore((state) => state.setData);
  const userRank = useLeaderboardStore((state) => state.userRank);
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);
  const [optedIn, setOptedIn] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    fetch(`/api/leaderboard?${params.toString()}`)
      .then((response) => response.json())
      .then((payload) => setData(payload.entries, payload.userRank))
      .catch(() => setData([]));
  }, [filters, setData]);

  return (
    <main className="safe-bottom min-h-dvh bg-slate-50">
      <div className="mx-auto max-w-md">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-teal-600" />
            <h1 className="text-xl font-black text-slate-950">Leaderboard</h1>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Select value={filters.goal} onChange={(event) => setFilters({ goal: event.target.value })}>
              {filterOptions.goal.map((item) => (
                <option key={item} value={item}>
                  {item || "Goal: All"}
                </option>
              ))}
            </Select>
            <Select value={filters.geography} onChange={(event) => setFilters({ geography: event.target.value })}>
              {filterOptions.geography.map((item) => (
                <option key={item} value={item}>
                  {item || "Geography: All"}
                </option>
              ))}
            </Select>
            <Select value={filters.seniority} onChange={(event) => setFilters({ seniority: event.target.value })}>
              {filterOptions.seniority.map((item) => (
                <option key={item} value={item}>
                  {item || "Seniority: All"}
                </option>
              ))}
            </Select>
          </div>
        </header>

        <div className="px-4 py-5">
          {optedIn ? (
            <Badge tone="teal" className="sticky top-[214px] z-10 mb-4 shadow-sm">
              Your Rank: #{userRank || 23}
            </Badge>
          ) : (
            <Card className="mb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-slate-950">Add Your Profile to Leaderboard?</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Public ranking helps compare your score by goal and market.</p>
                </div>
                <Button fullWidth={false} className="h-10 min-h-10 px-4" onClick={() => setOptedIn(true)}>
                  Add
                </Button>
              </div>
            </Card>
          )}

          <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            {data.map((entry) => (
              <button key={entry.id} className="flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left last:border-b-0" onClick={() => setSelected(entry)}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-600">{entry.rank}</span>
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
                  {entry.profilePhotoUrl ? <Image src={entry.profilePhotoUrl} alt={entry.name} width={40} height={40} className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-950">{entry.name}</span>
                  <span className="line-clamp-1 text-xs text-slate-500">{entry.headline}</span>
                </span>
                <span className="text-right text-lg font-black leading-none text-teal-700">
                  {entry.overallScore}
                  <span className="block text-[10px] font-bold text-slate-400">/100</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomSheet open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name}>
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">{selected.headline}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Badge tone="teal" className="justify-center">{selected.goal}</Badge>
              <Badge tone="blue" className="justify-center">{selected.geography}</Badge>
              <Badge tone="gray" className="justify-center">{selected.seniority}</Badge>
            </div>
            <Card className="bg-slate-50">
              <p className="text-sm font-bold text-slate-950">Anonymized snapshot</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Strong profile clarity with room to improve proof density and audience specific positioning.</p>
            </Card>
          </div>
        ) : null}
      </BottomSheet>
    </main>
  );
}
