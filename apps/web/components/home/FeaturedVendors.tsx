"use client";

import { ArrowRight, MapPin, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { getVendors } from "@/lib/api";
import type { VendorSummary } from "@/types";

interface FeaturedVendorsProps {
  initialVendors: VendorSummary[];
}

function formatDistance(km: number | null): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export function FeaturedVendors({ initialVendors }: FeaturedVendorsProps) {
  const [vendors, setVendors] = useState<VendorSummary[]>(initialVendors);

  // Progressive enhancement: once we have the user's location, re-fetch
  // featured vendors with coordinates so the backend returns distance_km
  // (PostGIS) and orders them by proximity.
  useEffect(() => {
    if (!navigator.geolocation) return;

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const nearby = await getVendors({
            is_featured: true,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            page_size: 6
          });
          if (!cancelled && nearby.length > 0) {
            setVendors(nearby);
          }
        } catch {
          // Keep the server-rendered list on failure.
        }
      },
      () => {
        // Permission denied or unavailable — keep the default list.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (vendors.length === 0) return null;

  return (
    <section className="bg-[var(--color-surface-hover)] px-4 py-14 md:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="display-font text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
              Featured Restaurants
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Highly rated, community-loved spots
            </p>
          </div>
          <Link
            href="/search?type=restaurant"
            className="hidden shrink-0 items-center gap-1.5 rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-light)] sm:inline-flex"
          >
            View all
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.slice(0, 6).map((vendor) => {
            const distance = formatDistance(vendor.distance_km);
            return (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.slug}`}
                className="group overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                {vendor.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vendor.image_url}
                    alt={vendor.name}
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="food-gradient-vendor h-40 w-full" />
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="display-font text-lg font-bold text-[var(--color-text-primary)]">
                      {vendor.name}
                    </h3>
                    {vendor.is_featured && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-dark)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-inverse)]">
                        <Star size={10} fill="currentColor" />
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="mb-3 line-clamp-1 text-sm text-[var(--color-text-muted)]">
                    {vendor.address}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={vendor.type === "grocery_store" ? "grocery" : "restaurant"} />
                    {vendor.is_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-grocery-light)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-grocery)]">
                        <ShieldCheck size={11} />
                        Verified
                      </span>
                    )}
                    {distance && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-hover)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                        <MapPin size={11} />
                        {distance}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
