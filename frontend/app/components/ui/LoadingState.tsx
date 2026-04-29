import React from "react";
import { Loader2 } from "lucide-react";

export function Spinner({
  text = "Loading...",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] ${className}`}>
      <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
      <span>{text}</span>
    </div>
  );
}

export function SkeletonLine({ className = "", shimmer = true }: { className?: string; shimmer?: boolean }) {
  return (
    <div 
      className={`relative overflow-hidden rounded-md bg-white/5 ${className}`}
      role="status"
      aria-label="Loading..."
    >
      <div className={`h-full w-full animate-pulse bg-white/5`} />
      {shimmer && (
        <div className="absolute inset-0 animate-shimmer" />
      )}
    </div>
  );
}

export function Skeleton({ 
  className = "", 
  variant = "rect",
  shimmer = true 
}: { 
  className?: string; 
  variant?: "rect" | "circle" | "text";
  shimmer?: boolean;
}) {
  const variantClasses = {
    rect: "rounded-md",
    circle: "rounded-full",
    text: "rounded-sm h-4 w-full",
  };

  return (
    <div 
      className={`relative overflow-hidden bg-white/5 ${variantClasses[variant]} ${className}`}
      role="status"
      aria-label="Loading content..."
    >
      <div className="h-full w-full animate-pulse bg-white/5" />
      {shimmer && (
        <div className="absolute inset-0 animate-shimmer" />
      )}
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <Skeleton variant="text" className="mb-4 w-40" />
      <Skeleton variant="rect" className="mb-3 h-10 w-full" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  );
}

