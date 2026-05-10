"use client";

import { ArrowRight, FileText, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { normalizeLinkedInProfile } from "@/lib/profile-normalize";
import { useAnalyzerStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ContextAnswers, LinkedInProfile, WorkPreference } from "@/lib/types";

const workPreferences: WorkPreference[] = ["Remote", "Hybrid", "In office"];

function inferGoal(role: string): ContextAnswers["goal"] {
  const normalized = role.toLowerCase();
  return normalized.includes("intern") || normalized.includes("summer analyst") ? "Internship Search" : "Job Search";
}

function inferGeography(location: string): ContextAnswers["geography"] {
  const normalized = location.toLowerCase();
  const indiaSignals = ["india", "bengaluru", "bangalore", "mumbai", "delhi", "hyderabad", "pune", "chennai", "gurgaon", "noida", "ahmedabad"];
  const usSignals = ["us", "usa", "united states", "new york", "bay area", "san francisco", "california", "boston", "chicago", "seattle", "austin"];

  if (indiaSignals.some((signal) => normalized.includes(signal))) return "India";
  if (usSignals.some((signal) => normalized.includes(signal))) return "US";
  return "Other";
}

export default function HomePage() {
  const router = useRouter();
  const setLinkedinData = useAnalyzerStore((state) => state.setLinkedinData);
  const setContextAnswers = useAnalyzerStore((state) => state.setContextAnswers);
  const resetContext = useAnalyzerStore((state) => state.resetContext);
  const clearAnalysis = useAnalyzerStore((state) => state.clearAnalysis);
  const [profileUrl, setProfileUrl] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [preferredIndustry, setPreferredIndustry] = useState("");
  const [dreamCompany, setDreamCompany] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [workPreference, setWorkPreference] = useState<WorkPreference | "">("");
  const [wins, setWins] = useState("");
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState("");

  function scrollToForm() {
    document.getElementById("profile-intake")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const canSubmit = Boolean(
    profileUrl.trim() &&
      targetRole.trim() &&
      preferredIndustry.trim() &&
      dreamCompany.trim() &&
      locationPreference.trim() &&
      workPreference
  );

  async function analyzeProfile() {
    const trimmedUrl = profileUrl.trim();
    const trimmedRole = targetRole.trim();
    const trimmedIndustry = preferredIndustry.trim();
    const trimmedDreamCompany = dreamCompany.trim();
    const trimmedLocationPreference = locationPreference.trim();

    if (!canSubmit) {
      return;
    }

    setError("");
    setScraping(true);

    try {
      const response = await fetch("/api/profile/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileUrl: trimmedUrl })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not import this profile automatically.");
        return;
      }

      const importedProfile = normalizeLinkedInProfile({
        ...data.profile,
        linkedinId: data.profile.linkedinId || "profile-user",
        profileUrl: data.profile.profileUrl || trimmedUrl,
        name: data.profile.name || "LinkedIn Member",
        importSource: "scrape"
      } satisfies LinkedInProfile);

      resetContext();
      clearAnalysis();
      setContextAnswers({
        goal: inferGoal(trimmedRole),
        seniority: "",
        industry: trimmedIndustry,
        targetRole: trimmedRole,
        geography: inferGeography(trimmedLocationPreference),
        city: trimmedLocationPreference,
        timeline: "",
        challenges: [],
        targetCompanies: trimmedDreamCompany,
        outcome: `You are targeting ${trimmedRole} roles in ${trimmedIndustry}. Your dream company is ${trimmedDreamCompany}. Your location preference is ${trimmedLocationPreference}. Your preferred work style is ${workPreference}.`,
        networkSize: "",
        relocation: null,
        workPreference,
        wins: wins.trim()
      });
      setLinkedinData(importedProfile || ({
        ...data.profile,
        linkedinId: data.profile.linkedinId || "profile-user",
        profileUrl: trimmedUrl,
        name: data.profile.name || "LinkedIn Member",
        importSource: "scrape"
      } satisfies LinkedInProfile));
      router.push("/loading");
    } catch {
      setError("Could not import this profile automatically. Please check the URL and try again.");
    } finally {
      setScraping(false);
    }
  }

  return (
    <main className="app-screen safe-bottom">
      <section className="app-container app-flow">
        <div>
          <div className="sticky top-3 z-20 mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 p-2 pl-3 shadow-lg shadow-slate-200/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-white">
                <FileText className="h-4 w-4" />
              </span>
              Profile Analyzer
            </div>
            <button
              className="try-now-btn inline-flex h-8 items-center gap-1 rounded-lg bg-teal-600 px-3 text-xs font-black text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-teal-700 active:translate-y-0 active:scale-[0.97]"
              onClick={scrollToForm}
              type="button"
            >
              Try Now
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="group mb-6 w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-teal-400 hover:shadow-2xl hover:shadow-teal-100">
            <Image
              alt="The big leagues"
              className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              height={454}
              priority
              src="/big-leagues.svg"
              width={492}
            />
          </div>

          <h1 className="text-[2.55rem] font-black leading-[1.06] text-slate-950">Get Recruited, Don&apos;t Just Apply.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Every recruiter sees dozens of profiles, most get skipped. Align your LinkedIn to the exact role you want, get a personalized roadmap of what to fix, and watch your inbound offers increase.
          </p>

          <div className="app-form-stack scroll-mt-24 space-y-4" id="profile-intake">
            {error ? <Card className="border border-red-200 bg-red-50 text-sm leading-6 text-red-700">{error}</Card> : null}
            <Field label="Your LinkedIn profile URL">
              <Input
                inputMode="url"
                onChange={(event) => setProfileUrl(event.target.value)}
                placeholder="Add your LinkedIn profile link here"
                value={profileUrl}
              />
            </Field>
            <Field label="What role are you targeting?">
              <Input
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder="Business analyst intern, product manager, software engineer"
                value={targetRole}
              />
            </Field>
            <Field label="What is your preferred industry?">
              <Input
                onChange={(event) => setPreferredIndustry(event.target.value)}
                placeholder="Consulting, fintech, healthcare, SaaS"
                value={preferredIndustry}
              />
            </Field>
            <Field label="What is your dream company?">
              <Input
                onChange={(event) => setDreamCompany(event.target.value)}
                placeholder="Google, Deloitte, Salesforce"
                value={dreamCompany}
              />
            </Field>
            <Field label="What is your location preference?">
              <Input
                onChange={(event) => setLocationPreference(event.target.value)}
                placeholder="New York, Bengaluru, London, anywhere in the US"
                value={locationPreference}
              />
            </Field>
            <Field label="Do you prefer remote, hybrid, or in office?">
              <div className="grid grid-cols-3 gap-2">
                {workPreferences.map((item) => (
                  <button
                    className={cn(
                      "h-11 rounded-lg border px-2 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]",
                      workPreference === item ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-700"
                    )}
                    key={item}
                    onClick={() => setWorkPreference(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Anything you wish your LinkedIn highlighted better? (optional)">
              <Textarea
                onChange={(event) => setWins(event.target.value)}
                placeholder="Recent projects, awards, internships, coursework, or achievements that are relevant to the role you want but not well represented on your profile"
                value={wins}
              />
            </Field>
            <Button disabled={!canSubmit || scraping} loading={scraping} onClick={analyzeProfile}>
              Analyze My Profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </section>
    </main>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-black text-slate-950">{label}</span>
      {children}
    </label>
  );
}
