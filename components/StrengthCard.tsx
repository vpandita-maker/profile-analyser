import type { AnalysisItem } from "@/lib/types";

export function StrengthCard({ item }: { item: AnalysisItem }) {
  return (
    <article className="cursor-pointer rounded-lg border border-teal-200 bg-teal-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md active:-translate-y-0.5 active:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-bold text-teal-700">{item.score}/10</span>
      </div>
      {item.profileEvidence ? (
        <div className="mb-3 rounded-md bg-white/70 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-wide text-teal-700">Profile evidence</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{item.profileEvidence}</p>
        </div>
      ) : null}
      <p className="text-sm leading-6 text-slate-600">{item.explanation}</p>
      {item.whyThisMattersForYou ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-teal-800">{item.whyThisMattersForYou}</p>
      ) : null}
    </article>
  );
}
