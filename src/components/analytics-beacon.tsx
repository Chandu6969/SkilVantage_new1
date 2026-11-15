"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const key = `sv-view:${pathname}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    let visitorId = localStorage.getItem("sv-visitor");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("sv-visitor", visitorId);
    }
    const width = window.innerWidth;
    const device = width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
    const courseMatch = pathname.match(/^\/programs\/([^/]+)/);
    const course = courseMatch?.[1] ?? null;
    let source: string | null = null;
    try {
      if (document.referrer) source = new URL(document.referrer).hostname.slice(0, 80);
    } catch {
      source = null;
    }
    void fetch("/api/v1/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        device,
        course,
        eventType: course ? "course_view" : "page_view",
        source,
        visitorId,
      }),
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
