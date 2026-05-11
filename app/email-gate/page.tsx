"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loading } from "@/components/Loading";
import { ScoreBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { normalizeAnalysis } from "@/lib/analysis";
import { useAnalyzerStore } from "@/lib/store";
import { isEmail } from "@/lib/utils";

export default function EmailGatePage() {
  const router = useRouter();
  const storedAnalysis = useAnalyzerStore((state) => state.analysis);
  const analysis = normalizeAnalysis(storedAnalysis);
  const profile = useAnalyzerStore((state) => state.linkedinData);
  const userEmail = useAnalyzerStore((state) => state.userEmail);
  const setUserEmail = useAnalyzerStore((state) => state.setUserEmail);
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!analysis) {
      router.replace("/");
      return;
    }
    if (userEmail) {
      router.replace("/results");
      return;
    }
    setReady(true);
  }, [analysis, userEmail, router]);

  if (!ready || !analysis) return <Loading label="Loading your results" />;

  function proceed(emailToSave?: string) {
    if (emailToSave) setUserEmail(emailToSave);
    router.push("/results");
  }

  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <main className="app-screen grid place-items-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <ScoreBadge score={analysis.overallScore} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-950">
            {firstName}, your LinkedIn score is {analysis.overallScore}/100
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Save your email so we can notify you as your score improves each time you re-analyze.
          </p>
        </div>
        <div className="space-y-3">
          <Input
            inputMode="email"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && isEmail(email) && proceed(email)}
            placeholder="Your email address"
            value={email}
          />
          <Button disabled={!isEmail(email)} onClick={() => proceed(email)}>
            View My Results
            <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            className="block w-full text-center text-sm text-slate-400 transition-colors hover:text-slate-600"
            onClick={() => proceed()}
            type="button"
          >
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}
