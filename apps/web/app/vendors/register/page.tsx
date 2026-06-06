"use client";

import { CheckCircle2, Clock, Eye, EyeOff, LayoutDashboard, MapPin, ShoppingBasket, Store, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Map, { Marker } from "react-map-gl";

import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/input";
import {
  MultiStepForm,
  StepContent,
  StepIndicator,
  StepNav,
  type Step
} from "@/components/ui/MultiStepForm";
import { registerVendorWithAuth } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useToast } from "@/lib/store/toastStore";
import { cn } from "@/lib/utils";
import type { VendorType } from "@/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DC_FALLBACK = { lat: 38.9072, lng: -77.0369 };

const STEPS: Step[] = [
  { id: "account", title: "Account" },
  { id: "business", title: "Business" },
  { id: "location", title: "Location" }
];

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
  website: ""
};

export default function RegisterVendorPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [latitude, setLatitude] = useState(DC_FALLBACK.lat);
  const [longitude, setLongitude] = useState(DC_FALLBACK.lng);
  const [hasMarker, setHasMarker] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Pre-fill location from the device on mount.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setHasMarker(true);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // ── Per-step validation ──
  const validateAccount = (): boolean => {
    if (form.fullName.trim().length < 2) return fail("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return fail("Enter a valid email address.");
    if (form.password.length < 8) return fail("Password must be at least 8 characters.");
    if (form.password !== form.confirmPassword) return fail("Passwords do not match.");
    return true;
  };

  const validateBusiness = (): boolean => {
    if (form.name.trim().length < 2) return fail("Enter your business name.");
    if (form.address.trim().length < 4) return fail("Enter your business address.");
    return true;
  };

  const fail = (msg: string) => {
    showToast(msg, "error");
    return false;
  };

  const submitRegistration = async (): Promise<boolean> => {
    if (!hasMarker) return fail("Drop a pin on your business location.");
    setSubmitting(true);
    try {
      const res = await registerVendorWithAuth({
        email: form.email.trim(),
        full_name: form.fullName.trim(),
        password: form.password,
        business_name: form.name.trim(),
        business_type: form.type,
        address: form.address.trim(),
        lat: latitude,
        lng: longitude,
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined
      });
      setAuth(res.user, res.access_token, res.refresh_token);
      return true;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosErr.response?.status === 409) {
        fail("An account with this email already exists.");
      } else {
        fail(axiosErr.response?.data?.detail ?? "Registration failed. Please try again.");
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // ── Completion (pending verification) ──
  if (submitted) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-16 text-center md:px-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
          <CheckCircle2 size={32} />
        </span>
        <h1 className="display-font mt-5 text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          Registration submitted!
        </h1>
        <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
          Thanks for listing <strong className="text-[var(--color-text-primary)]">{form.name.trim()}</strong>. Our team
          reviews new businesses and will verify your listing within 24 hours.
        </p>

        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning-light)] px-3 py-1.5 text-xs font-bold text-[var(--color-warning)]">
          <Clock size={13} />
          Pending verification
        </span>

        <div className="mt-8 w-full space-y-2">
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            <LayoutDashboard size={16} />
            Go to your dashboard
          </Link>
          <Link
            href="/dashboard?tab=listings"
            className="flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)]"
          >
            Add your menu items
          </Link>
        </div>
      </main>
    );
  }

  // ── Wizard ──
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <h1 className="display-font text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          Register Your Business
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          List your restaurant or grocery store on AFDP — it&rsquo;s free to get started.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Wizard */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <MultiStepForm steps={STEPS} onComplete={() => setSubmitted(true)}>
            <StepIndicator className="mb-8" />

            {/* Step 1 — Account */}
            <StepContent stepIndex={0} className="space-y-4">
              <h2 className="display-font text-lg font-bold text-[var(--color-text-primary)]">Your account</h2>
              <FormField label="Full name" htmlFor="reg-name" required>
                <Input id="reg-name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" />
              </FormField>
              <FormField label="Email address" htmlFor="reg-email" required>
                <Input id="reg-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
              </FormField>
              <FormField label="Password" htmlFor="reg-pw" required hint="Minimum 8 characters">
                <Input
                  id="reg-pw"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  autoComplete="new-password"
                  iconRight={
                    <button type="button" onClick={() => setShowPassword((p) => !p)} aria-label={showPassword ? "Hide password" : "Show password"} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </FormField>
              <FormField label="Confirm password" htmlFor="reg-pw2" required>
                <Input
                  id="reg-pw2"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  autoComplete="new-password"
                  iconRight={
                    <button type="button" onClick={() => setShowConfirm((p) => !p)} aria-label={showConfirm ? "Hide password" : "Show password"} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </FormField>
              <StepNav nextLabel="Next: Business details" onNext={validateAccount} />
            </StepContent>

            {/* Step 2 — Business */}
            <StepContent stepIndex={1} className="space-y-4">
              <h2 className="display-font text-lg font-bold text-[var(--color-text-primary)]">Business details</h2>
              <FormField label="Business name" htmlFor="reg-biz" required>
                <Input id="reg-biz" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Jollof Kitchen" />
              </FormField>

              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-[var(--color-text-primary)]">Business type</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "restaurant" as const, label: "Restaurant", desc: "Dine-in, takeaway, street food", Icon: UtensilsCrossed },
                    { value: "grocery_store" as const, label: "Grocery Store", desc: "African ingredients & produce", Icon: ShoppingBasket }
                  ].map(({ value, label, desc, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set("type", value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 p-4 text-center transition",
                        form.type === value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]"
                      )}
                    >
                      <Icon size={24} className="text-[var(--color-primary)]" />
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</span>
                      <span className="text-xs leading-snug text-[var(--color-text-muted)]">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <FormField label="Address" htmlFor="reg-addr" required>
                <Input id="reg-addr" value={form.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" placeholder="14 Lagos Street, London SW9 8PF" />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Phone" htmlFor="reg-phone" hint="Optional">
                  <Input id="reg-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
                </FormField>
                <FormField label="Website" htmlFor="reg-web" hint="Optional">
                  <Input id="reg-web" type="url" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
                </FormField>
              </div>
              <StepNav nextLabel="Next: Pin your location" onNext={validateBusiness} />
            </StepContent>

            {/* Step 3 — Location */}
            <StepContent stepIndex={2} className="space-y-4">
              <h2 className="display-font text-lg font-bold text-[var(--color-text-primary)]">Pin your location</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Drag the pin to your exact location so customers can find you.
              </p>

              <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
                <Map
                  mapboxAccessToken={MAPBOX_TOKEN}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  latitude={latitude}
                  longitude={longitude}
                  zoom={13}
                  style={{ width: "100%", height: 320 }}
                  onClick={(e) => {
                    setLatitude(e.lngLat.lat);
                    setLongitude(e.lngLat.lng);
                    setHasMarker(true);
                  }}
                >
                  {hasMarker && (
                    <Marker
                      latitude={latitude}
                      longitude={longitude}
                      draggable
                      onDragEnd={(e) => {
                        setLatitude(e.lngLat.lat);
                        setLongitude(e.lngLat.lng);
                      }}
                    >
                      <MapPin size={32} className="-translate-y-1/2 fill-[var(--color-primary)] text-white" />
                    </Marker>
                  )}
                </Map>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-[var(--color-text-primary)]">
                  {hasMarker ? `Pinned: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : "No location set yet"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) return showToast("Location not supported", "error");
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLatitude(pos.coords.latitude);
                        setLongitude(pos.coords.longitude);
                        setHasMarker(true);
                        showToast("Location updated", "success");
                      },
                      () => showToast("Couldn't get your location", "error"),
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)]"
                >
                  <MapPin size={13} />
                  Use my location
                </button>
              </div>

              <StepNav submitLabel="Submit registration" onNext={submitRegistration} loading={submitting} />
            </StepContent>
          </MultiStepForm>
        </div>

        {/* What happens next */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="display-font text-base font-bold text-[var(--color-text-primary)]">What happens next?</p>
            <ol className="mt-4 space-y-4">
              {[
                { Icon: Store, text: "Submit your business details" },
                { Icon: Clock, text: "We verify your listing (≤ 24 hrs)" },
                { Icon: CheckCircle2, text: "Your listing goes live on AFDP" },
                { Icon: LayoutDashboard, text: "Add menu items from your dashboard" }
              ].map(({ Icon, text }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                    <Icon size={15} />
                  </span>
                  <span className="pt-1.5 text-sm text-[var(--color-text-muted)]">{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </main>
  );
}
