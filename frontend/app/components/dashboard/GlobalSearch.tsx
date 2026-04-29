"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { History, Search, Sparkles, X } from "lucide-react";
import { buildSearchIndex, type SearchEntry } from "./search-data";

const RECENT_SEARCH_KEY = "nestera-recent-searches";
const MAX_RECENT = 6;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(items: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function scoreEntry(entry: SearchEntry, query: string) {
  const fields = [entry.title, entry.description, entry.category, ...entry.keywords].join(" ").toLowerCase();
  if (!query) return 0;
  if (entry.title.toLowerCase() === query) return 100;
  if (entry.title.toLowerCase().includes(query)) return 90;
  if (fields.includes(query)) return 75;
  return 0;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const deferredQuery = useDeferredValue(query);
  const index = useMemo(() => buildSearchIndex(), []);

  useEffect(() => {
    setRecent(loadRecentSearches());
  }, []);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const field = document.getElementById("global-search-input");
      if (field instanceof HTMLInputElement) {
        field.focus();
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const results = useMemo(() => {
    const q = normalize(deferredQuery);
    if (!q) {
      return index.slice(0, 6);
    }

    return index
      .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.entry);
  }, [deferredQuery, index]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(results.length - 1, 0)));
  }, [results.length]);

  function rememberSearch(value: string) {
    const next = [value, ...recent.filter((item) => item !== value)].slice(0, MAX_RECENT);
    setRecent(next);
    saveRecentSearches(next);
  }

  function openResult(entry: SearchEntry) {
    rememberSearch(entry.title);
    setOpen(false);
    router.push(entry.href);
  }

  function submitSearch(value: string) {
    const q = value.trim();
    if (!q) return;

    const match = results[activeIndex] ?? results[0];
    if (match) {
      openResult(match);
      return;
    }

    rememberSearch(q);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, results.length - 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter") {
      event.preventDefault();
      submitSearch(query);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full max-w-[280px] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-left text-sm text-[var(--color-text-muted)] shadow-sm hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
        aria-label="Open global search"
      >
        <Search size={16} />
        <span className="flex-1">Search goals, pools, and transactions</span>
        <span className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Cmd+K
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-[var(--color-overlay)] px-4 pt-16 backdrop-blur-md sm:pt-24"
          role="dialog"
          aria-modal="true"
          aria-label="Global search"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-4">
              <Search size={18} className="text-[var(--color-text-muted)]" />
              <input
                id="global-search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search goals, pools, transactions, and pages"
                className="w-full border-0 bg-transparent text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                aria-label="Search site content"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]"
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-0 md:grid-cols-[1.35fr_0.85fr]">
              <div className="max-h-[60vh] overflow-y-auto border-r border-[var(--color-border)] p-2">
                {results.length > 0 ? (
                  results.map((entry, indexPosition) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => openResult(entry)}
                      className={`flex w-full items-start gap-3 rounded-2xl px-4 py-4 text-left transition-colors ${
                        indexPosition === activeIndex
                          ? "bg-[var(--color-accent-soft)]"
                          : "hover:bg-[var(--color-surface-subtle)]"
                      }`}
                    >
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                        {entry.category === "transactions" ? <History size={16} /> : <Sparkles size={16} />}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-[var(--color-text)]">
                          {entry.title}
                        </span>
                        <span className="mt-1 block text-sm text-[var(--color-text-muted)]">
                          {entry.description}
                        </span>
                      </span>
                      <span className="rounded-full border border-[var(--color-border)] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                        {entry.category}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                      <Search size={22} />
                    </div>
                    <h3 className="text-base font-semibold text-[var(--color-text)]">No matches found</h3>
                    <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
                      Try a different keyword like goal name, pool strategy, transaction type, or page title.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-6 p-5">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-text-muted)]">
                    Recent searches
                  </p>
                  {recent.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recent.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setQuery(item)}
                          className="rounded-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Recent searches will appear here after you use the command palette.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-text-muted)]">
                    Tips
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
                    <li>Use <span className="font-semibold text-[var(--color-text)]">Cmd+K</span> from anywhere.</li>
                    <li>Arrow keys move through results.</li>
                    <li>Enter opens the highlighted result.</li>
                    <li>Escape closes the search dialog.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
