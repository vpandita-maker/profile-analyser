"use client";

import { Gift, LockKeyhole, LockKeyholeOpen, X } from "lucide-react";
import { useState } from "react";

interface Props {
  isFullyUnlocked: boolean;
  onInviteNow: () => void;
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export function UnlockOnboardingModal({ isFullyUnlocked, onInviteNow }: Props) {
  const [open, setOpen] = useState(!isFullyUnlocked);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button aria-label="Close" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-[#EEEEEE]">
        {/* Header */}
        <div className="relative rounded-t-2xl bg-gradient-to-br from-[#001E3C] to-[#0A66C2] px-6 py-8 text-center">
          <button
            aria-label="Close"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-black text-white">You have 2 hidden fixes</h2>
          <p className="mt-1 text-sm text-white/70">Share to reveal them instantly</p>
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
                <p className="text-xs text-slate-500 leading-relaxed">They&apos;re blurred below your current results</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10">
                <WhatsAppIcon />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Share on WhatsApp or copy your link</p>
                <p className="text-xs text-slate-500 leading-relaxed">Send to anyone on LinkedIn — job hunting, switching roles, or just curious</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <LockKeyholeOpen className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Your 2 fixes unlock instantly</p>
                <p className="text-xs text-slate-500 leading-relaxed">No waiting — they reveal the moment you share</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-black text-white transition-all hover:bg-[#1ebe5d] hover:shadow-lg active:scale-[0.99]"
              onClick={() => { setOpen(false); onInviteNow(); }}
            >
              <WhatsAppIcon />
              Share & Unlock
            </button>
            <button
              className="w-full py-2 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600"
              onClick={() => setOpen(false)}
            >
              I&apos;ll do it later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
