"use client";

import { ArrowRight, FileText, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAnalyzerStore } from "@/lib/store";
import { useEffect } from "react";

export default function ProfileImportPage() {
  const router = useRouter();
  const linkedinData = useAnalyzerStore((state) => state.linkedinData);
  const mergeLinkedinData = useAnalyzerStore((state) => state.mergeLinkedinData);
  const [profileUrl, setProfileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(false);

  useEffect(() => {
    if (!linkedinData) {
      router.replace("/");
    }
  }, [linkedinData, router]);

  async function importProfile(file?: File) {
    setError("");
    setLoading(true);

    const formData = new FormData();
    if (file) formData.append("file", file);

    const response = await fetch("/api/profile/import", {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not import this profile.");
      return;
    }

    mergeLinkedinData({
      ...data.profile,
      linkedinId: linkedinData?.linkedinId || "profile-user",
      name: linkedinData?.name || "Profile Member",
      photo: linkedinData?.photo,
      email: linkedinData?.email,
      importSource: "pdf"
    });
    setImported(true);
  }

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
      linkedinId: linkedinData?.linkedinId || "profile-user",
      name: data.profile.name || linkedinData?.name || "Profile Member",
      photo: data.profile.photo || linkedinData?.photo,
      email: linkedinData?.email,
      importSource: "scrape"
    });
    setImported(true);
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    await importProfile(file);
  }

  return (
    <main className="safe-bottom min-h-dvh bg-slate-50 px-4 py-5">
      <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-md flex-col justify-between">
        <div className="text-center">
          <div className="mb-8 flex items-center justify-center gap-2 text-sm font-bold text-slate-950">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-white">
              <FileText className="h-4 w-4" />
            </span>
            Profile Import
          </div>

          <h1 className="mx-auto max-w-sm text-3xl font-black leading-tight text-slate-950">Import your profile for a sharper review.</h1>
          <p className="mx-auto mt-4 max-w-sm text-base leading-7 text-slate-600">
            Paste your LinkedIn profile URL. If that fails, upload your saved PDF instead.
          </p>
        </div>

        <div className="space-y-3">
          {error ? <Card className="border border-red-200 bg-red-50 text-sm leading-6 text-red-700">{error}</Card> : null}
          {imported ? (
            <Card className="border border-teal-200 bg-teal-50 text-sm leading-6 text-teal-800">
              Imported {fileName || "your profile"}. Your analysis will use these profile sections.
            </Card>
          ) : null}

          <div className="mx-auto max-w-xs space-y-2">
            <Input
              inputMode="url"
              onChange={(event) => setProfileUrl(event.target.value)}
              placeholder="https://www.linkedin.com/in/yourname"
              value={profileUrl}
            />
            <Button disabled={!profileUrl.trim() || loading} loading={scraping} onClick={importFromUrl}>
              Import from LinkedIn
            </Button>
          </div>

          <div className="mx-auto max-w-xs text-center text-xs font-bold uppercase tracking-wide text-slate-400">PDF fallback</div>

          <label className="group mx-auto flex min-h-28 w-full max-w-xs cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 text-center shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-teal-500 hover:bg-teal-50 hover:shadow-lg hover:shadow-teal-900/10 active:translate-y-0 active:scale-[0.99]">
            <Upload className="mb-2 h-6 w-6 text-teal-600 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110" />
            <span className="text-sm font-bold text-slate-950">{fileName || "Upload LinkedIn PDF"}</span>
            <span className="mt-1 text-xs leading-5 text-slate-500">PDF only, under 8MB</span>
            <input className="sr-only" type="file" accept="application/pdf,.pdf" onChange={onFileChange} />
          </label>

          <Button className="mx-auto max-w-xs" disabled={!imported || loading || scraping} loading={loading} onClick={() => router.push("/questions")}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
  );
}
