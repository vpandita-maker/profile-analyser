"use client";

import { ArrowRight, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAnalyzerStore } from "@/lib/store";

export default function ProfileImportPage() {
  const router = useRouter();
  const linkedinData = useAnalyzerStore((state) => state.linkedinData);
  const mergeLinkedinData = useAnalyzerStore((state) => state.mergeLinkedinData);
  const [profileUrl, setProfileUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState("");

  async function importFromUrl() {
    setError("");
    setScraping(true);

    const response = await fetch("/api/profile/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileUrl })
    });
    const data = await response.json();
    setScraping(false);

    if (!response.ok) {
      setError(data.error || "Could not import this profile automatically.");
      return;
    }

    mergeLinkedinData({
      ...data.profile,
      linkedinId: data.profile.linkedinId || linkedinData?.linkedinId || "profile-user",
      name: data.profile.name || linkedinData?.name || "Profile Member",
      photo: data.profile.photo || linkedinData?.photo,
      email: data.profile.email || linkedinData?.email,
      importSource: "scrape"
    });
    router.push("/questions");
  }

  return (
    <main className="safe-bottom min-h-dvh bg-slate-50 px-4 py-5">
      <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-md flex-col justify-between">
        <div>
          <div className="mb-8 flex items-center justify-center gap-2 text-sm font-bold text-slate-950">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-white">
              <FileText className="h-4 w-4" />
            </span>
            Profile Import
          </div>

          <h1 className="mx-auto max-w-sm text-left text-3xl font-black leading-tight text-slate-950">Add your LinkedIn profile URL.</h1>
          <p className="mx-auto mt-4 max-w-sm text-left text-base leading-7 text-slate-600">
            Paste the URL to your profile. That is all we need to start your review.
          </p>
        </div>

        <div className="space-y-3">
          {error ? <Card className="border border-red-200 bg-red-50 text-sm leading-6 text-red-700">{error}</Card> : null}

          <div className="mx-auto max-w-xs space-y-2">
            <Input
              inputMode="url"
              onChange={(event) => setProfileUrl(event.target.value)}
              placeholder="Add your LinkedIn profile link here"
              value={profileUrl}
            />
            <Button disabled={!profileUrl.trim() || scraping} loading={scraping} onClick={importFromUrl}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
