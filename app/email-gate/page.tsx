"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/Loading";
import { useAnalyzerStore } from "@/lib/store";

export default function EmailGatePage() {
  const router = useRouter();
  const analysis = useAnalyzerStore((state) => state.analysis);

  useEffect(() => {
    router.replace(analysis ? "/results" : "/");
  }, [analysis, router]);

  return <Loading label="Loading your results" />;
}
