import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition-all duration-200 placeholder:text-slate-400 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus:-translate-y-0.5 focus:border-blue-500 focus:shadow-md",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus:-translate-y-0.5 focus:border-blue-500 focus:shadow-md",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-950 outline-none transition-all duration-200 placeholder:text-slate-400 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus:-translate-y-0.5 focus:border-blue-500 focus:shadow-md",
        className
      )}
      {...props}
    />
  );
}
