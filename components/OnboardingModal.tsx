"use client";

import { ArrowRight, BarChart2, ListChecks, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ihl-onboarding-seen";

const slides = [
  {
    icon: <Search className="h-8 w-8 text-[#0A66C2]" />,
    title: "Know exactly why recruiters scroll past you",
    body: "Your LinkedIn score tells recruiters whether to click your profile. Most people never know what is costing them opportunities. Until now.",
  },
  {
    icon: <BarChart2 className="h-8 w-8 text-[#0A66C2]" />,
    title: "Get a score built around your target role",
    body: "We analyze your profile against the specific role, industry, and company you are going after. Not a generic checklist.",
    steps: [
      "Paste your LinkedIn URL",
      "Tell us your target role and dream company",
      "Receive a personalized score and fix roadmap",
    ],
  },
  {
    icon: <ListChecks className="h-8 w-8 text-[#0A66C2]" />,
    title: "Walk away with a fix roadmap",
    body: "Every fix is ranked by impact, labeled by difficulty, and ready to copy paste. Most users see a meaningful score improvement within a week.",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* private browsing */ }
    setOpen(false);
  }

  function next() {
    if (slide < slides.length - 1) {
      setSlide((s) => s + 1);
    } else {
      dismiss();
    }
  }

  if (!open) return null;

  const current = slides[slide];
  const isLast = slide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <button
        aria-label="Close"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-[#EEEEEE]">
        {/* Close */}
        <button
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Slide content */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0A66C2]/10">
            {current.icon}
          </div>
          <h2 className="mb-2 text-xl font-black text-[#222222]">{current.title}</h2>
          <p className="text-[15px] leading-relaxed text-[#666666]">{current.body}</p>

          {current.steps && (
            <ol className="mt-5 w-full space-y-2 text-left">
              {current.steps.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-[11px] font-black text-white">
                    {i + 1}
                  </span>
                  <span className="text-[14px] font-semibold text-[#444444]">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Progress dots */}
        <div className="mb-5 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              className="h-1.5 rounded-full transition-all duration-300"
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? "24px" : "6px",
                backgroundColor: i === slide ? "#0A66C2" : "#DDDDDD",
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A66C2] py-3 text-base font-black text-white transition-all hover:bg-[#004182] hover:shadow-lg active:scale-[0.99]"
          onClick={next}
        >
          {isLast ? "Let's go" : "Next"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
