"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/Modal";
import { useAnalyzerStore } from "@/lib/store";
import { isEmail } from "@/lib/utils";

export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const analysisId = useAnalyzerStore((state) => state.analysisId);
  const setUnlocked = useAnalyzerStore((state) => state.setUnlocked);

  async function sendInvite() {
    if (!analysisId || !isEmail(email)) return;
    setLoading(true);
    const response = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId, friendEmail: email })
    });
    if (response.ok) {
      setSent(true);
      setUnlocked(true);
      window.setTimeout(onClose, 1200);
    }
    setLoading(false);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Unlock Your Fixes">
      {sent ? (
        <div className="rounded-lg bg-teal-50 p-4 text-sm font-semibold text-teal-800">Invite sent. Your personalized fixes are unlocked for this MVP flow.</div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">Invite a friend to unlock detailed recommendations.</p>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Friend's email" inputMode="email" />
          <Button disabled={!isEmail(email)} loading={loading} onClick={sendInvite}>
            Send Invite
          </Button>
          <p className="text-xs leading-5 text-slate-500">They&apos;ll get an invite. When they sign up, your fixes unlock.</p>
        </div>
      )}
    </BottomSheet>
  );
}
