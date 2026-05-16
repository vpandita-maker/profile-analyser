"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/Modal";
import { useAnalyzerStore } from "@/lib/store";
import { isEmail } from "@/lib/utils";

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const analysisId = useAnalyzerStore((state) => state.analysisId);
  const setUnlocked = useAnalyzerStore((state) => state.setUnlocked);
  const inviterName = useAnalyzerStore((state) => state.linkedinData?.name);
  const score = useAnalyzerStore((state) => state.analysis?.overallScore ?? 0);

  async function getOrCreateShareUrl(): Promise<string | null> {
    if (shareUrl) return shareUrl;
    if (!analysisId) return null;
    setGeneratingLink(true);
    try {
      const res = await fetch("/api/share-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { url: string };
      setShareUrl(data.url);
      setUnlocked(true);
      return data.url;
    } catch {
      return null;
    } finally {
      setGeneratingLink(false);
    }
  }

  async function shareWhatsApp() {
    const url = await getOrCreateShareUrl();
    if (!url) { setError("Could not generate link. Please try again."); return; }
    const scoreText = score > 0 ? `My LinkedIn just scored ${score}/100 on this free tool 👀\n\n` : "";
    const msg = `${scoreText}If you're job hunting, switching roles, or just curious — check yours in 2 min:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    setSent(true);
    window.setTimeout(() => { onClose(); router.push("/results/unlocked?preparing=1"); }, 700);
  }

  async function copyLink() {
    const url = await getOrCreateShareUrl();
    if (!url) { setError("Could not generate link. Please try again."); return; }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setSent(true);
      window.setTimeout(() => { onClose(); router.push("/results/unlocked?preparing=1"); }, 900);
    } catch {
      setError("Could not copy. Please try again.");
    }
  }

  async function sendInvite() {
    if (!isEmail(email)) return;
    if (!analysisId) {
      setError("Run your analysis again before sending an invite.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, friendEmail: email, inviterName }),
      });
      if (!response.ok) {
        setError("Invite could not be sent. Please try again.");
        return;
      }
      setSent(true);
      setUnlocked(true);
      window.setTimeout(() => { onClose(); router.push("/results/unlocked?preparing=1"); }, 700);
    } catch {
      setError("Invite could not be sent. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Unlock Your Fixes">
      {sent ? (
        <div className="rounded-lg bg-teal-50 p-4 text-sm font-semibold text-teal-800">
          {copied ? "Link copied! Unlocking your fixes…" : "Shared! Your personalized fixes are unlocked."}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-slate-600">
            Share with anyone on LinkedIn — job hunting, switching roles, or just curious about their score. One share unlocks your fixes instantly.
          </p>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

          <button
            onClick={shareWhatsApp}
            disabled={generatingLink}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] py-3.5 text-sm font-black text-white transition-all hover:bg-[#1ebe5d] hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
          >
            <WhatsAppIcon />
            {generatingLink ? "Generating link…" : "Share on WhatsApp"}
          </button>

          <button
            onClick={copyLink}
            disabled={generatingLink}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-black text-slate-800 transition-all hover:border-slate-300 hover:shadow-sm active:scale-[0.98] disabled:opacity-60"
          >
            {copied ? <Check className="h-4 w-4 text-teal-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Invite Link"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[11px] text-slate-400">or send by email</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Their email address" inputMode="email" />
          <Button disabled={!isEmail(email)} loading={loading} onClick={sendInvite}>
            Send Invite
          </Button>
          <p className="text-xs leading-5 text-slate-500">Your fixes unlock the moment you share.</p>
        </div>
      )}
    </BottomSheet>
  );
}
