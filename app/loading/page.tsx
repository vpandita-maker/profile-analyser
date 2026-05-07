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

  useEffect(() => {
    if (analysis) {
      const timeout = window.setTimeout(() => router.replace("/results"), 900);
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
      setAnalysis(data.analysis, data.analysisId);
      router.replace("/results");
    }

    void runAnalysis();
  }, [analysis, contextAnswers, profile, router, setAnalysis]);

  return <Loading label="Building your personalized profile analysis" />;
}
