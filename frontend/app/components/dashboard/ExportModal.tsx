"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
  Calendar,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  ExportFormat,
  exportCsv,
  exportJson,
  exportPdf,
  filterByDateRange,
} from "../../services/ExportService";
import { useToast } from "../../context/ToastContext";
import ExportHistory from "./ExportHistory";

export type ExportDataType =
  | "transactions"
  | "goals"
  | "portfolio"
  | "analytics"
  | "tax-report";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataType: ExportDataType;
  title: string;
  /** All rows (unfiltered). Each row is a plain object. */
  rows: Record<string, unknown>[];
  /** Key in each row used for date-range filtering (e.g. "date") */
  dateKey?: string;
}

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    id: "csv",
    label: "CSV",
    description: "Spreadsheet-compatible",
    icon: FileSpreadsheet,
    color: "text-emerald-400",
  },
  {
    id: "json",
    label: "JSON",
    description: "Developer friendly",
    icon: FileJson,
    color: "text-cyan-400",
  },
  {
    id: "pdf",
    label: "PDF",
    description: "Print-ready report",
    icon: FileText,
    color: "text-violet-400",
  },
];

export default function ExportModal({
  isOpen,
  onClose,
  dataType,
  title,
  rows,
  dateKey = "date",
}: ExportModalProps) {
  const toast = useToast();
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    const filtered =
      dateKey && (from || to)
        ? filterByDateRange(rows, dateKey, from, to)
        : rows;

    if (filtered.length === 0) {
      toast.error("No data", "No records match the selected date range.");
      setLoading(false);
      return;
    }

    try {
      if (format === "csv") {
        exportCsv(filtered, dataType);
      } else if (format === "json") {
        exportJson(filtered, dataType);
      } else {
        await exportPdf(filtered, dataType, title);
      }
      setDone(true);
      toast.success(
        "Export complete",
        `${filtered.length} record${filtered.length !== 1 ? "s" : ""} exported as ${format.toUpperCase()}.`,
      );
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1600);
    } catch (err) {
      console.error(err);
      toast.error("Export failed", "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = (() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return dateKey && (from || to)
      ? filterByDateRange(rows, dateKey, from, to)
      : rows;
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(4, 12, 14, 0.85)", backdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl"
        style={{
          background: "linear-gradient(160deg, #0c2228 0%, #071518 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#063d3d] to-[#0a6060] flex items-center justify-center text-cyan-400">
              <Download size={17} />
            </div>
            <div>
              <h2
                id="export-modal-title"
                className="text-white font-bold text-base m-0"
              >
                Export {title}
              </h2>
              <p className="text-[#5e8c96] text-xs m-0 mt-0.5">
                {rows.length} total records available
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5e8c96] hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close export modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Format selection */}
          <div>
            <p className="text-xs uppercase tracking-widest text-[#5e8c96] mb-3 font-semibold">
              Export Format
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {FORMAT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = format === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormat(opt.id)}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all text-center ${
                      selected
                        ? "border-cyan-500/60 bg-cyan-500/10"
                        : "border-white/5 bg-white/3 hover:border-white/10"
                    }`}
                  >
                    <Icon
                      size={22}
                      className={selected ? opt.color : "text-[#5e8c96]"}
                    />
                    <div>
                      <p
                        className={`text-sm font-bold m-0 ${selected ? "text-white" : "text-[#8cb4bc]"}`}
                      >
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-[#4e6e78] m-0 mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div>
            <p className="text-xs uppercase tracking-widest text-[#5e8c96] mb-3 font-semibold flex items-center gap-2">
              <Calendar size={13} />
              Date Range
              <span className="normal-case text-[#3a5c66] font-normal tracking-normal">
                (optional)
              </span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#4e6e78] uppercase tracking-wider block mb-1.5">
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-[#0a1c22] border border-white/5 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/40 transition-colors"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div>
                <label className="text-[10px] text-[#4e6e78] uppercase tracking-wider block mb-1.5">
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-[#0a1c22] border border-white/5 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/40 transition-colors"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
          </div>

          {/* Records preview badge */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/3 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
            <p className="text-sm text-[#a0c8d0] m-0">
              <span className="font-bold text-white">{filtered.length}</span> record
              {filtered.length !== 1 ? "s" : ""} will be exported
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/8 text-[#6a8a93] font-medium text-sm hover:text-white hover:border-white/15 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading || done}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-[#061a1a] font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exporting…
              </>
            ) : done ? (
              <>
                <CheckCircle2 size={16} />
                Done!
              </>
            ) : (
              <>
                <Download size={16} />
                Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>

        {/* History Section */}
        <div className="border-t border-white/5 bg-black/20 p-6 rounded-b-2xl">
          <ExportHistory />
        </div>
      </div>
    </div>
  );
}
