"use client";

import { Loader2, Navigation2 } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import Map, { NavigationControl, Popup } from "react-map-gl";

import { useMapStore } from "@/lib/store/mapStore";
import type { VendorSummary } from "@/types";

import { VendorPin } from "./VendorPin";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface MapViewProps {
  vendors: VendorSummary[];
  onVendorClick?: (vendor: VendorSummary) => void;
}

export function MapView({ vendors, onVendorClick }: MapViewProps) {
  const { viewport, setViewport, activeVendorId, setActiveVendorId } = useMapStore();
  const [popupVendorId, setPopupVendorId] = useState<string | null>(null);
  const [loadingDirectionsVendorId, setLoadingDirectionsVendorId] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  const mapStyle = resolvedTheme === "dark" ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12";

  const mapVendors = useMemo(() => vendors.filter((vendor) => vendor.lat != null && vendor.lng != null), [vendors]);

  const selectedVendor = useMemo(
    () => mapVendors.find((vendor) => vendor.id === (popupVendorId ?? activeVendorId)) ?? null,
    [mapVendors, popupVendorId, activeVendorId]
  );

  const openGoogleMaps = (url: string) => {
    window.open(url, "_blank");
  };

  const handleGetDirections = (vendor: VendorSummary) => {
    if (vendor.lat == null || vendor.lng == null) return;

    setLoadingDirectionsVendorId(vendor.id);

    if (!navigator.geolocation) {
      openGoogleMaps(`https://www.google.com/maps/search/?api=1&query=${vendor.lat},${vendor.lng}`);
      setLoadingDirectionsVendorId(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const originLat = position.coords.latitude;
        const originLng = position.coords.longitude;
        openGoogleMaps(`https://www.google.com/maps/dir/${originLat},${originLng}/${vendor.lat},${vendor.lng}`);
        setLoadingDirectionsVendorId(null);
      },
      () => {
        openGoogleMaps(`https://www.google.com/maps/search/?api=1&query=${vendor.lat},${vendor.lng}`);
        setLoadingDirectionsVendorId(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="h-[60vh] w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] lg:h-[calc(100vh-180px)]">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        longitude={viewport.longitude}
        latitude={viewport.latitude}
        zoom={viewport.zoom}
        onMove={(evt) =>
          setViewport({
            latitude: evt.viewState.latitude,
            longitude: evt.viewState.longitude,
            zoom: evt.viewState.zoom
          })
        }
      >
        <NavigationControl position="top-right" />
        {mapVendors.map((vendor) => {
          const isActive = vendor.id === activeVendorId;
          return (
            <VendorPin
              key={vendor.id}
              vendor={vendor}
              isActive={isActive}
              onClick={() => {
                setActiveVendorId(vendor.id);
                setPopupVendorId(vendor.id);
                onVendorClick?.(vendor);
              }}
            />
          );
        })}
        {selectedVendor ? (
          <Popup
            longitude={selectedVendor.lng ?? viewport.longitude}
            latitude={selectedVendor.lat ?? viewport.latitude}
            anchor="bottom"
            onClose={() => setPopupVendorId(null)}
            closeButton
            closeOnClick={false}
          >
            <div className="max-w-[240px] space-y-2">
              <p className="display-font text-base" style={{ color: resolvedTheme === 'dark' ? '#222' : 'var(--color-text-primary)' }}>{selectedVendor.name}</p>
              <p className="text-xs capitalize text-[var(--color-text-muted)]">{selectedVendor.type.replace("_", " ")}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{selectedVendor.address}</p>
              {selectedVendor.distance_km != null ? <p className="text-xs text-[var(--color-text-muted)]">{selectedVendor.distance_km.toFixed(1)} km away</p> : null}

              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleGetDirections(selectedVendor)}
                  disabled={loadingDirectionsVendorId === selectedVendor.id}
                  className="mt-0 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-[#C8522A] underline-offset-2 hover:text-[#A8401E] hover:underline disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingDirectionsVendorId === selectedVendor.id ? <Loader2 size={14} className="animate-spin" /> : <Navigation2 size={14} />}
                  {loadingDirectionsVendorId === selectedVendor.id ? "Getting location..." : "Get Directions"}
                </button>

                <Link href={`/vendors/${selectedVendor.slug}`} className="text-xs font-semibold text-[var(--color-primary)]">
                  View details
                </Link>
              </div>
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}

// FLUTTER NOTE:
// This component maps to: FlutterMap / MapboxMap widget with marker layer + popup sheet
// Design tokens used: --radius-lg, --color-border, --color-surface, --shadow-sm, --color-text-primary, --color-text-muted, --color-primary
// State management equivalent: BLoC map viewport + selected vendor state
// API call: Receives vendors from searchFood/getVendor/getFood