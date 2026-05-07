"use client";

import { X } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button className="absolute inset-0 bg-slate-950/45" aria-label="Close modal backdrop" onClick={onClose} />
      <div
        className={cn(
          "safe-bottom relative w-full rounded-t-2xl bg-white px-4 pb-4 pt-3 shadow-2xl",
          "animate-[sheet-up_180ms_ease-out]"
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
        <div className="mb-4 flex items-center justify-between">
          {title ? <h2 className="text-lg font-bold text-slate-950">{title}</h2> : <span />}
          <button className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
      <style jsx global>{`
        @keyframes sheet-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
