"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  Filter, 
  X, 
  History, 
  Bookmark, 
  Calendar, 
  DollarSign, 
  ChevronDown,
  Trash2,
  Share2
} from "lucide-react";
import { RangeFilter, SavedFilter } from "../../hooks/useSearchFilter";

interface SearchFilterSystemProps {
  query: string;
  setQuery: (q: string) => void;
  ranges: RangeFilter[];
  setRanges: (r: RangeFilter[]) => void;
  history: string[];
  addToHistory: (q: string) => void;
  presets: SavedFilter[];
  savePreset: (name: string) => void;
  applyPreset: (preset: SavedFilter) => void;
  clearFilters: () => void;
  placeholder?: string;
}

export default function SearchFilterSystem({
  query,
  setQuery,
  ranges,
  setRanges,
  history,
  addToHistory,
  presets,
  savePreset,
  applyPreset,
  clearFilters,
  placeholder = "Search with AND, OR, NOT or field:value..."
}: SearchFilterSystemProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHistory(false);
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (historyIndex >= 0 && history[historyIndex]) {
      setQuery(history[historyIndex]);
    }
    addToHistory(query);
    setShowHistory(false);
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && showHistory) {
      e.preventDefault();
      setHistoryIndex(prev => Math.min(prev + 1, history.length - 1));
    } else if (e.key === "ArrowUp" && showHistory) {
      e.preventDefault();
      setHistoryIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && showHistory && historyIndex >= 0) {
      e.preventDefault();
      setQuery(history[historyIndex]);
      setShowHistory(false);
      setHistoryIndex(-1);
    } else if (e.key === "Escape") {
      setShowHistory(false);
      setShowFilters(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Filter URL copied to clipboard!");
  };

  const updateRange = (field: string, min?: string | number, max?: string | number) => {
    const existing = ranges.find(r => r.field === field);
    let next: RangeFilter[];
    if (existing) {
      next = ranges.map(r => r.field === field ? { ...r, min, max } : r);
    } else {
      next = [...ranges, { field, min, max }];
    }
    // Filter out empty ranges
    setRanges(next.filter(r => r.min !== undefined || r.max !== undefined));
  };

  const removeRange = (field: string) => {
    setRanges(ranges.filter(r => r.field !== field));
  };

  return (
    <div className="w-full space-y-4" ref={containerRef}>
      {/* Search Bar Row */}
      <div className="relative flex items-center gap-3">
        <form 
          onSubmit={handleSearchSubmit}
          className="relative flex-1 group"
        >
          <Search 
            size={18} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" 
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowHistory(true);
            }}
            onFocus={() => setShowHistory(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full h-12 pl-12 pr-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)] transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <X size={16} />
            </button>
          )}

          {/* History / Suggestions Dropdown */}
          {showHistory && history.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-xl animate-in fade-in slide-in-from-top-2">
              <div className="p-2">
                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Recent Searches</p>
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      setShowHistory(false);
                      setHistoryIndex(-1);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--color-text)] transition-colors ${
                      idx === historyIndex ? "bg-[var(--color-accent-soft)]" : "hover:bg-[var(--color-surface-subtle)]"
                    }`}
                  >
                    <History size={14} className="text-[var(--color-text-muted)]" />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-12 items-center gap-2 px-5 rounded-2xl border transition-all ${
            showFilters || ranges.length > 0
              ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
          }`}
        >
          <Filter size={18} />
          <span className="hidden sm:inline font-semibold">Filters</span>
          {ranges.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] text-white font-bold">
              {ranges.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all"
          title="Share filter URL"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="p-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-lg animate-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Date Range */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--color-text)]">
                <Calendar size={16} className="text-[var(--color-accent)]" />
                <span className="font-bold">Date Range</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
                  onChange={(e) => updateRange("date", e.target.value, ranges.find(r => r.field === "date")?.max as string)}
                />
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
                  onChange={(e) => updateRange("date", ranges.find(r => r.field === "date")?.min as string, e.target.value)}
                />
              </div>
            </div>

            {/* Amount Range */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--color-text)]">
                <DollarSign size={16} className="text-[var(--color-accent)]" />
                <span className="font-bold">Amount Range</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
                  onChange={(e) => updateRange("amount", parseFloat(e.target.value) || undefined, ranges.find(r => r.field === "amount")?.max as number)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
                  onChange={(e) => updateRange("amount", ranges.find(r => r.field === "amount")?.min as number, parseFloat(e.target.value) || undefined)}
                />
              </div>
            </div>

            {/* Presets Management */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--color-text)]">
                <Bookmark size={16} className="text-[var(--color-accent)]" />
                <span className="font-bold">Saved Presets</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.length > 0 ? (
                  presets.map(p => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p)}
                      className="px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors"
                    >
                      {p.name}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)] italic">No presets saved yet</p>
                )}
                <button
                  onClick={() => setShowSavePreset(true)}
                  className="px-3 py-1.5 rounded-full bg-[var(--color-accent-soft)] text-xs text-[var(--color-accent)] font-bold hover:bg-[var(--color-accent)] hover:text-white transition-all"
                >
                  + Save Current
                </button>
              </div>
            </div>
          </div>

          {showSavePreset && (
            <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex items-center gap-4">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name..."
                className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
              <button
                onClick={() => {
                  if (presetName) {
                    savePreset(presetName);
                    setPresetName("");
                    setShowSavePreset(false);
                  }
                }}
                className="px-6 py-2 rounded-xl bg-[var(--color-accent)] text-white font-bold text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setShowSavePreset(false)}
                className="px-4 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Bar */}
      {(query || ranges.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {query && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-sm text-[var(--color-text)]">
              <span className="text-[var(--color-text-muted)] text-[10px] font-bold uppercase tracking-wider">Search:</span>
              {query}
              <button onClick={() => setQuery("")}><X size={14} /></button>
            </span>
          )}
          {ranges.map(r => (
            <span key={r.field} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-sm text-[var(--color-text)]">
              <span className="text-[var(--color-text-muted)] text-[10px] font-bold uppercase tracking-wider">{r.field}:</span>
              {r.min || "*"} - {r.max || "*"}
              <button onClick={() => removeRange(r.field)}><X size={14} /></button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-danger)] font-bold hover:underline"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
