"use client";

import { Gift, LockKeyhole, LockKeyholeOpen, X } from "lucide-react";
import { useState } from "react";

interface Props {
  isFullyUnlocked: boolean;
  onInviteNow: () => void;
}

export function UnlockOnboardingModal({ isFullyUnlocked, onInviteNow }: Props) {
  const [open, setOpen] = useState(!isFullyUnlocked);

  function dismiss() {
    setOpen(false);
  }

  function handleInviteNow() {
    dismiss();
    onInviteNow();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button aria-label="Close" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={dismiss} />

      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-[#EEEEEE]">
        {/* Header */}
        <div className="relative rounded-t-2xl bg-gradient-to-br from-[#001E3C] to-[#0A66C2] px-6 py-8 text-center">
          <button
            aria-label="Close"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20"
            onClick={dismiss}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-black text-white">You have 2 hidden fixes</h2>
          <p className="mt-1 text-sm text-white/70">Invite one friend to reveal them instantly</p>
        </div>

        {/* Steps */}
        <div className="px-6 py-5">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A66C2]/10">
                <LockKeyhole className="h-4 w-4 text-[#0A66C2]" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">2 fixes are locked right now</p>
                <p className="text-xs text-slate-500 leading-relaxed">They're blurred below your current results</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A66C2]/10">
                <span className="text-sm font-black text-[#0A66C2]">@</span>
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Enter a friend&apos;s email</p>
                <p className="text-xs text-slate-500 leading-relaxed">They&apos;ll get a personal invite to improve their own LinkedIn</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <LockKeyholeOpen className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Your 2 fixes unlock instantly</p>
                <p className="text-xs text-slate-500 leading-relaxed">No waiting — they reveal the moment you send</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A66C2] py-3 text-sm font-black text-white transition-all hover:bg-[#004182] hover:shadow-lg active:scale-[0.99]"
              onClick={handleInviteNow}
            >
              Invite a Friend & Unlock
            </button>
            <button
              className="w-full py-2 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600"
              onClick={dismiss}
            >
              I&apos;ll do it later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
