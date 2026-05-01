"use client";

import React, { useEffect, useState } from "react";
import { Clock, Trash2, FileSpreadsheet, FileJson, FileText } from "lucide-react";
import { ExportLogEntry, getExportHistory } from "../../services/ExportService";

const FORMAT_ICON: Record<string, React.ElementType> = {
  csv: FileSpreadsheet,
  json: FileJson,
  pdf: FileText,
};

const FORMAT_COLOR: Record<string, string> = {
  csv: "text-emerald-400",
  json: "text-cyan-400",
  pdf: "text-violet-400",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ExportHistory() {
  const [history, setHistory] = useState<ExportLogEntry[]>([]);

  useEffect(() => {
    setHistory(getExportHistory());
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("nestera_export_history");
    setHistory([]);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <Clock size={22} className="text-[#4e7080]" />
        </div>
        <p className="text-[#5e8c96] text-sm">No exports yet</p>
        <p className="text-[#3a5060] text-xs mt-1">
          Your export history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#5e8c96]">
          <Clock size={15} />
          <span className="text-sm font-semibold">Export History</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-xs text-[#4e8090]">
            {history.length}
          </span>
        </div>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1.5 text-xs text-[#4e6e78] hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} />
          Clear all
        </button>
      </div>

      <div className="space-y-2">
        {history.map((entry) => {
          const Icon = FORMAT_ICON[entry.format] ?? FileSpreadsheet;
          const color = FORMAT_COLOR[entry.format] ?? "text-cyan-400";
          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors"
            >
              <Icon size={17} className={color} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate m-0">
                  {entry.filename}
                </p>
                <p className="text-xs text-[#4e7080] m-0 mt-0.5">
                  {entry.rowCount} row{entry.rowCount !== 1 ? "s" : ""} ·{" "}
                  {entry.dataType}
                </p>
              </div>
              <span className="text-xs text-[#3a5060] shrink-0">
                {timeAgo(entry.exportedAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
