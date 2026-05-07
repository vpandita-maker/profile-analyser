"use client";

import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({ className, variant = "primary", fullWidth = true, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
        fullWidth && "w-full",
        variant === "primary" && "bg-teal-600 text-white shadow-soft shadow-teal-900/10",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-900",
        variant === "ghost" && "bg-transparent text-slate-700",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
