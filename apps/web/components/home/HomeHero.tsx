"use client";

import { ArrowRight, ChefHat, Loader2, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useToast } from "@/lib/store/toastStore";

type Mode = "cook" | "order";

const SUGGESTIONS: ReadonlyArray<{ label: string; q: string }> = [
  { label: "Jollof Rice", q: "jollof" },
  { label: "Egusi Soup", q: "egusi" },
  { label: "Suya", q: "suya" },
  { label: "Fufu", q: "fufu" },
  { label: "Pepper Soup", q: "pepper-soup" }
];

// Hero imagery — African home cooking. Desktop is a single landscape photo (the
// couple); mobile crossfades through portrait shots. Files live in
// apps/web/public/hero/ (see the README there).
const HERO_DESKTOP_IMAGE = "/hero/hero-1.jpg";
interface MobileSlide {
  src: string;
  /** background-position; lower % lifts the subject higher in frame. */
  position: string;
  alt: string;
}
const HERO_MOBILE_SLIDES: ReadonlyArray<MobileSlide> = [
  { src: "/hero/hero-1-mobile.jpg", position: "center 12%", alt: "A woman cooking in her kitchen" },
  { src: "/hero/hero-2-mobile.jpg", position: "center 25%", alt: "A smiling chef mixing batter" }
];
const SLIDE_INTERVAL_MS = 6000;

const COPY: Record<Mode, { placeholder: string; cta: string }> = {
  cook: {
    placeholder: "Search a dish to cook — Jollof, Egusi, Injera…",
    cta: "Get the recipe"
  },
  order: {
    placeholder: "Search restaurants, dishes, or cuisines…",
    cta: "Find it nearby"
  }
};

