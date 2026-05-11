"use client";

import { ChevronLeft, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { StrengthCard } from "@/components/StrengthCard";
import { WeaknessCard } from "@/components/WeaknessCard";
import { Button } from "@/components/ui/Button";
import { ScoreBadge } from "@/components/ui/Badge";
import { normalizeAnalysis } from "@/lib/analysis";
import { useAnalyzerStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ResultsPage() {
  const router = useRouter();
  const storedAnalysis = useAnalyzerStore((state) => state.analysis);
  const analysis = normalizeAnalysis(storedAnalysis);
  const previousScore = useAnalyzerStore((state) => state.previousScore);
  const scoreDelta = previousScore !== null && analysis ? analysis.overallScore - previousScore : null;

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
          {scoreDelta !== null && scoreDelta !== 0 && (
            <div
              className={cn(
                "mb-4 rounded-lg px-4 py-3 text-sm font-bold",
                scoreDelta > 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
              )}
            >
              {scoreDelta > 0 ? "↑" : "↓"} Score {scoreDelta > 0 ? "improved" : "changed"} from {previousScore} → {analysis.overallScore} ({scoreDelta > 0 ? "+" : ""}{scoreDelta} pts) since your last analysis
            </div>
          )}

          <section className="mb-6 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-500">Overall score out of 100</p>
              <h1 className="mt-1 text-2xl font-black text-slate-950">Profile analysis</h1>
            </div>
            <ScoreBadge score={analysis.overallScore} />
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
