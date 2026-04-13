"use client";

import { useMapStore } from "@/lib/store/mapStore";

export function useMap() {
  const { viewport, setViewport } = useMapStore();

  const updateViewport = (latitude: number, longitude: number, zoom: number) => {
    setViewport({ latitude, longitude, zoom });
  };

  return {
    latitude: viewport.latitude,
    longitude: viewport.longitude,
    zoom: viewport.zoom,
    updateViewport
  };
}