export function HomeHero() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>("cook");
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [slide, setSlide] = useState(0);

  // Auto-advance the mobile slideshow, unless the user prefers reduced motion.
  useEffect(() => {
    if (HERO_MOBILE_SLIDES.length < 2) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(
      () => setSlide((i) => (i + 1) % HERO_MOBILE_SLIDES.length),
      SLIDE_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (mode === "cook") {
      router.push(q ? `/foods?q=${encodeURIComponent(q)}` : "/foods");
    } else {
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    }
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
      className="relative flex min-h-[calc(100svh-8rem)] items-end justify-center overflow-hidden px-6 pb-14 pt-24 md:min-h-[calc(100svh-4rem)] md:pb-20 md:pt-28"
      aria-label="Hero"
    >
      {/* Background imagery */}
      <div className="absolute inset-0 bg-[#1A0F08]" aria-hidden="true">
        {/* Desktop — single static photo of the couple, biased up so faces clear the text */}
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            backgroundImage: `url('${HERO_DESKTOP_IMAGE}')`,
            backgroundSize: "cover",
            backgroundPosition: "center 30%"
          }}
        />
        {/* Mobile — crossfading portrait slideshow */}
        <div className="absolute inset-0 md:hidden">
          {HERO_MOBILE_SLIDES.map((s, i) => (
            <div
              key={s.src}
              className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out motion-reduce:transition-none"
              style={{
                opacity: i === slide ? 1 : 0,
                backgroundImage: `url('${s.src}')`,
                backgroundSize: "cover",
                backgroundPosition: s.position
              }}
            />
          ))}
        </div>
      </div>
      {/* Bottom-weighted scrim: keeps the faces (upper) visible while darkening
          the lower area where the text sits, for legibility. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,rgba(0,0,0,.34) 0%,rgba(0,0,0,.12) 26%,rgba(0,0,0,.30) 52%,rgba(0,0,0,.62) 74%,rgba(0,0,0,.86) 100%)"
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-3xl text-center">
        <p className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[rgba(242,59,47,.45)] bg-[rgba(242,59,47,.22)] px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-[rgba(255,190,170,.95)]">
          <ChefHat size={12} />
          Cook it or order it
        </p>

        <h1 className="display-font text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
          Cook African food
          <br />
          <span className="text-[var(--color-primary)]">right in your kitchen.</span>
        </h1>

        <p className="mx-auto mt-3 max-w-md text-base text-white/80 sm:mt-5 sm:text-lg">
          <span className="sm:hidden">Recipes, shopping lists & stores nearby.</span>
          <span className="hidden sm:inline">
            Get the recipe, shopping list, and where to buy it all nearby.
          </span>
        </p>

        {/* Mode toggle — Cook is the headline path */}
        <div className="mx-auto mt-5 inline-flex rounded-full border border-white/20 bg-black/25 p-1 backdrop-blur-sm sm:mt-8">
          <button
            type="button"
            onClick={() => setMode("cook")}
            aria-pressed={mode === "cook"}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition",
              mode === "cook"
                ? "bg-[var(--color-primary)] text-white shadow-[0_4px_14px_rgba(242,59,47,.45)]"
                : "text-white/80 hover:text-white"
            )}
          >
            <ChefHat size={16} strokeWidth={2.5} />
            Cook it yourself
          </button>
          <button
            type="button"
            onClick={() => setMode("order")}
            aria-pressed={mode === "order"}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition",
              mode === "order"
                ? "bg-white text-[var(--color-text-primary)] shadow-[0_4px_14px_rgba(0,0,0,.35)]"
                : "text-white/80 hover:text-white"
            )}
          >
            <MapPin size={16} strokeWidth={2.5} />
            Order nearby
          </button>
        </div>

        {/* Search pill */}
        <form onSubmit={submitSearch} className="mx-auto mt-5 max-w-[580px]" role="search">
          <div className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 pl-5 shadow-[0_8px_32px_rgba(0,0,0,.35),0_0_0_4px_rgba(242,59,47,.2)] transition focus-within:shadow-[0_8px_32px_rgba(0,0,0,.45),0_0_0_4px_rgba(242,59,47,.35)]">
            {mode === "cook" ? (
              <ChefHat size={20} className="shrink-0 text-[var(--color-primary)]" strokeWidth={2.5} />
            ) : (
              <Search size={20} className="shrink-0 text-[var(--color-primary)]" strokeWidth={2.5} />
            )}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={COPY[mode].placeholder}
              aria-label={mode === "cook" ? "Search a dish to cook" : "Search food near you"}
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[#1A1A1A] outline-none placeholder:text-[#9B958F]"
            />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
            >
              <span className="hidden sm:inline">{COPY[mode].cta}</span>
              <ArrowRight size={16} strokeWidth={2.5} className="sm:hidden" />
            </button>
          </div>
        </form>

        {/* Find Near Me — only meaningful for ordering */}
        {mode === "order" && (
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
        )}

        {/* Suggestions — hidden on mobile to keep the hero short */}
        <p className="mt-6 hidden text-sm text-white/50 sm:block">
          <span className="font-medium text-white/75">
            {mode === "cook" ? "Cook tonight:" : "Try:"}
          </span>{" "}
          {SUGGESTIONS.map((s, i) => (
            <span key={s.q}>
              <Link
                href={mode === "cook" ? `/foods?q=${s.q}` : `/search?q=${s.q}`}
                className="text-[rgba(255,190,170,.85)] underline decoration-[rgba(255,190,170,.35)] transition hover:text-[rgba(255,190,170,1)]"
              >
                {s.label}
              </Link>
              {i < SUGGESTIONS.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      </div>

      {/* Slide indicators — mobile only (desktop is a single image) */}
      {HERO_MOBILE_SLIDES.length > 1 && (
        <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2.5 md:hidden">
          {HERO_MOBILE_SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setSlide(i)}
              aria-label={`Show slide ${i + 1}: ${s.alt}`}
              aria-current={i === slide}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === slide ? "w-7 bg-white" : "w-2 bg-white/45 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
