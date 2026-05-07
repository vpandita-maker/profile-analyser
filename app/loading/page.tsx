"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/Loading";

export default function AnalysisLoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(() => router.replace("/results"), 900);
    return () => window.clearTimeout(timeout);
  }, [router]);

  return <Loading label="Analyzing profile signals..." />;
}
