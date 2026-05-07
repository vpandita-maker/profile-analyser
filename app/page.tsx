"use client";

import { ArrowRight, Linkedin, Trophy } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAnalyzerStore } from "@/lib/store";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const setLinkedinData = useAnalyzerStore((state) => state.setLinkedinData);

  useEffect(() => {
    if (session?.user.linkedinProfile) {
      setLinkedinData(session.user.linkedinProfile);
      router.replace("/questions");
    }
  }, [session, router, setLinkedinData]);

  return (
    <main className="safe-bottom min-h-dvh bg-slate-50 px-4 py-5">
      <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-md flex-col justify-between">
        <div>
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0A66C2] text-white">
                <Linkedin className="h-4 w-4" />
              </span>
              Profile Analyzer
            </div>
            <Trophy className="h-5 w-5 text-teal-600" />
          </div>

          <h1 className="text-4xl font-black leading-tight text-slate-950">Know what your LinkedIn profile is costing you.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Connect your profile, answer a few career questions, and get agentic analysis trained on expert career data.
          </p>
        </div>

        <div className="space-y-3">
          <Card className="bg-white">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-black text-slate-950">2 min</p>
                <p className="text-xs text-slate-500">Questions</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-950">Expert</p>
                <p className="text-xs text-slate-500">Review</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-950">Top 10</p>
                <p className="text-xs text-slate-500">Rankings</p>
              </div>
            </div>
          </Card>
          <Button loading={status === "loading"} onClick={() => signIn("linkedin", { callbackUrl: "/questions" })}>
            <Linkedin className="h-5 w-5" />
            Continue with LinkedIn
          </Button>
          <Button variant="secondary" onClick={() => router.push("/questions")}>
            Try demo flow
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
  );
}
