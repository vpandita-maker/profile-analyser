"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/Modal";
import { useAnalyzerStore } from "@/lib/store";
import { isEmail } from "@/lib/utils";

export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const analysisId = useAnalyzerStore((state) => state.analysisId);
  const setUnlocked = useAnalyzerStore((state) => state.setUnlocked);

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
        body: JSON.stringify({ analysisId, friendEmail: email })
      });
      if (!response.ok) {
        setError("Invite could not be sent. Please try again.");
        return;
      }
      setSent(true);
      setUnlocked(true);
      window.setTimeout(() => {
        onClose();
        router.push("/results/unlocked");
      }, 700);
    } catch {
      setError("Invite could not be sent. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Unlock Your Fixes">
      {sent ? (
        <div className="rounded-lg bg-teal-50 p-4 text-sm font-semibold text-teal-800">Invite sent. Your personalized fixes are unlocked.</div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">Invite a friend to unlock detailed recommendations.</p>
          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Friend's email" inputMode="email" />
          <Button disabled={!isEmail(email)} loading={loading} onClick={sendInvite}>
            Send Invite
          </Button>
          <p className="text-xs leading-5 text-slate-500">They&apos;ll get an invite instantly. Your fixes unlock as soon as you send it.</p>
        </div>
      )}
    </BottomSheet>
  );
}
