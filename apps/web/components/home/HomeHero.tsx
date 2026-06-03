"use client";

import { ArrowRight, Loader2, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useToast } from "@/lib/store/toastStore";

const SUGGESTIONS: ReadonlyArray<{ label: string; q: string }> = [
  { label: "Jollof Rice", q: "jollof" },
  { label: "Egusi Soup", q: "egusi" },
  { label: "Suya", q: "suya" },
  { label: "Fufu", q: "fufu" },
  { label: "Pepper Soup", q: "pepper-soup" }
];

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=2400&q=85&auto=format&fit=crop";

export function HomeHero() {
  const router = useRouter();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  function findNearMe() {
    if (!navigator.geolocation) {
      showToast("Location is not supported on this device", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push(`/search?lat=${latitude}&lng=${longitude}`);
      },
      () => {
        setLocating(false);
        showToast("Couldn't get your location. Try searching instead.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  return (
    <section
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6 py-24"
      aria-label="Hero"
    >
      {/* Background photo */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#1A0F08",
          backgroundImage: `linear-gradient(160deg,rgba(26,15,8,.35) 0%,rgba(45,21,8,.25) 40%,rgba(24,14,5,.45) 100%),url('${HERO_IMAGE}')`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
        aria-hidden="true"
      />
      {/* Darkening overlay for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 55%,rgba(0,0,0,.15) 0%,rgba(0,0,0,.55) 70%,rgba(0,0,0,.75) 100%)," +
            "linear-gradient(180deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,.25) 35%,rgba(0,0,0,.65) 100%)"
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-3xl text-center">
        <p className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[rgba(224,112,32,.4)] bg-[rgba(224,112,32,.2)] px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-[rgba(255,200,160,.9)]">
          <MapPin size={12} />
          African Food Discovery
        </p>

        <h1 className="display-font text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
          African food.
          <br />
          <span className="text-[#F09060]">Right around the corner.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base text-white/70 sm:text-lg">
          Restaurants, groceries, ingredients. Find it all.
        </p>

        {/* Search pill */}
        <form onSubmit={submitSearch} className="mx-auto mt-9 max-w-[580px]" role="search">
          <div
            className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 pl-5 shadow-[0_8px_32px_rgba(0,0,0,.35),0_0_0_4px_rgba(224,112,32,.2)] transition focus-within:shadow-[0_8px_32px_rgba(0,0,0,.45),0_0_0_4px_rgba(224,112,32,.35)]"
          >
            <Search size={20} className="shrink-0 text-[var(--color-primary)]" strokeWidth={2.5} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, restaurants, or cuisines…"
              aria-label="Search for African food"
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[#1A1A1A] outline-none placeholder:text-[#9B958F]"
            />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
            >
              <span className="hidden sm:inline">Search</span>
              <ArrowRight size={16} strokeWidth={2.5} className="sm:hidden" />
            </button>
          </div>
        </form>

        {/* Find Near Me */}
        <div className="mt-4">
          <button
            type="button"
            onClick={findNearMe}
            disabled={locating}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-70"
          >
            {locating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
            {locating ? "Locating you…" : "Find restaurants near me"}
          </button>
        </div>

        {/* Suggestions */}
        <p className="mt-6 text-sm text-white/50">
          <span className="font-medium text-white/75">Try:</span>{" "}
          {SUGGESTIONS.map((s, i) => (
            <span key={s.q}>
              <Link
                href={`/search?q=${s.q}`}
                className="text-[rgba(255,200,160,.8)] underline decoration-[rgba(255,200,160,.3)] transition hover:text-[rgba(255,200,160,1)]"
              >
                {s.label}
              </Link>
              {i < SUGGESTIONS.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
