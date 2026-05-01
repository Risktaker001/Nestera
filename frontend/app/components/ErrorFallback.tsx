"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, House, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";

type ErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
  title?: string;
  description?: string;
};

export default function ErrorFallback({
  error,
  reset,
  homeHref = "/",
  title = "Something went wrong",
  description = "We hit an unexpected error while rendering this view. You can retry or return to a safe page.",
}: ErrorFallbackProps) {
  useEffect(() => {
    console.error("Nestera React error boundary caught an error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-16 text-[var(--color-text)]">
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <AlertTriangle size={28} />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-text-muted)]">
          Error boundary
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--color-text-muted)]">
          {description}
        </p>
        <p className="mt-4 max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">
          {error.message}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="primary" size="md" leftIcon={<RefreshCw size={16} />} onClick={reset}>
            Try again
          </Button>
          <Link
            href={homeHref}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] no-underline hover:border-[var(--color-border-strong)]"
          >
            <House size={16} />
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
