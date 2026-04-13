"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SearchBar } from "@/components/search/SearchBar";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const q = query.trim();
        if (!q) return;
        router.push(`/search?q=${encodeURIComponent(q)}`);
      }}
      className="w-full"
    >
      <SearchBar value={query} onChange={setQuery} mode="hero" />
    </form>
  );
}

// FLUTTER NOTE:
// This component maps to: Search entry widget with submit navigation
// Design tokens used: Inherited from SearchBar token set
// State management equivalent: BLoC text input + submit event
// API call: None (navigates to discovery page)