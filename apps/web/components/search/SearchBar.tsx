"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  isLoading?: boolean;
  mode?: "hero" | "compact";
}

export function SearchBar({ value, onChange, onSubmit, isLoading = false, mode = "compact" }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => onChange(localValue), 300);
    return () => window.clearTimeout(timer);
  }, [localValue, onChange]);

  const wrapperClassName = useMemo(
    () =>
      mode === "hero"
        ? "mx-auto w-full max-w-2xl rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-md)]"
        : "w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2",
    [mode]
  );

  const buttonSize = mode === "hero" ? "h-14 w-14" : "h-11 w-11";
  const iconSize = mode === "hero" ? 22 : 18;

  const triggerSearch = () => {
    onChange(localValue);
    onSubmit?.(localValue);
  };

  return (
    <div className={wrapperClassName}>
      <div className="flex items-center gap-2">
        <Input
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              triggerSearch();
            }
          }}
          placeholder="Search Jollof Rice, Egusi, Injera..."
          className={mode === "hero" ? "h-14 text-base" : "h-11"}
        />
        {localValue ? (
          <button
            type="button"
            onClick={() => setLocalValue("")}
            className="h-10 rounded-[var(--radius-md)] px-3 text-sm text-[var(--color-text-muted)]"
            aria-label="Clear search"
          >
            Clear
          </button>
        ) : null}
        <button
          type="submit"
          onClick={triggerSearch}
          disabled={isLoading}
          aria-label="Search"
          className={`flex ${buttonSize} shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70`}
        >
          {isLoading ? (
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              role="status"
              aria-label="Searching"
            />
          ) : (
            <Search size={iconSize} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

// FLUTTER NOTE:
// This component maps to: TextField + debounced controller wrapper
// Design tokens used: --radius-xl, --radius-lg, --radius-md, --color-border, --color-surface, --shadow-md, --color-text-muted, --color-primary
// State management equivalent: BLoC query-changed event with debounce
// API call: searchFood