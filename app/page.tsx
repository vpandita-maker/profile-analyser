"use client";

import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { normalizeLinkedInProfile } from "@/lib/profile-normalize";
import { useAnalyzerStore } from "@/lib/store";
import type { LinkedInProfile } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const setLinkedinData = useAnalyzerStore((state) => state.setLinkedinData);
  const resetContext = useAnalyzerStore((state) => state.resetContext);
  const clearAnalysis = useAnalyzerStore((state) => state.clearAnalysis);
  const [profileUrl, setProfileUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState("");

  async function analyzeProfile() {
    const trimmedUrl = profileUrl.trim();

    if (!trimmedUrl) {
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
      setLinkedinData(importedProfile || ({
        ...data.profile,
        linkedinId: data.profile.linkedinId || "profile-user",
        profileUrl: trimmedUrl,
        name: data.profile.name || "LinkedIn Member",
        importSource: "scrape"
      } satisfies LinkedInProfile));
      router.push("/questions");
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
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-white">
                <FileText className="h-4 w-4" />
              </span>
              Profile Analyzer
            </div>
            <Sparkles className="h-5 w-5 text-teal-600" />
          </div>

          <h1 className="text-4xl font-black leading-tight text-slate-950">Align your LinkedIn to the job or internship you want.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Add your LinkedIn profile URL, tell us the role you are targeting, and get a personalized analysis with specific fixes for recruiters, referrals, and applications.
          </p>

          <div className="app-form-stack space-y-3">
            {error ? <Card className="border border-red-200 bg-red-50 text-sm leading-6 text-red-700">{error}</Card> : null}
            <Input
              inputMode="url"
              onChange={(event) => setProfileUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void analyzeProfile();
                }
              }}
              placeholder="Add your LinkedIn profile link here"
              value={profileUrl}
            />
            <Button disabled={!profileUrl.trim() || scraping} loading={scraping} onClick={analyzeProfile}>
              Analyze My Profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </section>
    </main>
  );
}
