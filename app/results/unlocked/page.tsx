"use client";

import { Check, ChevronLeft, Copy, LockKeyhole, RefreshCw } from "lucide-react";
import { ShareFooter } from "@/components/ShareFooter";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FixCard } from "@/components/FixCard";
import { Loading } from "@/components/Loading";
import { UnlockOnboardingModal } from "@/components/UnlockOnboardingModal";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { normalizeAnalysis } from "@/lib/analysis";
import { analytics } from "@/lib/analytics";
import { useAnalyzerStore, useStoreHydrated } from "@/lib/store";

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function UnlockedResultsPage() {
  const router = useRouter();
  const startedFixRefresh = useRef(false);
  const lockSectionRef = useRef<HTMLDivElement>(null);
  const [introLoading, setIntroLoading] = useState(false);
  const [refreshingFixes, setRefreshingFixes] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [unlockSent, setUnlockSent] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generatingShareLink, setGeneratingShareLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const hydrated = useStoreHydrated();
  const profile = useAnalyzerStore((state) => state.linkedinData);
  const contextAnswers = useAnalyzerStore((state) => state.contextAnswers);
  const storedAnalysis = useAnalyzerStore((state) => state.analysis);
  const analysis = normalizeAnalysis(storedAnalysis);
  const isFullyUnlocked = useAnalyzerStore((state) => state.isFullyUnlocked);
  const setAnalysis = useAnalyzerStore((state) => state.setAnalysis);
  const setLinkedinData = useAnalyzerStore((state) => state.setLinkedinData);
  const setFullyUnlocked = useAnalyzerStore((state) => state.setFullyUnlocked);
  const analysisId = useAnalyzerStore((state) => state.analysisId);

  const hasFixes = Boolean(analysis?.topFixes.length);

  useEffect(() => {
    if (analysis) analytics.unlockPageViewed(isFullyUnlocked);
  }, [analysis, isFullyUnlocked]);

  useEffect(() => {
    if (window.location.search.includes("preparing=1")) {
      setIntroLoading(true);
      window.history.replaceState(null, "", "/results/unlocked");
    }
  }, []);

  useEffect(() => {
    if (!introLoading) return;
    const timeout = window.setTimeout(() => setIntroLoading(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [introLoading]);

  useEffect(() => {
    if (!analysis || hasFixes || !profile || startedFixRefresh.current) return;
    startedFixRefresh.current = true;
    setRefreshingFixes(true);
    setRefreshFailed(false);

    async function refreshFixes() {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, contextAnswers })
        });
        if (!response.ok) {
          setRefreshFailed(true);
          return;
        }
        const data = await response.json();
        if (data.profile) setLinkedinData(data.profile);
        setAnalysis(data.analysis, data.analysisId);
      } catch {
        setRefreshFailed(true);
      } finally {
        setRefreshingFixes(false);
      }
    }

    void refreshFixes();
  }, [analysis, contextAnswers, hasFixes, profile, setAnalysis, setLinkedinData]);

  async function getOrCreateShareUrl(): Promise<string | null> {
    if (shareUrl) return shareUrl;
    if (!analysisId) return null;
    setGeneratingShareLink(true);
    try {
      const res = await fetch("/api/share-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { url: string };
      setShareUrl(data.url);
      return data.url;
    } catch {
      return null;
    } finally {
      setGeneratingShareLink(false);
    }
  }

  async function shareWhatsApp() {
    const url = await getOrCreateShareUrl();
    if (!url) { setUnlockError("Could not generate link. Please try again."); return; }
    const score = analysis?.overallScore ?? 0;
    const msg = `My LinkedIn just scored ${score}/100 on this free tool 👀\n\nIf you're job hunting, switching roles, or just curious — check yours in 2 min:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    analytics.inviteSent();
    setUnlockSent(true);
    window.setTimeout(() => setFullyUnlocked(true), 600);
  }

  async function copyShareLink() {
    const url = await getOrCreateShareUrl();
    if (!url) { setUnlockError("Could not generate link. Please try again."); return; }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      analytics.inviteSent();
      window.setTimeout(() => setCopiedLink(false), 2500);
      setUnlockSent(true);
      window.setTimeout(() => setFullyUnlocked(true), 800);
    } catch {
      setUnlockError("Could not copy. Please try again.");
    }
  }

  if (!hydrated) {
    return <main className="app-screen grid place-items-center px-4" />;
  }

  if (!analysis) {
    return (
      <main className="app-screen grid place-items-center px-4">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-sm text-slate-600">No analysis found on this device.</p>
          <Button onClick={() => router.push("/")}>Start Analysis</Button>
        </div>
      </main>
    );
  }

  if (introLoading || refreshingFixes) {
    return <Loading label="Preparing your personalized fixes" />;
  }

  const visibleFixes = hasFixes ? analysis.topFixes : [];
  const lockedFixes = hasFixes ? analysis.secondaryFixes.slice(0, 2) : [];
  const blurredPreview = lockedFixes.slice(0, 1);
  const allFixes = [...visibleFixes, ...lockedFixes];
  const bumpFor = (fix: { scoreBump?: number; difficulty: string }) =>
    fix.scoreBump ?? (fix.difficulty === "Easy" ? 4 : fix.difficulty === "Hard" ? 8 : 6);
  const totalBump = allFixes.reduce((sum, fix) => sum + bumpFor(fix), 0);
  const projectedScore = Math.min(100, analysis.overallScore + totalBump);

  function scrollToLock() {
    lockSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main className="flex h-dvh w-full flex-col bg-[#F3F2EF]">
      <UnlockOnboardingModal isFullyUnlocked={isFullyUnlocked} onInviteNow={scrollToLock} />
      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="app-container">
        <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-x-0.5 hover:text-slate-950"
              onClick={() => router.push("/results")}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              Overview
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-black text-white transition-all duration-200 hover:bg-teal-700 hover:shadow-md active:scale-[0.97]"
              onClick={() => router.push("/")}
              type="button"
            >
              <RefreshCw className="h-3 w-3" />
              Analyze Again
            </button>
          </div>
        </div>
        <div className="py-5">
          <section className="mb-5 flex items-start justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div>
              <Badge tone="teal">Fixes Unlocked</Badge>
              <h1 className="mt-2 text-2xl font-black text-slate-950">Your Personalized Fixes</h1>
              <p className="mt-1 text-xs font-semibold text-slate-500">Potential score after all fixes</p>
            </div>
            <ScoreBadge score={projectedScore} />
          </section>

          {!hasFixes && (
            <div className="mb-5 rounded-lg bg-white p-4 text-sm font-semibold leading-6 text-slate-600 shadow-sm ring-1 ring-slate-200">
              {refreshFailed
                ? "Your personalized fixes could not be prepared. Please run the analysis again."
                : "Your personalized fixes are being prepared."}
            </div>
          )}

          {visibleFixes.length > 0 && (
            <div className="mb-2 space-y-3">
              {visibleFixes.map((fix) => (
                <FixCard key={fix.title} fix={fix} />
              ))}
            </div>
          )}

          {lockedFixes.length > 0 && (
            <div className="mb-4">
              {isFullyUnlocked ? (
                <div className="space-y-3">
                  {lockedFixes.map((fix) => (
                    <FixCard key={fix.title} fix={fix} />
                  ))}
                </div>
              ) : (
                <div>
                  <div className="pointer-events-none select-none space-y-3 opacity-30 blur-sm">
                    {blurredPreview.map((fix) => (
                      <FixCard key={fix.title} fix={fix} />
                    ))}
                  </div>
                  <div ref={lockSectionRef} className="mt-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <LockKeyhole className="h-5 w-5 text-teal-600" />
                      <h3 className="font-black text-slate-950">Unlock {lockedFixes.length} More Fixes</h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      Share with anyone on LinkedIn — job hunting, switching roles, or just curious. One share reveals everything instantly.
                    </p>
                    {unlockError && (
                      <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{unlockError}</p>
                    )}
                    {unlockSent ? (
                      <div className="rounded-lg bg-teal-50 p-3 text-sm font-semibold text-teal-800">
                        {copiedLink ? "Link copied! Unlocking your fixes…" : "Shared! Unlocking your fixes…"}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={shareWhatsApp}
                          disabled={generatingShareLink}
                          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] py-3 text-sm font-black text-white transition-all hover:bg-[#1ebe5d] hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                        >
                          <WhatsAppIcon />
                          {generatingShareLink ? "Generating link…" : "Share on WhatsApp"}
                        </button>
                        <button
                          onClick={copyShareLink}
                          disabled={generatingShareLink}
                          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-3 text-sm font-black text-slate-800 transition-all hover:border-slate-300 hover:shadow-sm active:scale-[0.98] disabled:opacity-60"
                        >
                          {copiedLink ? <Check className="h-4 w-4 text-teal-600" /> : <Copy className="h-4 w-4" />}
                          {copiedLink ? "Copied!" : "Copy Invite Link"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      <ShareFooter onShared={() => setFullyUnlocked(true)} />
    </main>
  );
}
