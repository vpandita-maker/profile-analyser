"use client";

import { ChevronLeft, ChevronRight, Linkedin, RefreshCw, Sparkles, Trophy, Twitter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StrengthCard } from "@/components/StrengthCard";
import { WeaknessCard } from "@/components/WeaknessCard";
import { Button } from "@/components/ui/Button";
import { ScoreBadge } from "@/components/ui/Badge";
import { normalizeAnalysis } from "@/lib/analysis";
import { useAnalyzerStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const IST = "Asia/Kolkata";

function formatHistoryDate(iso: string) {
  const d = new Date(iso);
  const day = parseInt(d.toLocaleDateString("en-US", { timeZone: IST, day: "numeric" }), 10);
  const tens = Math.floor(day / 10);
  const ones = day % 10;
  const suffix = tens === 1 ? "th" : ones === 1 ? "st" : ones === 2 ? "nd" : ones === 3 ? "rd" : "th";
  const month = d.toLocaleDateString("en-US", { timeZone: IST, month: "long" });
  const year = parseInt(d.toLocaleDateString("en-US", { timeZone: IST, year: "numeric" }), 10);
  return `${day}${suffix} ${month} ${year}`;
}

function scoreLabel(score: number): { label: string; className: string } {
  if (score >= 91) return { label: "Recruiters are already looking at you!", className: "text-teal-700 bg-teal-50" };
  if (score >= 76) return { label: "Strong profile, keep fine-tuning it!", className: "text-emerald-700 bg-emerald-50" };
  if (score >= 61) return { label: "Good score, room to grow!", className: "text-amber-700 bg-amber-50" };
  if (score >= 35) return { label: "Solid start, big gains ahead!", className: "text-orange-600 bg-orange-50" };
  return { label: "Your profile needs some work!", className: "text-rose-600 bg-rose-50" };
}

const PROGRESS_VISIBLE = 3;
const APP_URL = "https://iheartlinkedin.vercel.app";

export default function ResultsPage() {
  const router = useRouter();
  const storedAnalysis = useAnalyzerStore((state) => state.analysis);
  const analysis = normalizeAnalysis(storedAnalysis);
  const scoreHistory = useAnalyzerStore((state) => state.scoreHistory);
  const [progressStart, setProgressStart] = useState(
    () => Math.max(0, scoreHistory.length - PROGRESS_VISIBLE)
  );

  if (!analysis) {
    return (
      <main className="app-screen grid place-items-center px-4">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-sm text-slate-600">No analysis found on this device.</p>
          <Button onClick={() => router.push("/")}>Start Analysis</Button>
        </div>
      </main>
    );
  }

  const { label: sLabel, className: sClass } = scoreLabel(analysis.overallScore);
  const isGoodScore = analysis.overallScore >= 61;
  const shareText = `I just scored ${analysis.overallScore}/100 on iHeartLinkedIn! Get your free LinkedIn profile review →`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(APP_URL)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(APP_URL)}`;

  return (
    <main className="app-screen safe-bottom">
      <div className="app-container">
        <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-x-0.5 hover:text-slate-950"
              onClick={() => router.push("/")}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              Home
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-black text-white transition-all duration-200 hover:bg-teal-700 hover:shadow-md active:scale-[0.97]"
              onClick={() => router.push("/")}
              type="button"
            >
              <RefreshCw className="h-3 w-3" />
              Analyze Again
            </button>
          </div>
        </div>

        <div className="py-2">
          {scoreHistory.length >= 1 && (() => {
            const canPrev = progressStart > 0;
            const canNext = progressStart + PROGRESS_VISIBLE < scoreHistory.length;
            const visible = scoreHistory.slice(progressStart, progressStart + PROGRESS_VISIBLE);
            return (
              <section className="mb-6 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200" id="progress">
                <p className="mb-4 text-sm font-black text-slate-950">Your Progress</p>
                <div className="flex items-center">
                  <button
                    className={cn("shrink-0 rounded-full p-1 transition-colors hover:bg-slate-100", !canPrev && "invisible")}
                    disabled={!canPrev}
                    onClick={() => setProgressStart((s) => s - 1)}
                    type="button"
                  >
                    <ChevronLeft className="h-5 w-5 text-slate-500" />
                  </button>

                  <div className="flex flex-1 items-center justify-evenly">
                    {visible.map((entry, relIdx) => {
                      const absIdx = progressStart + relIdx;
                      const isCurrent = absIdx === scoreHistory.length - 1;
                      const prevEntry = absIdx > 0 ? scoreHistory[absIdx - 1] : null;
                      const delta = prevEntry ? entry.score - prevEntry.score : null;
                      return (
                        <div key={entry.date} className="flex items-center gap-3">
                          {relIdx > 0 && (
                            <span className={cn(
                              "text-base font-bold",
                              delta && delta > 0 ? "text-emerald-500" : delta && delta < 0 ? "text-red-400" : "text-slate-300"
                            )}>
                              {delta && delta > 0 ? "↗" : delta && delta < 0 ? "↘" : "→"}
                            </span>
                          )}
                          <div className="flex flex-col items-center gap-1.5">
                            <div className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-full text-sm font-black",
                              isCurrent ? "bg-teal-600 text-white shadow-md" : "bg-slate-100 text-slate-600"
                            )}>
                              {entry.score}
                            </div>
                            <span className="w-20 text-center text-[10px] leading-tight text-slate-400">
                              {formatHistoryDate(entry.date)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    className={cn("shrink-0 rounded-full p-1 transition-colors hover:bg-slate-100", !canNext && "invisible")}
                    disabled={!canNext}
                    onClick={() => setProgressStart((s) => s + 1)}
                    type="button"
                  >
                    <ChevronRight className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </section>
            );
          })()}

          <section className="mb-6 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Overall score out of 100</p>
                <h1 className="mt-1 text-2xl font-black text-slate-950">Profile analysis</h1>
                <span className={cn("mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-black", sClass)}>
                  {sLabel}
                </span>
              </div>
              <ScoreBadge score={analysis.overallScore} />
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="mb-2.5 text-xs font-black uppercase tracking-wide text-slate-400">Share your score</p>
                <div className="flex gap-3">
                  <a
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1D9BF0] px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-[#1a8cd8] hover:shadow-md active:scale-[0.98]"
                    href={twitterUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                  <a
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-[#004182] hover:shadow-md active:scale-[0.98]"
                    href={linkedinUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                </div>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-lg font-black text-slate-950">What&apos;s Working</h2>
            <div className="space-y-3">
              {analysis.strengths.map((item) => (
                <StrengthCard key={item.title} item={item} />
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-lg font-black text-slate-950">What&apos;s Holding You Back</h2>
            <div className="space-y-3">
              {analysis.weaknesses.map((item) => (
                <WeaknessCard key={item.title} item={item} />
              ))}
            </div>
          </section>

          <div className="space-y-3">
            <Button onClick={() => router.push("/results/unlocked")}>
              <Sparkles className="h-4 w-4" />
              Check Your Solutions
            </Button>
            <Button variant="secondary" onClick={() => router.push("/results/leaderboard")}>
              <Trophy className="h-4 w-4" />
              See How You Rank
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
