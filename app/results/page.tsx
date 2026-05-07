"use client";

import { LockKeyhole, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProfileCard } from "@/components/ProfileCard";
import { ShareModal } from "@/components/ShareModal";
import { StrengthCard } from "@/components/StrengthCard";
import { WeaknessCard } from "@/components/WeaknessCard";
import { Button } from "@/components/ui/Button";
import { ScoreBadge } from "@/components/ui/Badge";
import { useAnalyzerStore } from "@/lib/store";

export default function ResultsPage() {
  const [shareOpen, setShareOpen] = useState(false);
  const router = useRouter();
  const profile = useAnalyzerStore((state) => state.linkedinData);
  const analysis = useAnalyzerStore((state) => state.analysis);
  const isUnlocked = useAnalyzerStore((state) => state.isUnlocked);

  if (!analysis) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 px-4">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-sm text-slate-600">No analysis found on this device.</p>
          <Button onClick={() => router.push("/questions")}>Start Analysis</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="safe-bottom min-h-dvh bg-slate-50">
      <div className="mx-auto max-w-md">
        <ProfileCard profile={profile} />
        <div className="px-4 py-5">
          <section className="mb-6 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-500">Overall score</p>
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

          {isUnlocked ? (
            <Button onClick={() => router.push("/results/unlocked")}>
              <Sparkles className="h-4 w-4" />
              View Personalized Fixes
            </Button>
          ) : (
            <Button onClick={() => setShareOpen(true)}>
              <LockKeyhole className="h-4 w-4" />
              Share to Unlock Your Fixes
            </Button>
          )}
        </div>
      </div>
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </main>
  );
}
