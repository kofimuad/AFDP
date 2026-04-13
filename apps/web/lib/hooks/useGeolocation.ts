"use client";

import { useEffect, useState } from "react";

interface GeolocationState {
  lat: number;
  lng: number;
  isLoading: boolean;
  error: string | null;
}

const DC_FALLBACK = { lat: 38.9072, lng: -77.0369 };

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    lat: DC_FALLBACK.lat,
    lng: DC_FALLBACK.lng,
    isLoading: true,
    error: null
  });

  useEffect(() => {
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
  }, []);

  return state;
}