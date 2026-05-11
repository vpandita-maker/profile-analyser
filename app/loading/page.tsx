"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/Loading";
import { useAnalyzerStore } from "@/lib/store";

export default function AnalysisLoadingPage() {
  const router = useRouter();
  const started = useRef(false);
  const profile = useAnalyzerStore((state) => state.linkedinData);
  const contextAnswers = useAnalyzerStore((state) => state.contextAnswers);
  const analysis = useAnalyzerStore((state) => state.analysis);
  const setAnalysis = useAnalyzerStore((state) => state.setAnalysis);
  const setLinkedinData = useAnalyzerStore((state) => state.setLinkedinData);
  const setPreviousScore = useAnalyzerStore((state) => state.setPreviousScore);
  const pushScoreHistory = useAnalyzerStore((state) => state.pushScoreHistory);

  useEffect(() => {
    if (analysis) {
      const timeout = window.setTimeout(() => {
        const { userEmail } = useAnalyzerStore.getState();
        router.replace(userEmail ? "/results" : "/email-gate");
      }, 900);
      return () => window.clearTimeout(timeout);
    }

    if (started.current) return;
    started.current = true;

    if (!profile) {
      router.replace("/");
      return;
    }

    async function runAnalysis() {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, contextAnswers })
      });
      const data = await response.json();
      if (data.profile) {
        setLinkedinData(data.profile);
      }
      if (typeof data.previousScore === "number") {
        setPreviousScore(data.previousScore);
      }
      setAnalysis(data.analysis, data.analysisId);
      const newScore = data.analysis?.overallScore;
      if (typeof newScore === "number") {
        pushScoreHistory(newScore);
      }
      const { userEmail } = useAnalyzerStore.getState();
      router.replace(userEmail ? "/results" : "/email-gate");
    }

    void runAnalysis();
  }, [analysis, contextAnswers, profile, router, setAnalysis, setLinkedinData, setPreviousScore, pushScoreHistory]);

  return <Loading label="Building your personalized profile analysis" />;
}
