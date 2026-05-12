import type { AnalysisItem } from "@/lib/types";

export function StrengthCard({ item }: { item: AnalysisItem }) {
  return (
    <article className="rounded-lg bg-teal-50 p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-teal-700">{item.score}/10</span>
      </div>
      <p className="text-sm leading-6 text-slate-600">{item.explanation}</p>
    </article>
  );
}
