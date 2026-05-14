"use client";

import { ChevronLeft, LockKeyhole, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FixCard } from "@/components/FixCard";
import { Loading } from "@/components/Loading";
import { UnlockOnboardingModal } from "@/components/UnlockOnboardingModal";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { normalizeAnalysis } from "@/lib/analysis";
import { useAnalyzerStore } from "@/lib/store";
import { isEmail } from "@/lib/utils";

export default function UnlockedResultsPage() {
  const router = useRouter();
  const startedFixRefresh = useRef(false);
  const lockSectionRef = useRef<HTMLDivElement>(null);
  const [introLoading, setIntroLoading] = useState(false);
  const [refreshingFixes, setRefreshingFixes] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [unlockEmail, setUnlockEmail] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockSent, setUnlockSent] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  const profile = useAnalyzerStore((state) => state.linkedinData);
  const contextAnswers = useAnalyzerStore((state) => state.contextAnswers);
  const storedAnalysis = useAnalyzerStore((state) => state.analysis);
  const analysis = normalizeAnalysis(storedAnalysis);
  const isFullyUnlocked = useAnalyzerStore((state) => state.isFullyUnlocked);
  const setAnalysis = useAnalyzerStore((state) => state.setAnalysis);
  const setLinkedinData = useAnalyzerStore((state) => state.setLinkedinData);
  const setFullyUnlocked = useAnalyzerStore((state) => state.setFullyUnlocked);
  const analysisId = useAnalyzerStore((state) => state.analysisId);

  const hasFixes = Boolean(analysis?.topFixes.length);

  useEffect(() => {
    if (window.location.search.includes("preparing=1")) {
      setIntroLoading(true);
      window.history.replaceState(null, "", "/results/unlocked");
    }
  }, []);

  useEffect(() => {
    if (!introLoading) return;
    const timeout = window.setTimeout(() => setIntroLoading(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [introLoading]);

  useEffect(() => {
    if (!analysis || hasFixes || !profile || startedFixRefresh.current) return;
    startedFixRefresh.current = true;
    setRefreshingFixes(true);
    setRefreshFailed(false);

    async function refreshFixes() {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, contextAnswers })
        });
        if (!response.ok) {
          setRefreshFailed(true);
          return;
        }
        const data = await response.json();
        if (data.profile) setLinkedinData(data.profile);
        setAnalysis(data.analysis, data.analysisId);
      } catch {
        setRefreshFailed(true);
      } finally {
        setRefreshingFixes(false);
      }
    }

    void refreshFixes();
  }, [analysis, contextAnswers, hasFixes, profile, setAnalysis, setLinkedinData]);

  async function sendUnlockInvite() {
    if (!isEmail(unlockEmail) || !analysisId) return;
    setUnlocking(true);
    setUnlockError("");
    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, friendEmail: unlockEmail, inviterName: profile?.name })
      });
      if (!response.ok) {
        setUnlockError("Invite could not be sent. Please try again.");
        return;
      }
      setUnlockSent(true);
      window.setTimeout(() => setFullyUnlocked(true), 600);
    } catch {
      setUnlockError("Invite could not be sent. Please try again.");
    } finally {
      setUnlocking(false);
    }
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

  if (introLoading || refreshingFixes) {
    return <Loading label="Preparing your personalized fixes" />;
  }

  const visibleFixes = hasFixes ? analysis.topFixes : [];
  const lockedFixes = hasFixes ? analysis.secondaryFixes.slice(0, 2) : [];
  const blurredPreview = lockedFixes.slice(0, 1);
  const allFixes = [...visibleFixes, ...lockedFixes];
  const bumpFor = (fix: { scoreBump?: number; difficulty: string }) =>
    fix.scoreBump ?? (fix.difficulty === "Easy" ? 4 : fix.difficulty === "Hard" ? 8 : 6);
  const totalBump = allFixes.reduce((sum, fix) => sum + bumpFor(fix), 0);
  const projectedScore = Math.min(100, analysis.overallScore + totalBump);

  function scrollToLock() {
    lockSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main className="app-screen safe-bottom">
      <UnlockOnboardingModal isFullyUnlocked={isFullyUnlocked} onInviteNow={scrollToLock} />
      <div className="app-container">
        <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-x-0.5 hover:text-slate-950"
              onClick={() => router.push("/results")}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              Overview
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
        <div className="py-5">
          <section className="mb-5 flex items-start justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div>
              <Badge tone="teal">Fixes Unlocked</Badge>
              <h1 className="mt-2 text-2xl font-black text-slate-950">Your Personalized Fixes</h1>
              <p className="mt-1 text-xs font-semibold text-slate-500">Potential score after all fixes</p>
            </div>
            <ScoreBadge score={projectedScore} />
          </section>

          {!hasFixes && (
            <div className="mb-5 rounded-lg bg-white p-4 text-sm font-semibold leading-6 text-slate-600 shadow-sm ring-1 ring-slate-200">
              {refreshFailed
                ? "Your personalized fixes could not be prepared. Please run the analysis again."
                : "Your personalized fixes are being prepared."}
            </div>
          )}

          {visibleFixes.length > 0 && (
            <div className="mb-2 space-y-3">
              {visibleFixes.map((fix) => (
                <FixCard key={fix.title} fix={fix} />
              ))}
            </div>
          )}

          {lockedFixes.length > 0 && (
            <div className="mb-4">
              {isFullyUnlocked ? (
                <div className="space-y-3">
                  {lockedFixes.map((fix) => (
                    <FixCard key={fix.title} fix={fix} />
                  ))}
                </div>
              ) : (
                <div>
                  <div className="pointer-events-none select-none space-y-3 opacity-30 blur-sm">
                    {blurredPreview.map((fix) => (
                      <FixCard key={fix.title} fix={fix} />
                    ))}
                  </div>
                  <div ref={lockSectionRef} className="mt-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <LockKeyhole className="h-5 w-5 text-teal-600" />
                      <h3 className="font-black text-slate-950">Unlock {lockedFixes.length} More Fixes</h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      Invite one more friend to unlock your remaining fixes instantly.
                    </p>
                    {unlockError && (
                      <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{unlockError}</p>
                    )}
                    {unlockSent ? (
                      <div className="rounded-lg bg-teal-50 p-3 text-sm font-semibold text-teal-800">
                        Invite sent! Unlocking your fixes...
                      </div>
                    ) : (
                      <>
                        <Input
                          inputMode="email"
                          onChange={(e) => setUnlockEmail(e.target.value)}
                          placeholder="Friend's email"
                          value={unlockEmail}
                        />
                        <Button disabled={!isEmail(unlockEmail)} loading={unlocking} onClick={sendUnlockInvite}>
                          Send Invite to Unlock
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
