"use client";

export const dynamic = "force-dynamic";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function DashboardLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Wrong password.");
        return;
      }
      const from = searchParams.get("from") || "/dashboard";
      router.replace(from);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-xs">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-black tracking-tight text-white">iHeartLinkedIn</h1>
          <p className="mt-1 text-xs text-slate-500">Founder Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={!password || loading}
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-black text-white transition-all hover:bg-teal-500 disabled:opacity-40"
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
