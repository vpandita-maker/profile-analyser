"use client";

import { useEffect, useMemo, useState } from "react";

const steps = ["Reading profile sections", "Mapping goals to signals", "Scoring profile strength", "Preparing fixes"];

const businessFacts = [
  "The first barcode scanned in a store was on a pack of Wrigley's gum in 1974.",
  "FedEx was originally called Federal Express before the shorter brand name took over.",
  "The term unicorn is used for private startups valued at $1 billion or more.",
  "IKEA names many products using Swedish places, people, and common words.",
  "Nintendo started in 1889 as a company that made playing cards.",
  "The first McDonald's franchise opened in Des Plaines, Illinois in 1955.",
  "The S&P 500 tracks 500 large public companies listed in the United States.",
  "Amazon started as an online bookstore before expanding into almost every category.",
  "Airbnb's founders first rented out air mattresses during a design conference.",
  "Coca-Cola was first sold at a pharmacy soda fountain in Atlanta."
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
