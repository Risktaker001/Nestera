"use client";

import ErrorFallback from "../components/ErrorFallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      homeHref="/dashboard"
      title="Dashboard failed to render"
      description="One of the dashboard widgets crashed. You can retry the page or return to the dashboard home."
    />
  );
}
