"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Map, { Marker } from "react-map-gl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerVendorWithAuth } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import type { RegisterVendorPayload, VendorType } from "@/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DC_FALLBACK = { lat: 38.9072, lng: -77.0369 };

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  type: VendorType;
  address: string;
  phone: string;
  website: string;
  image_url: string;
}

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  type: "restaurant",
  address: "",
  phone: "",
  website: "",
  image_url: ""
};

export default function RegisterVendorPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const [latitude, setLatitude] = useState<number>(DC_FALLBACK.lat);
  const [longitude, setLongitude] = useState<number>(DC_FALLBACK.lng);
  const [hasMarker, setHasMarker] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLatitude(DC_FALLBACK.lat);
      setLongitude(DC_FALLBACK.lng);
      setHasMarker(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setHasMarker(true);
      },
      () => {
        setLatitude(DC_FALLBACK.lat);
        setLongitude(DC_FALLBACK.lng);
        setHasMarker(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const selectedLocationText = useMemo(() => {
    if (!hasMarker) return "Selected location: Not set";
    return `Selected location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }, [hasMarker, latitude, longitude]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!hasMarker) {
      setErrorMessage("Please place and drag the pin to your business location.");
      setIsSubmitting(false);
      return;
    }
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setErrorMessage("Full name, email, and password are required.");
      setIsSubmitting(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }
    try {
      const payload = {
        email: form.email.trim(),
        full_name: form.fullName.trim(),
        password: form.password,
        business_name: form.name.trim(),
        business_type: form.type,
        address: form.address.trim(),
        lat: latitude,
        lng: longitude,
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
      };
      const res = await registerVendorWithAuth(payload);
      setAuth(res.user, res.access_token, res.refresh_token);
      setSuccessMessage(`Registration submitted for ${res.user.email}. Redirecting to dashboard...`);
      setForm(INITIAL_FORM);
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-10 pt-20 md:px-6">
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <h1 className="display-font text-4xl text-[var(--color-text-primary)]">List Your Business</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Submit your restaurant or grocery store to appear in African food discovery results.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <h2 className="text-lg font-semibold mb-2">Create Your Vendor Account</h2>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Full name</span>
            <Input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Email</span>
            <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Password</span>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-gray-400 hover:text-gray-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <span>🙈</span> : <span>👁️</span>}
              </button>
            </div>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Confirm password</span>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-gray-400 hover:text-gray-600"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <span>🙈</span> : <span>👁️</span>}
              </button>
            </div>
          </label>
          <h2 className="text-lg font-semibold mt-6 mb-2">Your Business Details</h2>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Business name</span>
            <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--color-text-primary)]">Type</legend>
            <div className="flex gap-2">
              {[
                ["restaurant", "Restaurant"],
                ["grocery_store", "Grocery Store"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateField("type", value as VendorType)}
                  className={`rounded-[var(--radius-md)] border px-4 py-2 text-sm ${
                    form.type === value
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Address</span>
            <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} required />
          </label>

          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
            <Map
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              latitude={latitude}
              longitude={longitude}
              zoom={12}
              style={{ width: "100%", height: 350 }}
              onClick={(event) => {
                setLatitude(event.lngLat.lat);
                setLongitude(event.lngLat.lng);
                setHasMarker(true);
              }}
            >
              {hasMarker ? (
                <Marker
                  latitude={latitude}
                  longitude={longitude}
                  draggable
                  onDragEnd={(event) => {
                    setLatitude(event.lngLat.lat);
                    setLongitude(event.lngLat.lng);
                  }}
                >
                  <span className="text-2xl">📍</span>
                </Marker>
              ) : null}
            </Map>
          </div>

          <p className="text-sm text-[var(--color-text-primary)]">{selectedLocationText}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Drag the pin to your exact business location. This helps customers find you on the map.
          </p>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Phone (optional)</span>
            <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Website (optional)</span>
            <Input type="url" value={form.website} onChange={(e) => updateField("website", e.target.value)} />
          </label>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit registration"}
          </Button>
        </form>

        {successMessage ? (
          <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-grocery-light)] p-3 text-sm text-[var(--color-grocery)]">
            {successMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] p-3 text-sm text-[var(--color-primary)]">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}