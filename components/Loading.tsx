"use client";

import { useEffect, useMemo, useState } from "react";

const steps = ["Reading profile sections", "Mapping goals to signals", "Scoring profile strength", "Preparing fixes"];

const businessFacts = [
  "Recruiters often scan a profile headline before they read the About section.",
  "Specific numbers make experience bullets easier to trust and remember.",
  "A focused profile usually converts better than one that tries to speak to everyone.",
  "Your first two About lines do most of the work on mobile.",
  "Clear positioning helps people understand when to refer you.",
  "Strong profiles make the target audience obvious within a few seconds.",
  "Proof beats adjectives: shipped, grew, led, saved, closed, hired, launched.",
  "A narrow target role can make your profile look more senior, not less.",
  "Skills are stronger when they match the role you want next.",
  "Recent wins can make your profile feel current and active."
];

export function Loading({ label = "Loading" }: { label?: string }) {
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * businessFacts.length));
  const visibleFact = useMemo(() => businessFacts[factIndex], [factIndex]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFactIndex((index) => (index + 1) % businessFacts.length);
    }, 2600);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="grid min-h-dvh place-items-center overflow-hidden bg-slate-50 px-6">
      <div className="w-full max-w-xs text-center">
        <div className="relative mx-auto mb-7 grid h-24 w-24 place-items-center">
          <div className="absolute inset-0 rounded-full border border-teal-200" />
          <div className="absolute inset-2 animate-[pulse-ring_1.8s_ease-in-out_infinite] rounded-full bg-teal-100" />
          <div className="absolute h-24 w-24 animate-spin rounded-full border-4 border-transparent border-t-teal-600" />
          <div className="relative h-10 w-10 rounded-xl bg-teal-600 shadow-lg shadow-teal-900/20" />
        </div>
        <p className="text-base font-black text-slate-950">{label}</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-2/3 animate-[loading-bar_1.4s_ease-in-out_infinite] rounded-full bg-teal-600" />
        </div>

        <div className="mt-5 rounded-lg border border-teal-100 bg-white p-4 text-left shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wide text-teal-700">Business fact</p>
          <p className="mt-2 min-h-16 animate-[fact-fade_500ms_ease-out] text-sm font-semibold leading-6 text-slate-700" key={visibleFact}>
            {visibleFact}
          </p>
        </div>

        <div className="mt-5 space-y-2 text-left">
          {steps.map((step, index) => (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500" key={step}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" style={{ animationDelay: `${index * 160}ms` }} />
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
