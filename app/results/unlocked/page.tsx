"use client";

import { Share2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { FixCard } from "@/components/FixCard";
import { ProfileCard } from "@/components/ProfileCard";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAnalyzerStore } from "@/lib/store";

export default function UnlockedResultsPage() {
  const router = useRouter();
  const profile = useAnalyzerStore((state) => state.linkedinData);
  const analysis = useAnalyzerStore((state) => state.analysis);
  const isUnlocked = useAnalyzerStore((state) => state.isUnlocked);

  if (!analysis || !isUnlocked) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 px-4">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-sm text-slate-600">Personalized fixes are locked until you send an invite.</p>
          <Button onClick={() => router.push("/results")}>Back to Results</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="safe-bottom min-h-dvh bg-slate-50">
      <div className="mx-auto max-w-md">
        <ProfileCard profile={profile} />
        <div className="px-4 py-5">
          <section className="mb-5 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div>
              <Badge tone="teal">Fixes Unlocked</Badge>
              <h1 className="mt-2 text-2xl font-black text-slate-950">Your Personalized Fixes</h1>
              <p className="mt-1 text-xs font-semibold text-slate-500">Overall score out of 100</p>
            </div>
            <ScoreBadge score={analysis.overallScore} />
          </section>

          <div className="mb-5 space-y-3">
            {analysis.topFixes.map((fix, index) => (
              <FixCard key={fix.title} fix={fix} defaultOpen={index === 0} />
            ))}
          </div>

          <details className="mb-6 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <summary className="cursor-pointer text-sm font-black text-slate-950">Secondary Fixes</summary>
            <div className="mt-4 space-y-3">
              {analysis.secondaryFixes.map((fix) => (
                <FixCard key={fix.title} fix={fix} />
              ))}
            </div>
          </details>

          <div className="space-y-3">
            <Button variant="secondary" onClick={() => router.push("/leaderboard")}>
              <Trophy className="h-4 w-4" />
              View Leaderboard
            </Button>
            <Button variant="secondary" onClick={() => router.push("/results")}>
              <Share2 className="h-4 w-4" />
              Share Again
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
