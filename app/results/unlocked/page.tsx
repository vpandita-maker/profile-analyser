"use client";

import { Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FixCard } from "@/components/FixCard";
import { Loading } from "@/components/Loading";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { normalizeAnalysis } from "@/lib/analysis";
import { useAnalyzerStore } from "@/lib/store";

export default function UnlockedResultsPage() {
  const router = useRouter();
  const startedFixRefresh = useRef(false);
  const [introLoading, setIntroLoading] = useState(false);
  const [refreshingFixes, setRefreshingFixes] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const profile = useAnalyzerStore((state) => state.linkedinData);
  const contextAnswers = useAnalyzerStore((state) => state.contextAnswers);
  const storedAnalysis = useAnalyzerStore((state) => state.analysis);
  const analysis = normalizeAnalysis(storedAnalysis);
  const isUnlocked = useAnalyzerStore((state) => state.isUnlocked);
  const setAnalysis = useAnalyzerStore((state) => state.setAnalysis);
  const setLinkedinData = useAnalyzerStore((state) => state.setLinkedinData);

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
    if (!analysis || !isUnlocked || hasFixes || !profile || startedFixRefresh.current) return;
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
        if (data.profile) {
          setLinkedinData(data.profile);
        }
        setAnalysis(data.analysis, data.analysisId);
      } catch {
        setRefreshFailed(true);
      } finally {
        setRefreshingFixes(false);
      }
    }

    void refreshFixes();
  }, [analysis, contextAnswers, hasFixes, isUnlocked, profile, setAnalysis, setLinkedinData]);

  if (!analysis || !isUnlocked) {
    return (
      <main className="app-screen grid place-items-center px-4">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-sm text-slate-600">Personalized fixes are locked until you send an invite.</p>
          <Button onClick={() => router.push("/results")}>Back to Results</Button>
        </div>
      </main>
    );
  }

  if (introLoading || refreshingFixes) {
    return <Loading label="Preparing your personalized fixes" />;
  }

  return (
    <main className="app-screen safe-bottom">
      <div className="app-container">
        <div className="py-5">
          <section className="mb-5 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div>
              <Badge tone="teal">Fixes Unlocked</Badge>
              <h1 className="mt-2 text-2xl font-black text-slate-950">Your Personalized Fixes</h1>
              <p className="mt-1 text-xs font-semibold text-slate-500">Overall score out of 100</p>
            </div>
            <ScoreBadge score={analysis.overallScore} />
          </section>

          <div className="mb-5 space-y-3">
            {hasFixes ? (
              analysis.topFixes.map((fix, index) => <FixCard key={fix.title} fix={fix} defaultOpen={index === 0} />)
            ) : (
              <div className="rounded-lg bg-white p-4 text-sm font-semibold leading-6 text-slate-600 shadow-sm ring-1 ring-slate-200">
                {refreshFailed ? "Your personalized fixes could not be prepared. Please run the analysis again." : "Your personalized fixes are being prepared."}
              </div>
            )}
          </div>

          {analysis.secondaryFixes.length ? (
            <details className="mb-6 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <summary className="cursor-pointer text-sm font-black text-slate-950">Secondary Fixes</summary>
              <div className="mt-4 space-y-3">
                {analysis.secondaryFixes.map((fix) => (
                  <FixCard key={fix.title} fix={fix} />
                ))}
              </div>
            </details>
          ) : null}

          <div className="space-y-3">
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
