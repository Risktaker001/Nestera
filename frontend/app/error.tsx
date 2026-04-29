"use client";

import ErrorFallback from "./components/ErrorFallback";

export default function RootError({
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
      homeHref="/"
      title="The app hit a render error"
      description="A component failed to render. Refreshing this part of the app usually restores the interface."
    />
  );
}
