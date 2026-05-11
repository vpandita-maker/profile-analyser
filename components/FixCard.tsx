"use client";

import { Check, Clipboard, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { FixItem } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function FixCard({ fix, defaultOpen = false }: { fix: FixItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(fix.recommended);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300">
      <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen((value) => !value)}>
        <div>
          <h3 className="text-base font-bold text-slate-950">{fix.title}</h3>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={fix.difficulty === "Easy" ? "green" : fix.difficulty === "Hard" ? "red" : "amber"}>
              {fix.difficulty}
            </Badge>
            {fix.scoreBump ? (
              <span className="text-xs font-bold text-emerald-600">+{fix.scoreBump} pts</span>
            ) : null}
          </div>
        </div>
        <ChevronDown className={cn("mt-1 h-5 w-5 shrink-0 text-slate-400 transition", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Current</p>
            <p className="font-mono text-xs leading-5 text-slate-600">{fix.current}</p>
          </div>
          <div className="rounded-lg bg-teal-50 p-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-teal-700">Recommended</p>
            <p className="font-mono text-xs font-bold leading-5 text-slate-900">{fix.recommended}</p>
          </div>
          <p className="text-sm leading-6 text-slate-600">{fix.whyMatters}</p>
          <Button variant="secondary" className="h-9 min-h-9 text-xs" onClick={copy}>
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
            {copied ? "Copied" : "Copy to Clipboard"}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
