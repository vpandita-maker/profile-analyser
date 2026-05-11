"use client";

import { ChevronLeft, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loading } from "@/components/Loading";
import { normalizeAnalysis } from "@/lib/analysis";
import { useAnalyzerStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  linkedin_id: string;
  name: string;
  headline: string;
  profile_photo_url: string;
  overall_score: number;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: number | null;
  total: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const storedAnalysis = useAnalyzerStore((state) => state.analysis);
  const analysis = normalizeAnalysis(storedAnalysis);
  const profile = useAnalyzerStore((state) => state.linkedinData);
  const contextAnswers = useAnalyzerStore((state) => state.contextAnswers);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!analysis) {
      router.replace("/");
      return;
    }

    const params = new URLSearchParams({
      goal: contextAnswers.goal || "Job Search",
      industry: contextAnswers.industry || "",
      linkedinId: profile?.linkedinId || ""
    });

    fetch(`/api/leaderboard?${params.toString()}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ entries: [], userRank: null, total: 0 }))
      .finally(() => setLoading(false));
  }, [analysis, contextAnswers, profile, router]);

  if (loading) return <Loading label="Loading leaderboard" />;
  if (!data || !analysis) return null;

  const { entries, userRank, total } = data;
  const userLinkedinId = profile?.linkedinId;
  const goal = contextAnswers.goal || "Job Search";
  const industry = contextAnswers.industry;
  const industryLabel = industry && industry !== "Other" ? ` in ${industry}` : "";
  const categoryLabel = goal === "Internship Search" ? "Intern Seekers" : "Job Seekers";

  const rankColor = (index: number) => {
    if (index === 0) return "text-amber-500";
    if (index === 1) return "text-slate-400";
    if (index === 2) return "text-orange-400";
    return "text-slate-300";
  };

  return (
    <main className="app-screen safe-bottom">
      <div className="app-container">
        <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="px-4 py-2">
            <button
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-x-0.5 hover:text-slate-950"
              onClick={() => router.push("/results")}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              Overview
            </button>
          </div>
        </div>

        <div className="space-y-4 py-5">
          <section className="rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 p-5 text-white shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-teal-200" />
              <span className="text-sm font-bold text-teal-100">Your Ranking</span>
            </div>
            {userRank !== null ? (
              <>
                <p className="text-5xl font-black">#{userRank}</p>
                <p className="mt-1 text-sm text-teal-100">
                  out of {total} {categoryLabel}{industryLabel}
                </p>
              </>
            ) : (
              <p className="mt-1 text-lg font-bold">You&apos;re on the board — check back as more profiles are added.</p>
            )}
            <div className="mt-4">
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                Your score: {analysis.overallScore}
              </span>
            </div>
          </section>

          <div>
            <h2 className="mb-3 text-lg font-black text-slate-950">Top Profiles</h2>
            {entries.length === 0 ? (
              <div className="rounded-lg bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                No other profiles in your category yet — you&apos;re the first!
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry, index) => {
                  const isCurrentUser = entry.linkedin_id === userLinkedinId;
                  return (
                    <div
                      key={entry.linkedin_id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-3 ring-1 transition-all duration-200",
                        isCurrentUser ? "bg-teal-50 ring-teal-200 shadow-sm" : "bg-white ring-slate-200"
                      )}
                    >
                      <span className={cn("w-7 shrink-0 text-center text-sm font-black", rankColor(index))}>
                        #{index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-bold", isCurrentUser ? "text-teal-900" : "text-slate-950")}>
                          {entry.name}
                          {isCurrentUser && <span className="ml-1 text-xs font-normal text-teal-600">(you)</span>}
                        </p>
                        {entry.headline ? (
                          <p className="truncate text-xs text-slate-500">{entry.headline}</p>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-lg font-black",
                          entry.overall_score >= 80
                            ? "text-emerald-600"
                            : entry.overall_score >= 60
                              ? "text-amber-600"
                              : "text-red-500"
                        )}
                      >
                        {entry.overall_score}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
