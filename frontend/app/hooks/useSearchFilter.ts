"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { filterItems, RangeFilter, FilterOptions } from "../utils/filterEngine";

const HISTORY_KEY = "nestera-search-history";
const PRESETS_KEY = "nestera-filter-presets";
const MAX_HISTORY = 10;

export interface SavedFilter {
  id: string;
  name: string;
  query: string;
  ranges: RangeFilter[];
}

export function useSearchFilter<T>(
  initialItems: T[],
  options: FilterOptions = {}
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State from URL or defaults
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [ranges, setRanges] = useState<RangeFilter[]>(() => {
    try {
      const r = searchParams.get("r");
      return r ? JSON.parse(r) : [];
    } catch {
      return [];
    }
  });

  // History and Presets (Persistence)
  const [history, setHistory] = useState<string[]>([]);
  const [presets, setPresets] = useState<SavedFilter[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    const savedPresets = localStorage.getItem(PRESETS_KEY);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedPresets) setPresets(JSON.parse(savedPresets));
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set("q", query);
    else params.delete("q");

    if (ranges.length > 0) params.set("r", JSON.stringify(ranges));
    else params.delete("r");

    const newUrl = `${pathname}?${params.toString()}`;
    // Use replace to avoid polluting history for every keystroke if needed, 
    // but here we might want to use a debounced version for the URL
  }, [query, ranges, pathname, searchParams]);

  // Derived filtered items
  const filteredItems = useMemo(() => {
    return filterItems(initialItems, query, ranges, options);
  }, [initialItems, query, ranges, options]);

  // Actions
  const addToHistory = useCallback((q: string) => {
    if (!q.trim()) return;
    setHistory(prev => {
      const next = [q, ...prev.filter(i => i !== q)].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const savePreset = useCallback((name: string) => {
    const newPreset: SavedFilter = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      query,
      ranges,
    };
    setPresets(prev => {
      const next = [...prev, newPreset];
      localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
      return next;
    });
  }, [query, ranges]);

  const applyPreset = useCallback((preset: SavedFilter) => {
    setQuery(preset.query);
    setRanges(preset.ranges);
  }, []);

  const clearFilters = useCallback(() => {
    setQuery("");
    setRanges([]);
  }, []);

  return {
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
    filteredItems,
  };
}
