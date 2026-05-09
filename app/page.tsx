"use client";

import { FileText, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="safe-bottom min-h-dvh bg-slate-50 px-4 py-5">
      <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-md flex-col justify-between">
        <div>
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-white">
                <FileText className="h-4 w-4" />
              </span>
              Profile Analyzer
            </div>
            <Trophy className="h-5 w-5 text-teal-600" />
          </div>

          <h1 className="text-4xl font-black leading-tight text-slate-950">Align your LinkedIn to your goals, and actually get noticed.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Import your LinkedIn profile, tell us your career goals, and get a personalized analysis with specific fixes. No generic advice, just what actually matters for your path.
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
          <Button onClick={() => router.push("/profile-import")}>
            <FileText className="h-5 w-5" />
            Analyze My Profile
          </Button>
        </div>
      </section>
    </main>
  );
}
