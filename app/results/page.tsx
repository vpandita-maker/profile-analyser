"use client";

import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { analytics } from "@/lib/analytics";
import { ShareFooter } from "@/components/ShareFooter";
import { ShareUnlockCard } from "@/components/ShareUnlockCard";
import { FixCard } from "@/components/FixCard";
import { StrengthCard } from "@/components/StrengthCard";
import { WeaknessCard } from "@/components/WeaknessCard";
import { Button } from "@/components/ui/Button";
import { ScoreBadge } from "@/components/ui/Badge";
import { normalizeAnalysis } from "@/lib/analysis";
import { useAnalyzerStore, useStoreHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function ordinal(day: number) {
  const tens = Math.floor(day / 10);
  const ones = day % 10;
  const suffix = tens === 1 ? "th" : ones === 1 ? "st" : ones === 2 ? "nd" : ones === 3 ? "rd" : "th";
  return `${day}${suffix}`;
}

function formatHistoryDate(dateStr: string) {
  // New format: "YYYY-MM-DD" stored in local timezone — parse directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return `${ordinal(day)} ${MONTHS[month - 1]} ${year}`;
  }
  // Legacy: ISO string stored in UTC — use local Date methods
  const d = new Date(dateStr);
  return `${ordinal(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function scoreLabel(score: number): { label: string; className: string } {
  if (score >= 91) return { label: "Recruiters are already looking at you!", className: "text-teal-700 bg-teal-50" };
  if (score >= 76) return { label: "Strong profile, keep fine-tuning it!", className: "text-emerald-700 bg-emerald-50" };
  if (score >= 61) return { label: "Good score, room to grow!", className: "text-amber-700 bg-amber-50" };
  if (score >= 35) return { label: "Solid start, big gains ahead!", className: "text-orange-600 bg-orange-50" };
  return { label: "Your profile needs some work!", className: "text-rose-600 bg-rose-50" };
}

const PROGRESS_VISIBLE = 3;
export default function ResultsPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const storedAnalysis = useAnalyzerStore((state) => state.analysis);
  const analysis = normalizeAnalysis(storedAnalysis);
  const profile = useAnalyzerStore((state) => state.linkedinData);
  const contextAnswers = useAnalyzerStore((state) => state.contextAnswers);
  const scoreHistory = useAnalyzerStore((state) => state.scoreHistory);
  const setFullyUnlocked = useAnalyzerStore((state) => state.setFullyUnlocked);
  const [offsetFromEnd, setOffsetFromEnd] = useState(0);

  useEffect(() => {
    if (analysis) {
      analytics.analysisCompleted(analysis.overallScore, contextAnswers.targetRole, contextAnswers.industry);
    }
  }, [analysis, contextAnswers.targetRole, contextAnswers.industry]);

  if (!hydrated) {
    return <main className="app-screen grid place-items-center px-4" />;
  }

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
  const firstName = profile?.name?.split(" ")[0] || "Your";
  const freeFixes = analysis.topFixes.slice(0, 3);
  const lockedFixCount = analysis.secondaryFixes.slice(0, 3).length;

  return (
    <main className="flex h-dvh w-full flex-col bg-[#F3F2EF]">
      <div className="min-h-0 flex-1 overflow-y-auto">
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
            const progressStart = Math.max(0, scoreHistory.length - PROGRESS_VISIBLE - offsetFromEnd);
            const canPrev = progressStart > 0;
            const canNext = offsetFromEnd > 0;
            const visible = scoreHistory.slice(progressStart, progressStart + PROGRESS_VISIBLE);
            return (
              <section className="mb-6 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200" id="progress">
                <p className="mb-4 text-sm font-black text-slate-950">Your Progress</p>
                <div className="flex items-center">
                  <button
                    className={cn("shrink-0 rounded-full p-1 transition-colors", canPrev ? "hover:bg-slate-100" : "cursor-default opacity-20")}
                    disabled={!canPrev}
                    onClick={() => setOffsetFromEnd((o) => Math.min(o + 1, scoreHistory.length - PROGRESS_VISIBLE))}
                    type="button"
                  >
                    <ChevronLeft className="h-5 w-5 text-slate-500" />
                  </button>

                  <div className="flex flex-1 items-center">
                    {visible.map((entry, relIdx) => {
                      const absIdx = progressStart + relIdx;
                      const isCurrent = absIdx === scoreHistory.length - 1;
                      const prevEntry = absIdx > 0 ? scoreHistory[absIdx - 1] : null;
                      const delta = prevEntry ? entry.score - prevEntry.score : null;
                      return (
                        <Fragment key={entry.date}>
                          {relIdx > 0 && (
                            <span className={cn(
                              "shrink-0 px-1 text-sm font-bold",
                              delta && delta > 0 ? "text-emerald-500" : delta && delta < 0 ? "text-red-400" : "text-slate-300"
                            )}>
                              {delta && delta > 0 ? "↗" : delta && delta < 0 ? "↘" : "→"}
                            </span>
                          )}
                          <div className="flex flex-1 flex-col items-center gap-1.5">
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
                        </Fragment>
                      );
                    })}
                  </div>

                  <button
                    className={cn("shrink-0 rounded-full p-1 transition-colors", canNext ? "hover:bg-slate-100" : "cursor-default opacity-20")}
                    disabled={!canNext}
                    onClick={() => setOffsetFromEnd((o) => Math.max(0, o - 1))}
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
          </section>

          {analysis.personalDiagnosis ? (
            <section className="mb-6 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-teal-700">Recruiter readiness diagnosis</p>
              <h2 className="text-lg font-black text-slate-950">{firstName === "Your" ? "Your profile gap" : `${firstName}, here is the gap`}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{analysis.personalDiagnosis}</p>
            </section>
          ) : null}

          {freeFixes.length > 0 ? (
            <section className="mb-6">
              <h2 className="mb-3 text-lg font-black text-slate-950">Fix These First</h2>
              <div className="space-y-3">
                {freeFixes.map((fix, index) => (
                  <FixCard key={fix.title} fix={fix} defaultOpen={index === 0} />
                ))}
              </div>
            </section>
          ) : null}

          {lockedFixCount > 0 ? (
            <section className="mb-6">
              <ShareUnlockCard
                lockedCount={lockedFixCount}
                onUnlocked={() => {
                  setFullyUnlocked(true);
                  router.push("/results/unlocked?preparing=1");
                }}
              />
            </section>
          ) : (
            <div className="space-y-3 pb-4">
              <Button onClick={() => router.push("/results/unlocked")}>View All Fixes</Button>
            </div>
          )}

          <section className="mb-6">
            <h2 className="mb-3 text-lg font-black text-slate-950">Your Strongest Signals</h2>
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

          {lockedFixCount > 0 ? (
            <section className="mb-6">
              <ShareUnlockCard
                lockedCount={lockedFixCount}
                title="Liked the review?"
                description={`Share iHeartLinkedIn with a friend to unlock ${lockedFixCount} more fixes. If this helped you understand your profile, it can help them see what recruiters may be missing too.`}
                onUnlocked={() => {
                  setFullyUnlocked(true);
                  router.push("/results/unlocked?preparing=1");
                }}
              />
            </section>
          ) : null}
        </div>
      </div>
      </div>
      <ShareFooter onShared={() => router.push("/results/unlocked?preparing=1")} />
    </main>
  );
}
