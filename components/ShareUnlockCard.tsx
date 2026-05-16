"use client";

import { Check, Copy, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { analytics } from "@/lib/analytics";
import { useAnalyzerStore } from "@/lib/store";

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

type ShareUnlockCardProps = {
  lockedCount: number;
  onUnlocked: () => void;
  title?: string;
  description?: string;
};

export function ShareUnlockCard({
  lockedCount,
  onUnlocked,
  title = `Unlock ${lockedCount} More Fixes`,
  description = `Share with anyone job hunting, switching roles, or just curious. You unlock ${lockedCount} more profile fixes for yourself, they discover exactly what's limiting their recruiter visibility.`
}: ShareUnlockCardProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generatingShareLink, setGeneratingShareLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [unlockSent, setUnlockSent] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  const analysisId = useAnalyzerStore((state) => state.analysisId);

  async function getOrCreateShareUrl(): Promise<string | null> {
    if (shareUrl) return shareUrl;
    if (!analysisId) return null;
    setGeneratingShareLink(true);
    try {
      const res = await fetch("/api/share-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId })
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
    if (!url) {
      setUnlockError("Could not generate link. Please try again.");
      return;
    }
    const msg = `Recruiters spend less than 6 seconds on your LinkedIn profile. I just scored mine and found what was preventing recruiter conversations. If you want to attract better opportunities, check yours: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    analytics.inviteSent();
    setUnlockSent(true);
    window.setTimeout(onUnlocked, 700);
  }

  async function copyShareLink() {
    const url = await getOrCreateShareUrl();
    if (!url) {
      setUnlockError("Could not generate link. Please try again.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      analytics.inviteSent();
      setUnlockSent(true);
      window.setTimeout(onUnlocked, 900);
    } catch {
      setUnlockError("Could not copy. Please try again.");
    }
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 space-y-3">
      <div className="flex items-center gap-2">
        <LockKeyhole className="h-5 w-5 text-teal-600" />
        <h3 className="font-black text-slate-950">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-slate-600">{description}</p>
      {unlockError ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{unlockError}</p>
      ) : null}
      {unlockSent ? (
        <div className="rounded-lg bg-teal-50 p-3 text-sm font-semibold text-teal-800">
          {copiedLink ? "Link copied! Unlocking your fixes..." : "Shared! Unlocking your fixes..."}
        </div>
      ) : (
        <>
          <button
            onClick={shareWhatsApp}
            disabled={generatingShareLink}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] py-3 text-sm font-black text-white transition-all hover:bg-[#1ebe5d] hover:shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            <WhatsAppIcon />
            {generatingShareLink ? "Generating link..." : "Share on WhatsApp"}
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
  );
}
