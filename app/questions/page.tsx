"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useAnalyzerStore } from "@/lib/store";
import type { ContextAnswers } from "@/lib/types";
import { cn } from "@/lib/utils";

const goals = ["Recruiting", "Fundraising", "Hiring", "Personal Brand", "Job Search"];
const seniority = ["Entry-level", "Mid-level", "Senior", "Executive", "Student"];
const geography = ["India", "US", "Other"];
const timeline = ["Urgent", "Near-term", "Flexible"];
const networkSizes = ["<500", "500-2K", "2K-5K", "5K-10K", "10K+"];
const challenges = ["Unclear value prop", "Low engagement", "Few recommendations", "Weak headline", "Unfocused experience", "Missing proof", "Wrong audience"];

const screenChecks: Array<(answers: ContextAnswers) => boolean> = [
  (a) => Boolean(a.goal && a.seniority),
  (a) => Boolean(a.industry && a.targetRole),
  (a) => Boolean(a.geography && a.city),
  (a) => Boolean(a.timeline && a.challenges.length),
  (a) => Boolean(a.targetCompanies && a.outcome),
  (a) => Boolean(a.networkSize && a.relocation !== null),
  () => true
];

export default function QuestionsPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const answers = useAnalyzerStore((state) => state.contextAnswers);
  const setAnswers = useAnalyzerStore((state) => state.setContextAnswers);
  const toggleChallenge = useAnalyzerStore((state) => state.toggleChallenge);
  const linkedinData = useAnalyzerStore((state) => state.linkedinData);
  const setLinkedinData = useAnalyzerStore((state) => state.setLinkedinData);
  const setAnalysis = useAnalyzerStore((state) => state.setAnalysis);

  const canContinue = useMemo(() => screenChecks[step](answers), [answers, step]);

  async function submit() {
    setLoading(true);
    const profile =
      linkedinData ||
      ({
        linkedinId: "demo-user",
        name: "Demo LinkedIn Member",
        headline: "Growth-focused operator building useful products",
        about: "",
        experience: [],
        skills: [],
        importSource: "demo"
      } as const);
    setLinkedinData(profile);

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, contextAnswers: answers })
    });
    const data = await response.json();
    setAnalysis(data.analysis, data.analysisId);
    router.push("/loading");
  }

  function next() {
    if (step < 6) {
      setStep((value) => value + 1);
      navigator.vibrate?.(8);
      return;
    }
    void submit();
  }

  return (
    <main className="safe-bottom min-h-dvh bg-slate-50 px-4 py-5">
      <div className="mx-auto max-w-md">
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
            <span>{step + 1}/7</span>
            <span>{Math.round(((step + 1) / 7) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${((step + 1) / 7) * 100}%` }} />
          </div>
        </div>

        <Card className="min-h-[520px]">
          <div className="animate-[fade-in_180ms_ease-out] space-y-5" key={step}>
            {step === 0 ? (
              <>
                <Field label="What is your primary LinkedIn goal?">
                  <Select value={answers.goal} onChange={(event) => setAnswers({ goal: event.target.value as ContextAnswers["goal"] })}>
                    <option value="">Select goal</option>
                    {goals.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="What is your current career stage?">
                  <Select value={answers.seniority} onChange={(event) => setAnswers({ seniority: event.target.value as ContextAnswers["seniority"] })}>
                    <option value="">Select stage</option>
                    {seniority.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <Field label="What industry or sector are you targeting?">
                  <Input value={answers.industry} onChange={(event) => setAnswers({ industry: event.target.value })} placeholder="Fintech, SaaS, climate, automation" />
                </Field>
                <Field label="What specific role are you targeting?">
                  <Input value={answers.targetRole} onChange={(event) => setAnswers({ targetRole: event.target.value })} placeholder="Product Lead, Founder, VP Sales" />
                </Field>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Field label="Where are you based?">
                  <Select value={answers.geography} onChange={(event) => setAnswers({ geography: event.target.value as ContextAnswers["geography"] })}>
                    <option value="">Select country</option>
                    {geography.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="What city or region?">
                  <Input value={answers.city} onChange={(event) => setAnswers({ city: event.target.value })} placeholder="Bengaluru, Bay Area, London" />
                </Field>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Field label="Timeline?">
                  <Select value={answers.timeline} onChange={(event) => setAnswers({ timeline: event.target.value as ContextAnswers["timeline"] })}>
                    <option value="">Select timeline</option>
                    {timeline.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="What are your biggest LinkedIn challenges?">
                  <div className="grid grid-cols-1 gap-2">
                    {challenges.map((item) => (
                      <button
                        className={cn(
                          "flex min-h-11 items-center rounded-lg border px-3 text-left text-sm font-semibold",
                          answers.challenges.includes(item) ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-700"
                        )}
                        key={item}
                        onClick={() => toggleChallenge(item)}
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <Field label="Target companies or investors?">
                  <Input value={answers.targetCompanies} onChange={(event) => setAnswers({ targetCompanies: event.target.value })} placeholder="Sequoia, Google, Stripe" />
                </Field>
                <Field label="Ideal outcome in 6 months?">
                  <Textarea value={answers.outcome} onChange={(event) => setAnswers({ outcome: event.target.value })} placeholder="Describe the opportunity you want LinkedIn to create." />
                </Field>
              </>
            ) : null}

            {step === 5 ? (
              <>
                <Field label="Current network size?">
                  <Select value={answers.networkSize} onChange={(event) => setAnswers({ networkSize: event.target.value })}>
                    <option value="">Select range</option>
                    {networkSizes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Open to relocation?">
                  <div className="grid grid-cols-2 gap-2">
                    {[true, false].map((value) => (
                      <button
                        key={String(value)}
                        type="button"
                        onClick={() => setAnswers({ relocation: value })}
                        className={cn(
                          "h-11 rounded-lg border text-sm font-bold",
                          answers.relocation === value ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-700"
                        )}
                      >
                        {value ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            ) : null}

            {step === 6 ? (
              <>
                <Field label="Salary expectations?">
                  <Input value={answers.salary} onChange={(event) => setAnswers({ salary: event.target.value })} placeholder="Optional" />
                </Field>
                <Field label="Recent wins or achievements?">
                  <Textarea value={answers.wins} onChange={(event) => setAnswers({ wins: event.target.value })} placeholder="Optional but useful for sharper fixes." />
                </Field>
              </>
            ) : null}
          </div>
        </Card>

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" fullWidth={false} className="w-14 px-0" disabled={step === 0 || loading} onClick={() => setStep((value) => value - 1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button disabled={!canContinue} loading={loading} onClick={next}>
            {step === 6 ? "Analyze Profile" : "Next"}
            {!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-900">{label}</span>
      {children}
    </label>
  );
}
