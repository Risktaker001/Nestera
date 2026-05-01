"use client";

import { useReportWebVitals } from "next/navigation";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log metric to console in development
    if (process.env.NODE_ENV === "development") {
      console.debug("Web Vitals:", metric);
    }

    // Send metric to Google Analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", metric.name, {
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value), // values must be integers
        event_label: metric.id, // id unique to current page load
        non_interaction: true, // avoids affecting bounce rate
        metric_value: metric.value,
        metric_rating: metric.rating,
      });
    }
  });

  return null;
}
