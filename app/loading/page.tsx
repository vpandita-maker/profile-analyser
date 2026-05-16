"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/Loading";
import { useAnalyzerStore } from "@/lib/store";

export default function AnalysisLoadingPage() {
  const router = useRouter();
  const started = useRef(false);
  const [progress, setProgress] = useState(8);
  const profile = useAnalyzerStore((state) => state.linkedinData);
  const contextAnswers = useAnalyzerStore((state) => state.contextAnswers);
  const analysis = useAnalyzerStore((state) => state.analysis);
  const setAnalysis = useAnalyzerStore((state) => state.setAnalysis);
  const setLinkedinData = useAnalyzerStore((state) => state.setLinkedinData);
  const setPreviousScore = useAnalyzerStore((state) => state.setPreviousScore);
  const setScoreHistory = useAnalyzerStore((state) => state.setScoreHistory);

  useEffect(() => {
    if (analysis) {
      setProgress(100);
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

    const progressInterval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 94) return current;
        if (current < 28) return current + 4;
        if (current < 62) return current + 3;
        if (current < 84) return current + 2;
        return current + 1;
      });
    }, 700);

    async function runAnalysis() {
      try {
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
        if (Array.isArray(data.scoreHistory)) {
          setScoreHistory(data.scoreHistory);
        }
        setProgress(100);
        window.setTimeout(() => {
          const { userEmail } = useAnalyzerStore.getState();
          router.replace(userEmail ? "/results" : "/email-gate");
        }, 500);
      } finally {
        window.clearInterval(progressInterval);
      }
    }

    void runAnalysis();
    return () => window.clearInterval(progressInterval);
  }, [analysis, contextAnswers, profile, router, setAnalysis, setLinkedinData, setPreviousScore, setScoreHistory]);

  return <Loading label="Building your personalized profile analysis" progress={progress} />;
}
