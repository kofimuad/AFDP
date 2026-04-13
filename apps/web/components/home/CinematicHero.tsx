"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Map from "react-map-gl";

import { SearchBar } from "@/components/search/SearchBar";
import { Logo } from "@/components/ui/Logo";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface HeroViewState {
  latitude: number;
  longitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

const INITIAL_VIEW_STATE: HeroViewState = {
  latitude: 38.9072,
  longitude: -77.0369,
  zoom: 12,
  pitch: 45,
  bearing: -15
};

interface FloatingItem {
  item: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size: string;
  duration: number;
  delay: number;
}

const FLOATING_ITEMS: ReadonlyArray<FloatingItem> = [
  { item: "🍲", top: "15%", left: "8%", size: "3.6rem", duration: 6.2, delay: 0 },
  { item: "🌶️", top: "20%", right: "10%", size: "2.8rem", duration: 7.1, delay: 0.4 },
  { item: "🥘", bottom: "30%", left: "5%", size: "4rem", duration: 6.8, delay: 0.8 },
  { item: "🫙", top: "60%", right: "6%", size: "3rem", duration: 7.5, delay: 1.1 },
  { item: "🍴", bottom: "25%", right: "15%", size: "2.7rem", duration: 6.4, delay: 1.4 },
  { item: "🌿", top: "40%", left: "12%", size: "3.2rem", duration: 7.3, delay: 1.8 }
] as const;

export function CinematicHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [viewState, setViewState] = useState<HeroViewState>(INITIAL_VIEW_STATE);
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setViewState(INITIAL_VIEW_STATE);
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setViewState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          zoom: 12,
          pitch: 45,
          bearing: -15
        });
        setIsLocating(false);
      },
      () => {
        setViewState(INITIAL_VIEW_STATE);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (isLocating) return;

    const timer = window.setInterval(() => {
      setViewState((prev) => ({
        ...prev,
        longitude: prev.longitude + 0.00008,
        bearing: prev.bearing + 0.003
      }));
    }, 100);

    return () => window.clearInterval(timer);
  }, [isLocating]);

  const floatingPositions = useMemo(() => FLOATING_ITEMS, []);

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 py-20">
      <div className="absolute inset-0 h-full w-full">
        {isLocating ? <div className="h-full w-full bg-black/80" /> : null}
        {!isLocating ? (
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            latitude={viewState.latitude}
            longitude={viewState.longitude}
            zoom={viewState.zoom}
            pitch={viewState.pitch}
            bearing={viewState.bearing}
            style={{ width: "100%", height: "100%" }}
            dragPan={false}
            dragRotate={false}
            scrollZoom={false}
            touchZoomRotate={false}
            doubleClickZoom={false}
            keyboard={false}
            interactive={false}
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.75) 100%)"
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        {floatingPositions.map((entry) => (
          <motion.span
            key={entry.item}
            className="absolute select-none"
            style={{
              top: entry.top,
              left: entry.left,
              right: entry.right,
              bottom: entry.bottom,
              fontSize: entry.size,
              opacity: 0.72
            }}
            animate={{ y: [0, -18, 0] }}
            transition={{ duration: entry.duration, repeat: Infinity, ease: "easeInOut", delay: entry.delay }}
          >
            {entry.item}
          </motion.span>
        ))}
      </div>

      <motion.div
        className="relative z-20 mx-auto flex w-full max-w-4xl flex-col items-center text-center"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <Logo variant="light" />
        <h1 className="display-font mt-6 text-5xl leading-tight text-[var(--color-text-inverse)] md:text-7xl">Discover African Food Near You.</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/75">
          Find restaurants, ingredients, and recipes — all in one place.
        </p>

        <form
          className="mt-8 w-full"
          onSubmit={(event) => {
            event.preventDefault();
            const q = query.trim();
            if (!q) return;
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <div
            className="mx-auto w-full max-w-[600px] overflow-hidden rounded-[var(--radius-xl)] border-l-4 border-l-[var(--color-primary)] transition-shadow focus-within:shadow-[0_0_0_2px_rgba(200,82,42,0.5),0_8px_32px_rgba(0,0,0,0.5)]"
            style={{
              boxShadow: "0 0 0 1px rgba(200,82,42,0.3), 0 8px 32px rgba(0,0,0,0.4)"
            }}
          >
            <SearchBar value={query} onChange={setQuery} mode="hero" />
          </div>
        </form>
      </motion.div>

    </section>
  );
}

// FLUTTER NOTE:
// This component maps to: Hero screen with non-interactive map backdrop + animated overlays
// Design tokens used: --color-text-inverse, --color-primary, --radius-xl
// State management equivalent: StatefulWidget with periodic camera drift timer
// API call: None (routes to search page)