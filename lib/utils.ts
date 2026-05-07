import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function scoreTone(score: number) {
  if (score < 50) return "from-rose-500 to-red-600 text-white";
  if (score <= 75) return "from-amber-400 to-yellow-500 text-slate-950";
  return "from-emerald-400 to-teal-600 text-white";
}

export function compactList(values?: string[]) {
  return values?.filter(Boolean).join(", ") || "Not specified";
}
