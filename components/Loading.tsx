const steps = ["Reading profile sections", "Mapping goals to signals", "Scoring profile strength", "Preparing fixes"];

export function Loading({ label = "Loading" }: { label?: string }) {
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
