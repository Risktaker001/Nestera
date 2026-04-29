"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  title: string;
  message?: string;
  type?: ToastType;
  onClose?: () => void;
  duration?: number;
}

const typeClasses: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 [&_.toast-accent]:bg-emerald-400",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-200 [&_.toast-accent]:bg-rose-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200 [&_.toast-accent]:bg-amber-400",
  info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100 [&_.toast-accent]:bg-cyan-400",
};

const typeIcon: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={17} />,
  error: <AlertCircle size={17} />,
  warning: <AlertTriangle size={17} />,
  info: <Info size={17} />,
};

export const Toast: React.FC<ToastProps> = ({ 
  title, 
  message, 
  type = "info", 
  onClose,
  duration = 4500 
}) => {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-sm transition-all duration-300",
        typeClasses[type]
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span className="mt-0.5 shrink-0">{typeIcon[type]}</span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-semibold">{title}</p>
          {message ? (
            <p className="m-0 mt-1 text-xs opacity-90">{message}</p>
          ) : null}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-current/80 hover:bg-white/10 hover:text-current transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div
        className="toast-accent h-1 animate-[toast-progress_linear_forwards]"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
};
