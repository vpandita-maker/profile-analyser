"use client";

import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.location.pathname.startsWith("/dashboard")) return;

    const controller = new AbortController();

    void fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer,
        search: window.location.search,
      }),
      keepalive: true,
      signal: controller.signal,
    }).catch(() => {
      // Visitor tracking should never block the app.
    });

    return () => controller.abort();
  }, []);

  return <>{children}</>;
}
