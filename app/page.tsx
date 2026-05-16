"use client";

import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { normalizeLinkedInProfile } from "@/lib/profile-normalize";
import { useAnalyzerStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ContextAnswers, LinkedInProfile, Seniority } from "@/lib/types";
import { OnboardingModal } from "@/components/OnboardingModal";
import { analytics } from "@/lib/analytics";

const SENIORITY_OPTIONS: Seniority[] = [
  "Internship",
  "Entry-level",
  "Associate",
  "Mid-level",
  "Senior",
  "Lead / Staff",
  "Manager",
  "Executive",
  "Student"
];

const ROLE_GROUPS = [
  {
    label: "Software / Engineering",
    roles: [
      "Frontend Engineer",
      "Backend Engineer",
      "Full Stack Engineer",
      "Software Engineer",
      "Mobile Engineer",
      "DevOps Engineer",
      "Machine Learning Engineer",
      "AI Engineer",
      "Data Engineer",
      "QA Engineer"
    ]
  },
  {
    label: "Data",
    roles: [
      "Data Analyst",
      "Business Intelligence Analyst",
      "Product Analyst",
      "Data Scientist",
      "Analytics Engineer"
    ]
  },
  {
    label: "Product / Design",
    roles: [
      "Associate Product Manager",
      "Product Manager",
      "Product Designer",
      "UX Designer",
      "UI Designer"
    ]
  },
  {
    label: "Business / Finance",
    roles: [
      "Business Analyst",
      "Strategy Analyst",
      "Management Consultant",
      "Investment Banking Analyst",
      "Financial Analyst",
      "Operations Analyst"
    ]
  },
  {
    label: "Marketing / Sales",
    roles: [
      "Growth Marketer",
      "Digital Marketing Specialist",
      "Content Marketer",
      "Sales Development Representative",
      "Account Executive"
    ]
  }
];

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

function inferGoal(role: string, seniority: Seniority | ""): ContextAnswers["goal"] {
  const n = role.toLowerCase();
  return seniority === "Internship" || n.includes("intern") || n.includes("summer analyst") ? "Internship Search" : "Job Search";
}

function formatTargetRole(role: string, seniority: Seniority | "") {
  const trimmedRole = role.trim();
  const normalizedRole = trimmedRole.toLowerCase();
  if (!trimmedRole || !seniority) return trimmedRole;
  if (seniority === "Internship") return `${trimmedRole} Intern`;
  if (seniority === "Student") return `Student targeting ${trimmedRole}`;
  if (normalizedRole.startsWith(`${seniority.toLowerCase()} `)) return trimmedRole;
  return `${seniority} ${trimmedRole}`;
}

export default function HomePage() {
  const router = useRouter();
  const setLinkedinData = useAnalyzerStore((state) => state.setLinkedinData);
  const setContextAnswers = useAnalyzerStore((state) => state.setContextAnswers);
  const resetContext = useAnalyzerStore((state) => state.resetContext);
  const clearAnalysis = useAnalyzerStore((state) => state.clearAnalysis);

  const [profileUrl, setProfileUrl] = useState("");
  const [targetRoleSelection, setTargetRoleSelection] = useState("");
  const [customTargetRole, setCustomTargetRole] = useState("");
  const [seniority, setSeniority] = useState<Seniority | "">("");
  const [preferredIndustry, setPreferredIndustry] = useState("");
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState("");

  const selectedRole = targetRoleSelection === "Other" ? customTargetRole.trim() : targetRoleSelection;
  const targetRole = formatTargetRole(selectedRole, seniority);
  const requiredFields = [profileUrl, selectedRole, seniority, preferredIndustry];
  const filledCount = requiredFields.filter((f) => f.trim()).length;
  const progress = Math.round((filledCount / 4) * 100);

  const canSubmit = Boolean(
    profileUrl.trim() && selectedRole.trim() && seniority && preferredIndustry.trim()
  );

  function scrollToForm() {
    document.getElementById("profile-intake")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function analyzeProfile() {
    if (!canSubmit) return;
    setError("");
    setScraping(true);
    analytics.analysisStarted(targetRole, preferredIndustry.trim());
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
        goal: inferGoal(targetRole, seniority),
        seniority,
        industry: preferredIndustry.trim(),
        targetRole,
        geography: "",
        city: "",
        timeline: "",
        challenges: [],
        targetCompanies: "",
        outcome: `You are targeting ${targetRole} roles in ${preferredIndustry.trim()}.`,
        networkSize: "",
        relocation: null,
        workPreference: "",
        wins: ""
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
      <OnboardingModal />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 w-full border-b border-[#0A66C2]/40 bg-white/95 backdrop-blur" style={{ boxShadow: "0 1px 16px rgba(10,102,194,0.22)" }}>
        <div className="landing-container flex items-center justify-between py-3">
          <div className="flex items-center">
            <img src="/logo-iheartlinkedin.svg" alt="iHeartLinkedIn" style={{ height: "32px", width: "auto" }} />
          </div>
          <button
            className="try-now-btn inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-4 py-2 text-xs font-black text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#004182] hover:shadow-md active:scale-[0.97]"
            onClick={scrollToForm}
            type="button"
          >
            Try Now
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
      <section className="w-full bg-[#0A66C2]/[0.08] px-6 pb-6">
        <h1 className="pt-6 pb-4 text-[2.4rem] font-black leading-[1.06] text-[#0A66C2]">
          Get Recruited,<br />Don&apos;t Just Apply.
        </h1>
        <div className="overflow-hidden">
          <Image
            alt="Before and after LinkedIn profile transformation"
            className="h-auto w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.06]"
            height={454}
            priority
            src="/hero-before-after.png"
            width={492}
          />
        </div>
      </section>

      {/* ── Copy + Form ── */}
      <section className="landing-container py-8" id="profile-intake">
          <ul className="mb-7 space-y-4">
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
                <select
                  className={cn(inputCls, "cursor-pointer")}
                  onChange={(e) => setTargetRoleSelection(e.target.value)}
                  value={targetRoleSelection}
                >
                  <option value="">Select a target role</option>
                  {ROLE_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.roles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="Other">Other / Custom title</option>
                </select>
              </Field>

              {targetRoleSelection === "Other" ? (
                <Field label="Enter your target role">
                  <input
                    className={inputCls}
                    onChange={(e) => setCustomTargetRole(e.target.value)}
                    placeholder="e.g. Customer Success Manager"
                    value={customTargetRole}
                  />
                </Field>
              ) : null}

              <Field label="What seniority are you targeting?">
                <select
                  className={cn(inputCls, "cursor-pointer")}
                  onChange={(e) => setSeniority(e.target.value as Seniority | "")}
                  value={seniority}
                >
                  <option value="">Select seniority</option>
                  {SENIORITY_OPTIONS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
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
      <section className="w-full border-y border-[#0A66C2]/20 bg-[#0A66C2]/[0.08] py-10">
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

      {/* ── Footer ── */}
      <footer className="w-full border-t border-[#0A66C2]/30 bg-white" style={{ boxShadow: "0 -4px 16px rgba(10,102,194,0.12)" }}>
        <div className="landing-container py-3 text-center text-xs font-semibold text-[#666666]">
          iHeartLinkedIn by{" "}
          <a
            href="https://www.linkedin.com/in/vanshpandita-real/?skipRedirect=true"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0A66C2] hover:underline"
          >
            Vansh Pandita
          </a>
        </div>
      </footer>

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
