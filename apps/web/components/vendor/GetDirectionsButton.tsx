"use client";

import { Loader2, Navigation2 } from "lucide-react";
import { useState } from "react";

interface GetDirectionsButtonProps {
  vendorLat: number;
  vendorLng: number;
  vendorName: string;
}

export function GetDirectionsButton({ vendorLat, vendorLng, vendorName }: GetDirectionsButtonProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const openGoogleMaps = (url: string) => {
    window.open(url, "_blank");
  };

  const handleGetDirections = () => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      openGoogleMaps(`https://www.google.com/maps/search/?api=1&query=${vendorLat},${vendorLng}`);
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        openGoogleMaps(`https://www.google.com/maps/dir/${userLat},${userLng}/${vendorLat},${vendorLng}`);
        setIsGettingLocation(false);
      },
      () => {
        openGoogleMaps(`https://www.google.com/maps/search/?api=1&query=${vendorLat},${vendorLng}`);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleGetDirections}
      disabled={isGettingLocation}
      aria-label={`Get directions to ${vendorName}`}
      className="inline-flex items-center gap-2 rounded-lg bg-[#C8522A] px-6 py-3 text-white transition-colors hover:bg-[#A8401E] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isGettingLocation ? <Loader2 size={16} className="animate-spin" /> : <Navigation2 size={16} />}
      {isGettingLocation ? "Getting location..." : "Get Directions"}
    </button>
  );
}

// FLUTTER NOTE:
// This component maps to: ElevatedButton.icon with location lookup state
// Design tokens used: -- none (uses existing CTA palette for parity in current web)
// State management equivalent: BLoC loading/success/fallback states for launch maps intent
// API call: None