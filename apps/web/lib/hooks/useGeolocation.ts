"use client";

import { useEffect, useState } from "react";

import { usePreferencesStore } from "@/lib/store/preferencesStore";

interface GeolocationState {
  lat: number;
  lng: number;
  isLoading: boolean;
  error: string | null;
}

const DC_FALLBACK = { lat: 38.9072, lng: -77.0369 };

export function useGeolocation(): GeolocationState {
  const preferred = usePreferencesStore((s) => s.preferredLocation);
  const prefsHydrated = usePreferencesStore((s) => s._hasHydrated);

  const [state, setState] = useState<GeolocationState>({
    lat: DC_FALLBACK.lat,
    lng: DC_FALLBACK.lng,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Wait for persisted preferences so we don't briefly geolocate then override.
    if (!prefsHydrated) return;

    // A saved location preference (set on the Profile screen) wins.
    if (preferred) {
      setState({ lat: preferred.lat, lng: preferred.lng, isLoading: false, error: null });
      return;
    }

    if (!navigator.geolocation) {
      setState({
        lat: DC_FALLBACK.lat,
        lng: DC_FALLBACK.lng,
        isLoading: false,
        error: "Geolocation not supported; using Washington, DC fallback."
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isLoading: false,
          error: null
        });
      },
      (error) => {
        setState({
          lat: DC_FALLBACK.lat,
          lng: DC_FALLBACK.lng,
          isLoading: false,
          error: `Location unavailable (${error.code}); using Washington, DC fallback.`
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [prefsHydrated, preferred]);

  return state;
}
