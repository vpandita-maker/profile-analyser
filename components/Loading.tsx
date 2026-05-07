import { Loader2 } from "lucide-react";

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-50 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  );
}
