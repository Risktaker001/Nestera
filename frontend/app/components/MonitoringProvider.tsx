"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { addBreadcrumb, captureMessage } from "../lib/monitoring";

function getSlowRouteThreshold() {
  const value = Number(process.env.NEXT_PUBLIC_SLOW_ROUTE_THRESHOLD_MS ?? "3000");
  return Number.isFinite(value) && value > 0 ? value : 3000;
}

export default function MonitoringProvider() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const startedAt = performance.now();
    const from = previousPathname.current;

    addBreadcrumb({
      category: "navigation",
      message: "route.changed",
      level: "info",
      data: { from, to: pathname },
    });

    const frame = window.requestAnimationFrame(() => {
      const durationMs = Math.round(performance.now() - startedAt);
      const thresholdMs = getSlowRouteThreshold();

      if (durationMs > thresholdMs) {
        captureMessage("Slow route render", {
          level: "warning",
          tags: { route: pathname },
          data: { route: pathname, durationMs, thresholdMs },
        });
      } else {
        addBreadcrumb({
          category: "performance",
          message: "route.rendered",
          level: "info",
          data: { route: pathname, durationMs },
        });
      }
    });

    previousPathname.current = pathname;

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
