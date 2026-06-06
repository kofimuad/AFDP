import { Clock, Globe, MapPin, Phone, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { GetDirectionsButton } from "@/components/vendor/GetDirectionsButton";
import { SaveVendorButton } from "@/components/vendor/SaveVendorButton";
import { VendorLocationMap } from "@/components/vendor/VendorLocationMap.client";
import { VendorMenu } from "@/components/vendor/VendorMenu";
import { getVendor } from "@/lib/api";

interface VendorDetailProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: VendorDetailProps) {
  const vendor = await getVendor(params.slug).catch(() => null);
  return {
    title: vendor ? `${vendor.name} | AFDP` : "Vendor | AFDP",
    description: vendor ? `${vendor.name} — ${vendor.address}` : "African food vendor on AFDP"
  };
}

export default async function VendorDetailPage({ params }: VendorDetailProps) {
  // getVendor logs a 'vendor' view event server-side, feeding the dashboard.
  const vendor = await getVendor(params.slug).catch(() => null);
  if (!vendor) notFound();

  const isGrocery = vendor.type === "grocery_store";
  const itemsLabel = isGrocery ? "Items" : "Menu";

  return (
    <main className="pb-12">
      {/* ── Hero ── */}
      <header className="relative">
        {vendor.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vendor.image_url} alt={vendor.name} className="h-56 w-full object-cover md:h-72" />
        ) : (
          <div className="food-gradient-vendor h-56 w-full md:h-72" />
        )}
        <div className="food-image-overlay absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-7xl px-4 pb-5 md:px-6 md:pb-6">
          <h1 className="display-font text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            {vendor.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={isGrocery ? "grocery" : "restaurant"} />
            {vendor.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-grocery-light)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-grocery)]">
                <ShieldCheck size={11} />
                Verified
              </span>
            )}
            {vendor.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-dark)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-inverse)]">
                <Star size={10} fill="currentColor" />
                Featured
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Info bar ── */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <MapPin size={15} className="shrink-0" />
            {vendor.address}
            {vendor.distance_km != null && (
              <span className="text-[var(--color-text-muted)]">· {vendor.distance_km.toFixed(1)} km away</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {vendor.lat != null && vendor.lng != null && (
              <GetDirectionsButton vendorLat={vendor.lat} vendorLng={vendor.lng} vendorName={vendor.name} />
            )}
            <SaveVendorButton
              variant="icon"
              vendor={{
                slug: vendor.slug,
                name: vendor.name,
                address: vendor.address,
                type: vendor.type,
                image_url: vendor.image_url
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="space-y-8">
          <section>
            <h2 className="display-font mb-4 text-2xl font-bold text-[var(--color-text-primary)]">{itemsLabel}</h2>
            <VendorMenu items={vendor.vendor_items} isGrocery={isGrocery} />
          </section>

          {vendor.lat != null && vendor.lng != null && (
            <section>
              <h2 className="display-font mb-4 text-2xl font-bold text-[var(--color-text-primary)]">Location</h2>
              <VendorLocationMap vendor={vendor} />
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Contact & info */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="display-font mb-3 text-base font-bold text-[var(--color-text-primary)]">Contact &amp; Info</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-[var(--color-text-muted)]">
                <MapPin size={15} className="mt-0.5 shrink-0" />
                <span>{vendor.address}</span>
              </li>
              {vendor.phone && (
                <li className="flex items-center gap-3 text-[var(--color-text-muted)]">
                  <Phone size={15} className="shrink-0" />
                  <a href={`tel:${vendor.phone}`} className="hover:text-[var(--color-primary)]">{vendor.phone}</a>
                </li>
              )}
              {vendor.website && (
                <li className="flex items-center gap-3 text-[var(--color-text-muted)]">
                  <Globe size={15} className="shrink-0" />
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-[var(--color-primary)] hover:underline"
                  >
                    {vendor.website.replace(/^https?:\/\//, "")}
                  </a>
                </li>
              )}
            </ul>
            {vendor.lat != null && vendor.lng != null && (
              <div className="mt-4">
                <GetDirectionsButton vendorLat={vendor.lat} vendorLng={vendor.lng} vendorName={vendor.name} />
              </div>
            )}
          </section>

          {/* Opening hours */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="display-font mb-3 flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
              <Clock size={16} className="text-[var(--color-text-muted)]" />
              Opening Hours
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Hours aren&rsquo;t listed yet. Call ahead or get directions to confirm before you go.
            </p>
          </section>

          {/* Tags */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="display-font mb-3 text-base font-bold text-[var(--color-text-primary)]">Tags</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant={isGrocery ? "grocery" : "restaurant"} />
              {vendor.is_verified && <Badge variant="verified" />}
              {vendor.is_featured && <Badge variant="featured" />}
            </div>
          </section>

          <Link
            href="/search"
            className="block w-full rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)]"
          >
            Back to results
          </Link>
        </aside>
      </div>
    </main>
  );
}
