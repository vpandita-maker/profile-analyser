"use client";

import { ArrowRight, BarChart2, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { normalizeLinkedInProfile } from "@/lib/profile-normalize";
import { useAnalyzerStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ContextAnswers, LinkedInProfile, WorkPreference } from "@/lib/types";

const workPreferences: WorkPreference[] = ["Remote", "Hybrid", "In office"];

const INDUSTRIES = [
  "Technology",
  "Finance & Banking",
  "Consulting",
  "Healthcare",
  "Marketing & Advertising",
  "E-commerce & Retail",
  "Media & Entertainment",
  "Education",
  "Energy & Utilities",
  "Manufacturing",
  "Government & Public Sector",
  "Legal",
  "Real Estate",
  "Insurance",
  "Other"
];

const inputCls =
  "h-11 w-full rounded-lg border border-[#EEEEEE] bg-white px-3 text-[15px] text-[#333333] outline-none transition-all placeholder:text-[#AAAAAA] hover:border-[#0A66C2]/40 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10";

function inferGoal(role: string): ContextAnswers["goal"] {
  const n = role.toLowerCase();
  return n.includes("intern") || n.includes("summer analyst") ? "Internship Search" : "Job Search";
}

function inferGeography(location: string): ContextAnswers["geography"] {
  const n = location.toLowerCase();
  const india = ["india","bengaluru","bangalore","mumbai","delhi","hyderabad","pune","chennai","gurgaon","noida","ahmedabad"];
  const us = ["us","usa","united states","new york","bay area","san francisco","california","boston","chicago","seattle","austin"];
  if (india.some((s) => n.includes(s))) return "India";
  if (us.some((s) => n.includes(s))) return "US";
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

  const requiredFields = [profileUrl, targetRole, preferredIndustry, dreamCompany, locationPreference];
  const filledCount = requiredFields.filter((f) => f.trim()).length + (workPreference ? 1 : 0);
  const progress = Math.round((filledCount / 6) * 100);

  const canSubmit = Boolean(
    profileUrl.trim() && targetRole.trim() && preferredIndustry.trim() &&
    dreamCompany.trim() && locationPreference.trim() && workPreference
  );

  function scrollToForm() {
    document.getElementById("profile-intake")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function analyzeProfile() {
    if (!canSubmit) return;
    setError("");
    setScraping(true);
    try {
      const response = await fetch("/api/profile/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileUrl: profileUrl.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not import this profile automatically.");
        return;
      }
      const importedProfile = normalizeLinkedInProfile({
        ...data.profile,
        linkedinId: data.profile.linkedinId || "profile-user",
        profileUrl: data.profile.profileUrl || profileUrl.trim(),
        name: data.profile.name || "LinkedIn Member",
        importSource: "scrape"
      } satisfies LinkedInProfile);

      resetContext();
      clearAnalysis();
      setContextAnswers({
        goal: inferGoal(targetRole.trim()),
        seniority: "",
        industry: preferredIndustry.trim(),
        targetRole: targetRole.trim(),
        geography: inferGeography(locationPreference.trim()),
        city: locationPreference.trim(),
        timeline: "",
        challenges: [],
        targetCompanies: dreamCompany.trim(),
        outcome: `You are targeting ${targetRole.trim()} roles in ${preferredIndustry.trim()}. Your dream company is ${dreamCompany.trim()}. Your location preference is ${locationPreference.trim()}. Your preferred work style is ${workPreference}.`,
        networkSize: "",
        relocation: null,
        workPreference,
        wins: wins.trim()
      });
      setLinkedinData(importedProfile || ({
        ...data.profile,
        linkedinId: data.profile.linkedinId || "profile-user",
        profileUrl: profileUrl.trim(),
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
    <main className="landing-screen">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 w-full border-b border-[#EEEEEE] bg-white/95 backdrop-blur">
        <div className="landing-container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#0A66C2] text-white">
              <BarChart2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-black text-[#0A66C2]">iLoveLinkedIn</span>
          </div>
          <button
            className="try-now-btn inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-4 py-2 text-xs font-black text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#004182] hover:shadow-md active:scale-[0.97]"
            onClick={scrollToForm}
            type="button"
          >
            Join the Pro Tier
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </div>
        {progress > 0 && (
          <div className="h-0.5 bg-[#EEEEEE]">
            <div className="h-0.5 bg-[#0A66C2] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-[#0d1b2e] via-[#0a2d4a] to-[#004e8a]">
        <div className="landing-container flex justify-center py-0">
          <div className="w-full max-w-sm overflow-hidden">
            <Image
              alt="The big leagues"
              className="h-auto w-full object-cover"
              height={454}
              priority
              src="/big-leagues.svg"
              width={492}
            />
          </div>
        </div>
      </section>

      {/* ── Copy + Form ── */}
      <section className="landing-container py-8" id="profile-intake">
          <h1 className="text-[2.4rem] font-black leading-[1.06] text-[#0A66C2]">
            Get Recruited,<br />Don&apos;t Just Apply.
          </h1>
          <ul className="mt-5 mb-7 space-y-4">
            {[
              { label: "Direct", text: "Align your LinkedIn to the exact role you're targeting." },
              { label: "Personalized", text: "Receive a data-driven fix roadmap built around your background." },
              { label: "Results", text: "Watch inbound recruiter outreach increase." },
            ].map(({ label, text }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-[10px] font-black text-white">→</span>
                <p className="text-[15px] leading-7 text-[#444444]">
                  <span className="font-black text-[#0A66C2]">{label}:</span>{" "}{text}
                </p>
              </li>
            ))}
          </ul>

          {/* Form */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-xl ring-1 ring-[#EEEEEE]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,115,177,0.06),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(0,30,60,0.04),transparent_50%)]" />
            <div className="relative space-y-5">

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}

              <Field label="Your LinkedIn profile URL">
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#CCCCCC]" />
                  <input
                    className={cn(inputCls, "pl-9")}
                    inputMode="url"
                    onChange={(e) => setProfileUrl(e.target.value)}
                    placeholder="linkedin.com/in/yourname"
                    value={profileUrl}
                  />
                </div>
              </Field>

              <Field label="What role are you targeting?">
                <input
                  className={inputCls}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Product Manager"
                  value={targetRole}
                />
              </Field>

              <Field label="What is your preferred industry?">
                <select
                  className={cn(inputCls, "cursor-pointer")}
                  onChange={(e) => setPreferredIndustry(e.target.value)}
                  value={preferredIndustry}
                >
                  <option value="">Select an industry</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </Field>

              <Field label="What is your dream company?">
                <input
                  className={inputCls}
                  onChange={(e) => setDreamCompany(e.target.value)}
                  placeholder="e.g. Google, Stripe"
                  value={dreamCompany}
                />
              </Field>

              <Field label="What is your location preference?">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#CCCCCC]" />
                  <input
                    className={cn(inputCls, "pl-9")}
                    onChange={(e) => setLocationPreference(e.target.value)}
                    placeholder="e.g. Austin, TX or Remote"
                    value={locationPreference}
                  />
                </div>
              </Field>

              <Field label="Do you prefer remote, hybrid, or in office?">
                <div className="flex overflow-hidden rounded-full border border-[#EEEEEE]">
                  {workPreferences.map((item) => (
                    <button
                      className={cn(
                        "flex-1 py-2.5 text-sm font-semibold transition-all duration-200",
                        workPreference === item
                          ? "bg-[#0A66C2] text-white"
                          : "bg-white text-[#666666] hover:bg-[#F7F9FC]"
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
                <textarea
                  className="min-h-24 w-full resize-none rounded-lg border border-[#EEEEEE] bg-white px-3 py-3 text-[15px] text-[#333333] outline-none transition-all placeholder:text-[#AAAAAA] hover:border-[#0A66C2]/40 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/10"
                  onChange={(e) => setWins(e.target.value)}
                  placeholder="e.g. Led a team of 5, shipped X feature, won Y award"
                  value={wins}
                />
              </Field>

              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A66C2] py-3.5 text-base font-black text-white transition-all hover:bg-[#004182] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.99]"
                disabled={!canSubmit || scraping}
                onClick={analyzeProfile}
                type="button"
              >
                {scraping ? "Analyzing your profile…" : "Analyze My Profile"}
                {!scraping && <ArrowRight className="h-5 w-5" />}
              </button>

            </div>
          </div>
      </section>

      {/* ── Trust Band ── */}
      <section className="w-full border-y border-[#EEEEEE] bg-[#F3F2EF] py-10">
        <div className="landing-container">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#AAAAAA]">
            A trusted platform used for applications at
          </p>
          <div className="mt-8 flex items-center justify-evenly">
            <img alt="Google" className="h-10 w-auto" src="/logo-google.svg" />
            <img alt="EY" className="h-10 w-auto" src="/logo-ey.svg" />
            <img alt="Goldman Sachs" className="h-10 w-auto" src="/logo-goldman-sachs.svg" />
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="landing-container py-20 text-center">
        <h2 className="text-3xl font-black text-[#333333] lg:text-4xl">Ready to get noticed by recruiters?</h2>
        <p className="mt-3 text-[15px] text-[#666666]">
          Join thousands of professionals improving their LinkedIn score today.
        </p>
        <button
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] px-10 py-4 text-lg font-black text-white transition-all hover:bg-[#004182] hover:shadow-xl active:scale-[0.98]"
          onClick={scrollToForm}
          type="button"
        >
          Analyze My Profile
          <ArrowRight className="h-5 w-5" />
        </button>
      </section>

    </main>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-black text-[#333333]">{label}</span>
      {children}
    </label>
  );
}
