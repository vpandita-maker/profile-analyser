import { HTMLAttributes } from "react";
import { cn, scoreTone } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "teal" | "blue" | "red" | "gray" | "green" | "amber";
}

export function Badge({ className, tone = "gray", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "teal" && "bg-teal-50 text-teal-700",
        tone === "blue" && "bg-blue-50 text-blue-700",
        tone === "red" && "bg-red-50 text-red-700",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "amber" && "bg-amber-50 text-amber-800",
        tone === "gray" && "bg-slate-100 text-slate-700",
        className
      )}
      {...props}
    />
  );
}

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  return (
    <div className={cn("grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br shadow-soft", scoreTone(score), className)}>
      <span className="text-3xl font-black leading-none">{score}</span>
    </div>
  );
}
